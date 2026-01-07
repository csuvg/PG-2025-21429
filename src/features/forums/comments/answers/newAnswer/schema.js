import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const AnswerSchema = new Schema({
  user_id: {
    type: Types.ObjectId,
    required: true,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
  edited: {
    type: Boolean,
    default: false,
    required: true,
  },
});

const CommentSchema = new Schema({
  user_id: {
    type: Types.ObjectId,
    required: true,
    ref: "User",
  },
  content: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
  answers: {
    type: [AnswerSchema],
    default: [],
  },
});

export const CommentModel = mongoose.model("Comment", CommentSchema);

const ForumSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  creator_id: {
    type: Types.ObjectId,
    required: true,
    ref: "User",
  },
  active: {
    type: Boolean,
    default: true,
    required: true,
  },
  career_id: {
    type: Types.ObjectId,
    required: true,
    ref: "Career",
  },
  comments: {
    type: [CommentSchema],
    default: [],
  },
});

export const ForumModel = mongoose.model("Forum", ForumSchema);

const UserSchema = new mongoose.Schema({
  clerk_id: {
    type: String,
    required: true,
    unique: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "teacher", "director", "publisher", "student"],
    default: "student",
  },
  image_url: {
    type: String,
    required: false,
  },
  first_name: {
    type: String,
    required: false,
  },
  last_name: {
    type: String,
    required: false,
  },
  username: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
});

export const UserModel = mongoose.model("User", UserSchema);
