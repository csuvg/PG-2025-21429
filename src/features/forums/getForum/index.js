// @ts-nocheck
import mongoose from "mongoose";
import dotenv from "dotenv";
import { decrypt } from "./crypto.utils.js";

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
    // Get the forum ID from query parameters or path parameters
    const forumId = event.pathParameters?.id || event.queryStringParameters?.id;

    // Validate that ID is provided
    if (!forumId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Forum ID is required: /forums/{id}",
        }),
      };
    }

    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(forumId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid MongoDB ObjectId forum ID format",
        }),
      };
    }

    const db = (await connect()).db;

    // Find the forum by MongoDB _id (without populate since we're using native driver)
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

    // Collect all user IDs we need to fetch (creator, comment users, answer users)
    const userIds = new Set();
    userIds.add(forum.creator_id.toString());

    if (forum.comments && forum.comments.length > 0) {
      forum.comments.forEach((comment) => {
        userIds.add(comment.user_id.toString());
        if (comment.answers && comment.answers.length > 0) {
          comment.answers.forEach((answer) => {
            userIds.add(answer.user_id.toString());
          });
        }
      });
    }

    // Fetch all users in parallel in a single query for better performance
    const userIdsArray = Array.from(userIds).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const users = await db
      .collection("users")
      .find({ _id: { $in: userIdsArray } })
      .toArray();

    // Create a map for quick user lookup
    const usersMap = new Map();
    users.forEach((user) => {
      usersMap.set(user._id.toString(), user);
    });

    // Fetch career
    let career = null;
    if (forum.career_id) {
      career = await db
        .collection("careers")
        .findOne(
          { _id: new mongoose.Types.ObjectId(forum.career_id) },
          {
            projection: {
              nombre_carrera: 1,
              facultad: 1,
              descripcion: 1,
              duracion: 1,
            },
          }
        );
    }

    // Populate creator
    const creatorUser = usersMap.get(forum.creator_id.toString());
    const creator = creatorUser
      ? {
          _id: creatorUser._id,
          first_name: decrypt(creatorUser.first_name),
          last_name: decrypt(creatorUser.last_name),
          image_url: decrypt(creatorUser.image_url),
          role: creatorUser.role,
        }
      : null;

    // Format comments with populated users
    const comments = (forum.comments || []).map((comment) => {
      const commentUser = usersMap.get(comment.user_id.toString());
      const answers = (comment.answers || []).map((answer) => {
        const answerUser = usersMap.get(answer.user_id.toString());
        return {
          _id: answer._id,
          content: answer.content,
          created_at: answer.created_at,
          user: answerUser
            ? {
                _id: answerUser._id,
                first_name: decrypt(answerUser.first_name),
                last_name: decrypt(answerUser.last_name),
                image_url: decrypt(answerUser.image_url),
                role: answerUser.role,
              }
            : null,
          edited: answer.edited,
        };
      });

      return {
        _id: comment._id,
        content: comment.content,
        created_at: comment.created_at,
        answers,
        user: commentUser
          ? {
              _id: commentUser._id,
              first_name: decrypt(commentUser.first_name),
              last_name: decrypt(commentUser.last_name),
              image_url: decrypt(commentUser.image_url),
              role: commentUser.role,
            }
          : null,
        edited: comment.edited,
      };
    });

    // Calculate participants count (unique users in comments)
    const participantsCount = new Set(
      forum.comments?.map((comment) => comment.user_id.toString()) || []
    ).size;

    return {
      statusCode: 200,
      body: JSON.stringify({
        forum: {
          _id: forum._id,
          title: forum.title,
          description: forum.description,
          created_at: forum.created_at,
          final_date: forum.final_date,
          active: forum?.active,
          creator,
          career,
          comments,
          comments_count: (forum.comments || []).length,
          participants_count: participantsCount,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving forum: " + error.message,
      }),
    };
  }
};
