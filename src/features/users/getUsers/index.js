import mongoose from "mongoose";
import dotenv from "dotenv";
import { decrypt } from "./crypto.utils.js";
import { encrypt } from "./traffic.crypto.js";

const encryptPIIData = true;

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

    let users = await db.collection("users").find({}).toArray();

    users = users.map((user) => ({
      _id: user._id,
      first_name: handleEncryption(user.first_name, encryptPIIData),
      last_name: handleEncryption(user.last_name, encryptPIIData),
      image_url: handleEncryption(user.image_url, encryptPIIData),
      username: handleEncryption(user.username, encryptPIIData),
      email: handleEncryption(user.email, encryptPIIData),
      role: handleEncryption(user.role, encryptPIIData),
      tags: user.user_tags,
      likes: user.likes ?? [],
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        users,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error getting users: " + error.message,
      }),
    };
  }
};

const handleEncryption = (value, encryptPIIData) => {
  if (!value) {
    return null;
  }

  const parts = value.split(":");
  if (parts.length !== 2) {
    return encryptPIIData ? encrypt(value) : value;
  }

  const decryptedValue = decrypt(value);
  return encryptPIIData ? encrypt(decryptedValue) : decryptedValue;
};
