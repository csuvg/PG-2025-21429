import mongoose from "mongoose";

const CardSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  imageUrl: {
    type: String,
    required: true,
  },
  priority: {
    type: Number,
    required: true,
  },
  created_at: {
    type: Date,
    required: true,
  },
  color: {
    type: String,
    required: false,
  },
});

export const CardModel = mongoose.model("Card", CardSchema);

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
    enum: ["admin", "teacher", "director", "student"],
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
  user_tags: [
    {
      tag: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      score: { type: Number, required: true },
    },
  ],
});

export const UserModel = mongoose.model("User", UserSchema);
