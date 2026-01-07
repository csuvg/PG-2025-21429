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

    // Get the card ID from query parameters or path parameters
    const cardId = event.pathParameters?.id || event.queryStringParameters?.id;

    // Validate that ID is provided
    if (!cardId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Card ID is required: /explore/cards/{id}",
        }),
      };
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId card ID format",
        }),
      };
    }

    // Find the card by MongoDB _id
    const card = await db
      .collection("cards")
      .findOne({ _id: new mongoose.Types.ObjectId(cardId) });

    if (!card) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Card not found",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Card retrieved successfully",
        card,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving card: " + error.message,
      }),
    };
  }
};
