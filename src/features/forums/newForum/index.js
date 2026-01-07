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

export const handler = async (event) => {
  try {
    const { title, description, career_id, final_date } = JSON.parse(
      event.body
    );

    // Extract user_id from the Lambda authorizer context
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!description) missingFields.push("description");
    if (!career_id) missingFields.push("career_id");
    if (!final_date) missingFields.push("final_date");
    if (!userId) missingFields.push("userId (from authorizer)");

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Missing required fields: [${missingFields.join(", ")}]`,
        }),
      };
    }

    if (!mongoose.Types.ObjectId.isValid(career_id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId career_id format",
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

    // students cant create forums
    if (user.role === "student") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Students can't create forums. Only admins, directors and teachers can create forums.",
        }),
      };
    }

    // verify that the creator_id and career_id are valid id objects
    if (!mongoose.Types.ObjectId.isValid(career_id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId career_id format",
        }),
      };
    }

    const career = await db
      .collection("careers")
      .findOne({ _id: new mongoose.Types.ObjectId(career_id) });

    if (!career) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Career not found",
        }),
      };
    }

    // Create the forum post
    const { insertedId } = await db.collection("forums").insertOne({
      title,
      description,
      creator_id: user._id,
      career_id: career._id,
      final_date: new Date(final_date ?? new Date()),
      created_at: new Date(),
      comments: [],
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Forum created",
        forum: {
          _id: insertedId,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error creating forum post: " + error.message,
      }),
    };
  }
};
