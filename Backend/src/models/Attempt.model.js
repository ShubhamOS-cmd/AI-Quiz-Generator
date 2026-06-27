import mongoose from "mongoose";
const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz ID is required"],
      index: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    rank:{
      type: Number,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  }
);
 
// One attempt per user per quiz
attemptSchema.index({ userId: 1, quizId: 1 }, { unique: true });
 
export default mongoose.model("Attempt", attemptSchema);