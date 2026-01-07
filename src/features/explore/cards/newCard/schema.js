import mongoose from "mongoose";

const CardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["career", "what_if", "question", "testimony"],
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
    type: [Object],
    default: [],
    required: false,
  },
  priority: {
    type: Number,
    required: false,
  },
  created_at: {
    type: Date,
    required: true,
  },
  color: {
    type: String,
    required: false,
  },
  display_data: {
    type: Object,
    required: false,
  },
});

export const CardModel = mongoose.model("Card", CardSchema);
