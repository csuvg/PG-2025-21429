import mongoose from "mongoose";

const InteractionSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ["view", "tap", "save", "share"],
  },
  duration: {
    type: Number,
    required: false,
  },
  metadata: {
    type: Object,
    required: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

export const InteractionModel = mongoose.model(
  "Interaction",
  InteractionSchema
);

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
    type: [String],
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
