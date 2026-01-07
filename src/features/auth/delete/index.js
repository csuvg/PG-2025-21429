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
    const db = (await connect()).db;

    const {
      data: { id },
    } = JSON.parse(event.body);

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [id]" }),
      };
    }

    // Check if user exists
    const existingUser = await db.collection("users").findOne({ clerk_id: id });
    if (!existingUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    // delete the user
    await db.collection("users").deleteOne({ clerk_id: id });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User deleted",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error deleting user: " + error.message,
      }),
    };
  }
};
