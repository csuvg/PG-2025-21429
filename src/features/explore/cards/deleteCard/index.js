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
    // Get the card ID from query parameters or path parameters
    const cardId = event.pathParameters?.id || event.queryStringParameters?.id;
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required fields: [userId] (from authorizer)",
        }),
      };
    }

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

    const db = (await connect()).db;

    // students cant delete cards
    const user = await db.collection("users").findOne({ clerk_id: userId });
    if (user.role === "student") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Students can't delete cards. Only admins, directors and teachers can delete cards.",
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

    // just testimony and what_if are allowed to be deleted by the user
    if (card.type !== "testimony" && card.type !== "what_if") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Only testimony and what_if are allowed to be deleted by the client",
        }),
      };
    }

    // delete the card
    await db.collection("cards").deleteOne({ _id: card._id });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Card deleted",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error deleting card: " + error.message,
      }),
    };
  }
};
