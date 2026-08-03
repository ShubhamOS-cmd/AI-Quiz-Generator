import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email:{
      type: String,
      required:[true , "Email is required"],
      trime: true,
      unique: true,
      index:true
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);
export const User = mongoose.model("User" , userSchema);