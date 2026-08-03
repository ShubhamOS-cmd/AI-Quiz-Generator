import mongoose from "mongoose";
const responseSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: [true, "Attempt ID is required"],
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question ID is required"],
    },
    selectedOption: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Selected option is required"],
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // answeredAt is enough here
  }
);
 
// One response per question per attempt
responseSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });
 
export default mongoose.model("Response", responseSchema);
 