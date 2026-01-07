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

// This handler only allows editing the `insights` field of a career document
export const handler = async (event, _) => {
  try {
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "User id is required in the authorizer context",
        }),
      };
    }

    const careerId = event.pathParameters?.id;

    if (!careerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Career id is required in the path. /careers/{id}",
        }),
      };
    }

    if (!mongoose.Types.ObjectId.isValid(careerId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId career ID format",
        }),
      };
    }

    const { insights } = JSON.parse(event.body);

    if (!insights) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Insights field is required",
        }),
      };
    }

    const db = (await connect()).db;

    const user = await db.collection("users").findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    if (user.role === "student") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Forbidden: Students cannot edit insights",
        }),
      };
    }

    // find the career
    const career = await db
      .collection("careers")
      .findOne({ _id: new mongoose.Types.ObjectId(careerId) });

    if (!career) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Career not found",
        }),
      };
    }

    // update the career insights
    await db
      .collection("careers")
      .updateOne({ _id: career._id }, { $set: { insights } });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Career insights updated successfully",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating insights: " + error.message,
      }),
    };
  }
};
