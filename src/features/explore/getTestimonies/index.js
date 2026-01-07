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

// eslint-disable-next-line no-unused-vars
export const handler = async () => {
  try {
    const db = (await connect()).db;

    // Get all cards of type "testimony"
    const testimonies = await db
      .collection("cards")
      .find({ type: "testimony" })
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Testimony cards retrieved successfully",
        testimonies,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving testimony cards: " + error.message,
      }),
    };
  }
};
