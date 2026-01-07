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
    const userId = event.requestContext?.authorizer?.lambda?.user_id;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [userId]" }),
      };
    }

    const db = (await connect()).db;
    const user = await db.collection("users").findOne({ clerk_id: userId });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    // just admins can edit users
    if (user.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Forbidden: Only admins can edit users",
        }),
      };
    }

    const userIdToEdit = event.pathParameters?.id;

    // validate that the user ID to edit is provided
    if (!userIdToEdit) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required user to edit: /users/{id}",
        }),
      };
    }

    // validate that the user ID to edit is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userIdToEdit)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId user ID format",
        }),
      };
    }

    const userToEdit = await db
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(userIdToEdit) });

    if (!userToEdit) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User to edit not found" }),
      };
    }
    const { role } = JSON.parse(event.body);

    if (!role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields: [role]" }),
      };
    }

    // validate that the role is a valid role
    if (
      !["admin", "teacher", "director", "student"].includes(
        role.trim().toLowerCase()
      )
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Invalid role. Must be one of: admin, teacher, director, student",
        }),
      };
    }

    // update the user
    await db
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(userIdToEdit) },
        { $set: { role: role.trim().toLowerCase() } }
      );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User updated successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error updating user: " + error.message,
      }),
    };
  }
};
