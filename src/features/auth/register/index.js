import mongoose from "mongoose";
import dotenv from "dotenv";
import { encrypt } from "./crypto.utils.js";

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
    const {
      data: {
        id,
        first_name,
        last_name,
        username,
        image_url,
        primary_email_address_id,
        email_addresses,
        // unsafe_metadata: { role },
      },
    } = JSON.parse(event.body);

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [id]" }),
      };
    }

    const db = (await connect()).db;

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ clerk_id: id });
    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: "User already exists" }),
      };
    }

    const email = email_addresses.find(
      (e) => e.id === primary_email_address_id
    );

    // initialize user
    await db.collection("users").insertOne({
      clerk_id: id,
      first_name: encrypt(first_name),
      last_name: encrypt(last_name),
      username: encrypt(username),
      image_url: encrypt(image_url),
      email: encrypt(email.email_address),
      created_at: new Date(),
      role: "student",
      quizCompletedAt: null,
      user_tags: [],
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User registered",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error registering user: " + error.message,
      }),
    };
  }
};
