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
    // Get forumId from params and userId from the current user
    const { id: forumId } = event.pathParameters || {};
    const { content } = JSON.parse(event.body || "{}");

    // Extract user_id from the Lambda authorizer context
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    // Validate required fields
    const missingFields = [];
    if (!forumId) missingFields.push("forumId (params: {id})");
    if (!userId) missingFields.push("userId (from current user)");
    if (!content) missingFields.push("content");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(forumId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId for forumId",
        }),
      };
    }

    const db = (await connect()).db;

    // Find the forum
    const forum = await db
      .collection("forums")
      .findOne({ _id: new mongoose.Types.ObjectId(forumId) });

    if (!forum) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Forum not found",
        }),
      };
    }

    // Find the user
    const user = await db.collection("users").findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    // Create the new comment object
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      user_id: user._id,
      content,
      created_at: new Date(),
      edited: false,
      answers: [],
    };

    // Add the comment to the forum using $push
    await db.collection("forums").updateOne(
      { _id: forum._id },
      {
        $push: {
          comments: newComment,
        },
      }
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Comment added",
        comment: {
          _id: newComment._id,
        },
        forum: {
          _id: forum._id,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error adding comment: " + error.message,
      }),
    };
  }
};
