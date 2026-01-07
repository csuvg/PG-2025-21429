import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.URI;

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

export const handler = async (event, _) => {
  try {
    const { type, title, content, tags, priority, color, display_data } =
      JSON.parse(event.body);

    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    // Validate required fields
    const missingFields = [];
    if (!type) missingFields.push("type");
    if (!title) missingFields.push("title");
    if (!content) missingFields.push("content");
    if (!userId) missingFields.push("userId (from authorizer)");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    // just testimony and what_if are allowed to be created by the user
    if (type !== "testimony" && type !== "what_if") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Only testimony and what_if are allowed to be created by the user",
        }),
      };
    }

    const db = (await connect()).db;

    // students cant create cards
    const user = await db.collection("users").findOne({ clerk_id: userId });
    if (user.role === "student") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Students can't create cards. Only admins, directors and teachers can create cards.",
        }),
      };
    }

    // if color is not provided, set it to a random color
    const colors = [
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#FF33A1",
      "#A133FF",
      "#FFA133",
    ];

    // Initialize card
    const { insertedId } = await db.collection("cards").insertOne({
      type,
      title,
      content,
      tags: Array.isArray(tags) ? tags : [],
      priority: priority ?? 0,
      created_at: new Date(),
      color: color || colors[Math.floor(Math.random() * colors.length)],
      display_data,
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Card created",
        card: {
          _id: insertedId,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating card: " + error.message,
      }),
    };
  }
};
