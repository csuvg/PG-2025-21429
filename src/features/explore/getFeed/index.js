import mongoose from "mongoose";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const uri = process.env.URI;
const backendUrl = process.env.BACKEND_URL;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!uri) {
  throw new Error("URI not found in the environment");
}

let conn = null;

const connect = async function () {
  if (conn == null) {
    conn = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    // `await`ing connection after assigning to the `conn` variable
    // to avoid multiple function calls creating new connections
    await conn.asPromise();
  }

  return conn;
};

// Initialize Gemini client
let geminiClient = null;
if (geminiApiKey) {
  geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
}

export const handler = async (event, _) => {
  try {
    const db = (await connect()).db;

    return await handleGetFeed(event, db);
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error: " + error.message,
      }),
    };
  }
};

const handleGetFeed = async (event, db) => {
  try {
    // Get authenticated user ID from authorizer
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized: Missing user ID" }),
      };
    }

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const limit = Math.min(parseInt(queryParams.limit) || 8, 20); // Max 20, default 8
    const offset = parseInt(queryParams.offset) || 0;

    // Find the user by clerk_id to get their MongoDB _id and user_tags
    const user = await db
      .collection("users")
      .findOne({ clerk_id: userId }, { projection: { _id: 1, user_tags: 1 } });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    const userTags = user.user_tags;
    if (!userTags || userTags.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "User tags not found. Please complete your profile first.",
        }),
      };
    }

    // Extract tag IDs from user tags
    // Assuming user_tags structure: [{ tag: "tag_id", ... }, ...]
    const userTagIds = userTags.map((tag) => tag.tag);

    // Get cards using aggregation pipeline to match tags and sort by relevance
    const aggregationPipeline = [
      {
        $match: {
          "display_data.tags": {
            $exists: true,
            $ne: null,
            $type: "array",
          }, // Ensure tags field exists and is an array
        },
      },
      {
        $addFields: {
          // Count how many user tags this card has (relevance)
          matchingTagCount: {
            $size: {
              $filter: {
                input: "$display_data.tags",
                as: "cardTag",
                cond: { $in: ["$$cardTag.id", userTagIds] },
              },
            },
          },
        },
      },
      {
        $match: {
          matchingTagCount: { $gt: 0 }, // Only include cards with at least one matching tag
        },
      },
      {
        $sort: {
          matchingTagCount: -1, // Sort by number of matching tags (most relevant first)
          _id: 1, // Secondary sort by _id for consistent ordering
        },
      },
    ];

    // Get total count for pagination
    const totalPipeline = [...aggregationPipeline, { $count: "total" }];
    const totalResult = await db
      .collection("cards")
      .aggregate(totalPipeline)
      .toArray();
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Get paginated cards
    const cardsPipeline = [
      ...aggregationPipeline,
      { $skip: offset },
      { $limit: limit - 1 }, // Reserve one spot for the AI-generated card
    ];
    const cards = await db
      .collection("cards")
      .aggregate(cardsPipeline)
      .toArray();

    // Generate and add AI card at the end
    try {
      const aiCard = await generateAICard(db);
      if (aiCard) {
        cards.push(aiCard);
      }
    } catch (error) {
      console.error("Error generating AI card:", error);
      // Continue without AI card if generation fails
    }

    // Calculate pagination info
    const hasMore = offset + limit < total;
    const nextOffset = offset + limit;

    // Build next batch URL
    let nextBatchUrl = null;
    if (hasMore) {
      nextBatchUrl = `${backendUrl}/explore/feed?offset=${nextOffset}&limit=${limit}`;
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: cards,
        pagination: {
          total,
          limit,
          offset,
          hasMore,
          nextOffset: hasMore ? nextOffset : null,
        },
        recommendations: {
          nextBatchUrl,
        },
      }),
    };
  } catch (error) {
    console.error("Error fetching feed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error fetching feed: " + error.message,
      }),
    };
  }
};

// Helper function to get a random career from the database
const getRandomCareer = async (db) => {
  const careers = await db
    .collection("careers")
    .aggregate([
      { $sample: { size: 1 } },
      {
        $project: {
          _id: 1,
          nombre_carrera: 1,
          plan_de_estudio: 1,
          tags: 1,
        },
      },
    ])
    .toArray();

  return careers[0];
};

// Generate an "Encuesta" card using AI
const generateEncuestaCard = async (db) => {
  if (!geminiClient) {
    return null;
  }

  const career = await getRandomCareer(db);
  if (!career) {
    throw new Error("Career not found");
  }

  const prompt = `Requerimientos: 
    - Genera SOLO la pregunta, sin NINGUNA introducción.
    - Debe ser de 1 a 2 líneas.
    - Que utilice la carrera y el plan de estudio indicados.
    - Debe tratar de un tema tratado en uno de los cursos con el propósito de ayudar al usuario a saber si le interesa estudiar. 
    - Enfocate en pregunta como: ¿Te interesa investigar sobre IA ética?
    Contexto:
    Carrera: ${career.nombre_carrera}
    Plan de estudio: ${JSON.stringify(career.plan_de_estudio)}`;

  const response = await geminiClient.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: prompt,
  });

  const question = response.text;

  if (!question) {
    throw new Error("No response from Gemini");
  }

  return {
    type: "encuesta",
    display_data: {
      question: question,
      tags: career.tags,
    },
    created_at: new Date(),
    updated_at: new Date(),
  };
};

// Helper to unslugify career names
const unslugify = (slug) => {
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Generate a "What If" card
const generateWhatIfCard = async (db) => {
  const career = await getRandomCareer(db);
  if (!career) {
    throw new Error("Career not found");
  }

  // Get a similar/random career for the "what if" combination
  const similarCareer = await getRandomCareer(db);
  if (!similarCareer || similarCareer._id.equals(career._id)) {
    // Fallback to a simple question if we can't get a different career
    return {
      type: "what_if",
      display_data: {
        question: [`¿Y si estudias ${career.nombre_carrera}?`],
        tags: career.tags,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  const shortQuestion = `¿Y si combinas con ${similarCareer.nombre_carrera}?`;
  const completeQuestion = `¿Y si combinas ${career.nombre_carrera} con ${similarCareer.nombre_carrera}?`;

  return {
    type: "what_if",
    display_data: {
      question: [similarCareer._id.toString(), shortQuestion, completeQuestion],
      tags: career.tags,
    },
    created_at: new Date(),
    updated_at: new Date(),
  };
};

// Main function to generate an AI card (randomly chooses between Encuesta and WhatIf)
const generateAICard = async (db) => {
  // Generate a 50/50 random selection
  const randomInt = Math.floor(Math.random() * 2);

  if (randomInt === 0) {
    // return await generateEncuestaCard(db);
    return await generateWhatIfCard(db);
  } else {
    return await generateWhatIfCard(db);
  }
};
