import Groq from "groq-sdk";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as z from 'zod'
import QuizzModel from "../models/Quizz.model.js";
import QuestionsModel from "../models/Questions.model.js";
import { quizQueue } from "../jobs/email.queue.js";
import { redis } from "../config/redis.js";
import mongoose from "mongoose";
import AttemptModel from "../models/Attempt.model.js";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const quizGenerationSchema = z.object({
  topic: z.string().trim().min(1,{message:"Topic is required"}),
  difficulty: z.string().transform(val => val.toLowerCase()).pipe(z.enum(["easy","medium","difficult"])).default("easy"),
  number: z.coerce.number().default(5),
  numberOfOptions: z.coerce.number().default(4)
})

const quizSchema = z.object({
  title: z.string().trim().min(1,{ message: "Quiz should have a title" }),
  startTime : z.iso.datetime({ message: "Time should be specified"}),
  duration: z.coerce.number(),
  questions: z.array(z.object({
    questionText: z.string().trim().min(1,{message: "Question can't be blank" }),
    options: z.array(z.any()).min(2),
    correctOption : z.number(),
    explanation : z.string().trim().default(""),
    scoreOnCorrect : z.coerce.number().min(1).optional(),
    scoreOnIncorrect : z.coerce.number().min(0).optional(),
  }).refine((data) =>{
     return data.options.length >= data.correctOption
  },{message : "Correct option should be among options."})
  ).min(1)
})

const getValidation = async ({topic}) => {
    try{
    const validation = await groq.chat.completions.create({
        model:'llama-3.1-8b-instant',
        messages: [
            {
                role:'user',
                content:`Is "${topic}" a clear, meaningful topic that a quiz can be generated about?
                         Return a json object with no explanation in Format: 
                         {"valid": true/false, "reason":"", "extractedTopic":""}
                         
                         Topic is invalid if it is some gibberish, offensive, too vague, not a real subject.
                         If it is a valid topic then extract the topic or if not then keep extractedTopic empty.
                `
            }
        ],
        temperature:0,
    })
    const raw = validation.choices[0].message.content;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid validation response");
    return JSON.parse(match[0]);
}
catch(err){
    console.log(err);
    throw new Error("Some error occured");
}
}

const getdata = ({topic,difficulty,number,numberOfOptions}) => {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `Generate a quiz on ${topic}.
        No. of question = ${number}.
        Difficulty = ${difficulty}.
        No. of options = ${numberOfOptions}

        Return a valid json object with Format : 
        correctOption should have the index value.
        [
         {
          "questionId": "",
          "question":"",
          "options": [],
          "correctOption":"",
          "Explanation":""
        },
        ..
        ...
        ...
        ]
        `,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature:0.3
  });
}

export const generateQuiz = asyncHandler(async (req, res) => {
    const { topic, difficulty, number, numberOfOptions } = quizGenerationSchema.parse(req.body);

    const validateTopic = await getValidation({topic});

    if (!validateTopic.valid) {
      throw new ApiError(400,validateTopic.reason );
    }

    const data = await getdata({topic:validateTopic.extractedTopic,difficulty,number,numberOfOptions});

    const raw = data.choices[0].message.content;
    const match = raw.match(/\[[\s\S]*\]/);
    console.log(match);
    if (!match) 
      throw new Error("Invalid quiz response");
    return res.status(200).json(new ApiResponse(200,JSON.parse(match[0])));
});


export const saveQuiz = asyncHandler(async(req,res) => {
console.dir(req.body, { depth: null });

// req.body.questions.forEach((q, i) => {
//   console.log("Question", i + 1);
//   console.log("options:", q.options);
//   console.log("correct:", q.correctOption);
// });
   const { title, startTime, duration, questions } = quizSchema.parse(req.body);
   console.log({title,startTime,duration,questions});
    let session;
   try {
     for(let i=0;i<questions.length;i++){
         const optionDocs = questions[i].options.map((text) => ({
         _id: new mongoose.Types.ObjectId(),
         type: text,
     }))
     const correctId = optionDocs[questions[i].correctOption]._id;
     const question = { ...questions[i],options:optionDocs,correctOption:correctId};
     questions[i] = question;
   }
   console.dir(questions , {depth:null});
      session = await mongoose.startSession();
     session.startTransaction();
    const quiz = new QuizzModel({ hostId: req.userId, title, startTime, duration });
    await quiz.save({ session });

    await QuestionsModel.insertMany(questions.map(q => ({ ...q, quizId: quiz._id })), { session });

    await session.commitTransaction();

    await quizQueue.add(
      "activateQuiz",
      { quizId: quiz._id },
      { delay: new Date(startTime) - Date.now() - 10000, jobId: quiz._id.toString() }
    );

    return res.status(201).json(new ApiResponse(201, { quizId: quiz._id }, "Quiz saved successfully"));
  } catch (err) {
  if (session) await session.abortTransaction();
  throw err;
} finally {
  if (session) await session.endSession();
}
});

export const getLeaderBoard = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
  throw new ApiError(400, "Invalid quiz ID");
}

  const quiz = await QuizzModel.findById(quizId).select("status leaderboard");
  if (!quiz) throw new ApiError(404, "Quiz not found");
  if(quiz.status === 'active') throw new ApiError(409,"Quiz is still active");

  return res.status(200).json(new ApiResponse(200, { status: quiz.status, leaderboard: quiz.leaderboard }));
});

export const getMyScore = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { userId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(quizId)) {
  throw new ApiError(400, "Invalid quiz ID");
}

  const attempt = await AttemptModel.findOne({quizId, userId}).populate("quizId");
  if(!attempt) throw new ApiError(404,'Not attempted');

  return res.status(200).json(new ApiResponse(200, {quizId: attempt.quizId._id, title:attempt.quizId.title, score: attempt.score, rank: attempt.rank}));
});