import mongoose from "mongoose";

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
  quizCompletedAt: {
    type: Date,
    required: false,
    default: null,
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
