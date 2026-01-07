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
    // Get forumId, commentId, and answerId from params and userId from the current user
    const { id: forumId, commentId, answerId } = event.pathParameters || {};

    // Extract user_id from the Lambda authorizer context
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    // Validate required fields
    const missingFields = [];
    if (!forumId) missingFields.push("forumId (params: {id})");
    if (!commentId) missingFields.push("commentId (params: {commentId})");
    if (!answerId) missingFields.push("answerId (params: {answerId})");
    if (!userId) missingFields.push("userId (from current user)");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(forumId) ||
      !mongoose.Types.ObjectId.isValid(commentId) ||
      !mongoose.Types.ObjectId.isValid(answerId)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Invalid MongoDB ObjectId for forumId, commentId or answerId",
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

    // Find the comment
    const comment = forum.comments.find((c) => c._id.toString() === commentId);

    if (!comment) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Comment not found",
        }),
      };
    }

    // Find the answer
    const answer = comment.answers.find((a) => a._id.toString() === answerId);

    if (!answer) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Answer not found",
        }),
      };
    }

    // Find the user via clerk_id
    const user = await db.collection("users").findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    // Only the author of the answer or admins can delete it
    if (
      answer.user_id.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message:
            "You do not have permission to delete this answer. Only the author or an admin can delete it.",
        }),
      };
    }

    // Remove the answer using $pull operator with nested array
    const result = await db.collection("forums").updateOne(
      {
        _id: forum._id,
        "comments._id": new mongoose.Types.ObjectId(commentId),
      },
      {
        $pull: {
          "comments.$.answers": { _id: new mongoose.Types.ObjectId(answerId) },
        },
      }
    );

    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Answer not found in forum",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Answer deleted",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error deleting answer: " + error.message,
      }),
    };
  }
};
