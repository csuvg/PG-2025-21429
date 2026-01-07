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
    const { title, content, tags, priority, color, display_data } = JSON.parse(
      event.body
    );

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

    // students cant edit cards
    const user = await db.collection("users").findOne({ clerk_id: userId });
    if (user.role === "student") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Students can't edit cards. Only admins, directors and teachers can edit cards.",
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

    // just testimony and what_if are allowed to be edited by the user
    if (card.type !== "testimony" && card.type !== "what_if") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Only testimony and what_if are allowed to be edited by the client",
        }),
      };
    }

    const data = {};

    // update the card just with the fields that are provided
    if (title) data.title = title;
    if (content) card.content = content;
    if (tags) data.tags = tags;
    if (priority) data.priority = priority;
    if (color) data.color = color;
    if (display_data) data.display_data = display_data;

    // save the card
    await db.collection("cards").updateOne({ _id: card._id }, { $set: data });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Card updated",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating card: " + error.message,
      }),
    };
  }
};
