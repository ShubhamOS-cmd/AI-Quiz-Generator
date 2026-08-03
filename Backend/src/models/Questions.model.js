import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  type: mongoose.Schema.Types.Mixed
}, { _id: true });

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz ID is required"],
      index: true,
    },
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => arr.length >= 2,
        message: "A question must have between 2 and 6 options",
      },
    },
    correctOption: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Correct option is required"],
    },
    explanation: {
      type: String,
      trim: true,
      default: null,
    },
    scoreOnCorrect: {
      type: Number,
      required: [true, "Score on correct answer is required"],
      default: 1,
    },
    scoreOnIncorrect: {
      type: Number,
      required: [true, "Score on incorrect answer is required"],
      default: 0,
    },
    order: {
      type: Number,
      default: 0, // for ordering questions within a quiz
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({quizId : 1 , order : 1});

export default mongoose.model("Question" , questionSchema);