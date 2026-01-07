// @ts-nocheck
import mongoose from "mongoose";
import dotenv from "dotenv";
import { decrypt } from "./crypto.utils.js";

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

export const handler = async () => {
  try {
    const db = (await connect()).db;

    // Get all forums with select projection
    const allForums = await db
      .collection("forums")
      .find(
        {},
        {
          projection: {
            title: 1,
            description: 1,
            creator_id: 1,
            career_id: 1,
            created_at: 1,
            final_date: 1,
            comments: 1,
          },
        }
      )
      .toArray();

    // Collect all unique creator IDs and career IDs
    const creatorIds = new Set();
    const careerIds = new Set();

    allForums.forEach((forum) => {
      if (forum.creator_id) {
        creatorIds.add(forum.creator_id.toString());
      }
      if (forum.career_id) {
        careerIds.add(forum.career_id.toString());
      }
    });

    // Fetch all creators and careers in parallel for better performance
    const creators = await db
      .collection("users")
      .find(
        {
          _id: {
            $in: Array.from(creatorIds).map(
              (id) => new mongoose.Types.ObjectId(id)
            ),
          },
        },
        { projection: { first_name: 1, last_name: 1, role: 1, image_url: 1 } }
      )
      .toArray();

    const careers = await db
      .collection("careers")
      .find(
        {
          _id: {
            $in: Array.from(careerIds).map(
              (id) => new mongoose.Types.ObjectId(id)
            ),
          },
        },
        {
          projection: {
            nombre_carrera: 1,
            facultad: 1,
            descripcion: 1,
            duracion: 1,
          },
        }
      )
      .toArray();

    // Create maps for quick lookup
    const creatorsMap = new Map();
    creators.forEach((creator) => {
      creatorsMap.set(creator._id.toString(), creator);
    });

    const careersMap = new Map();
    careers.forEach((career) => {
      careersMap.set(career._id.toString(), career);
    });

    // Format forums with populated data
    const forums = allForums.map((forum) => {
      // Get creator
      const creator = forum.creator_id
        ? (() => {
            const creatorDoc = creatorsMap.get(forum.creator_id.toString());
            return creatorDoc
              ? {
                  _id: creatorDoc._id,
                  first_name: decrypt(creatorDoc.first_name),
                  last_name: decrypt(creatorDoc.last_name),
                  role: creatorDoc.role,
                  image_url: decrypt(creatorDoc.image_url),
                }
              : null;
          })()
        : null;

      // Get career
      const career = forum.career_id
        ? careersMap.get(forum.career_id.toString())
        : null;

      // Calculate comments count
      const commentsCount = forum.comments ? forum.comments.length : 0;

      // Calculate unique participants count
      const participantsCount = forum.comments
        ? new Set(forum.comments.map((comment) => comment.user_id.toString()))
            .size
        : 0;

      return {
        _id: forum._id,
        title: forum.title,
        description: forum.description,
        creator,
        career,
        created_at: forum.created_at,
        final_date: forum.final_date,
        comments_count: commentsCount,
        participants_count: participantsCount,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        forums,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving forums: " + error.message,
      }),
    };
  }
};
