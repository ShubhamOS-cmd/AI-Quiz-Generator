import Groq from "groq-sdk";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as z from 'zod'
import QuizzModel from "../models/Quizz.model.js";
import QuestionsModel from "../models/Questions.model.js";
import { quizQueue } from "../jobs/email.queue.js";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


const quizGenerationSchema = z.object({
  topic: z.string().trim({message:"Topic is required"}),
  difficulty: z.string().transform(val => val.toLowerCase()).pipe(z.enum(["easy","medium","difficult"])).default("easy"),
  number: z.coerce.number().default(5),
  numberOfOptions: z.coerce.number().default(4)
})

const quizSchema = z.object({
  title: z.string().trim({ message: "Quiz should have a title" }),
  startTime : z.iso.datetime({ message: "Time should be specified"}),
  duration: z.coerce.number(),
  questions: z.array(z.object({
    questionText: z.string().trim({message: "Question can't be blank" }),
    options: z.array(z.any()).min(2).max(6),
    correctOption : z.any(),
    explanation : z.string().trim().default(""),
    scoreOnCorrect : z.coerce.number().min(1).optional(),
    scoreOnIncorrect : z.coerce.number().min(0).optional(),
  }).refine((data) => data.options.include(data.correctOption),{message : "Correct option should be among options."})
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
    console.log("Some error occurred");
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
        [
         {
          "questionId": "",
          "question":"",
          "options": [A. ...,B. ..,C. ...],
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
    if (!match) 
      throw new Error("Invalid quiz response");
    return res.status(200).json(new ApiResponse(200,JSON.parse(match[0])));
});

export const saveQuiz = asyncHandler(async(req,res) => {
   const { title, startTime, duration, questions } = quizSchema.parse(req.body);

   try {
     const session = await mongoose.startSession();
     session.startTransaction();

     const quiz = new QuizzModel({hostId:req.userId,title,startTime,duration});
     await quiz.save({session});
  
     await QuestionsModel.insertMany(questions.map(q => ({...q,quizId:quiz._id})),{session});
     
     await session.commitTransaction();

     await quizQueue.add(
      "activateQuiz",
      {quizId: quiz._id},
      {
        delay: new Date(startTime) - Date.now() - 10000,
        jobId : quiz._id.toString(),
      }
     );
     
     return res.status(201).json(new ApiResponse(201,{quizId:quiz._id},"Quiz saved successfully"));
   }
   catch(err){
    await session.abortTransaction();
    throw err;
   }
   finally{
    session.endSession();
   }
})
