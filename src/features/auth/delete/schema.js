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
  // TODO: add public metadata: school, age, gender, country, etc...
});

export const UserModel = mongoose.model("User", UserSchema);
