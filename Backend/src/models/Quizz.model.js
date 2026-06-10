import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
    {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["scheduled", "active", "completed"],
      default: "scheduled",
    },
    leaderboard : [{
      userId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
      },
      score: Number,
      rank : Number,
    }
    ]
  },
  {
    timestamps: true,
  }
)

export default mongoose.model("Quiz" , quizSchema);