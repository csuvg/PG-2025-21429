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

    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [userId]" }),
      };
    }

    const user = await db.collection("users").findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    // Delete the user's test results
    const deleteResult = await db
      .collection("test_results")
      .deleteOne({ user_id: user._id });

    if (deleteResult.deletedCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Test results not found or already deleted",
        }),
      };
    }

    // Set quizCompletedAt to null for this user, even if it doesn't have that property yet
    await db
      .collection("users")
      .updateOne({ _id: user._id }, { $set: { quizCompletedAt: null } });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Test results deleted successfully.",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error deleting test results: " + error.message,
      }),
    };
  }
};
