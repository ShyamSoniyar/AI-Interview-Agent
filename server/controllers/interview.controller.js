import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  askAi,
  parseAiJson,
  clampScore,
  AiServiceError,
} from "../services/openRouter.service.js";
import User from "../modal/user.model.js";
import Interview from "../modal/interview.model.js";

// Flip to true in .env once a payment provider is wired up
const BILLING_ENABLED = process.env.BILLING_ENABLED === "true";
const INTERVIEW_COST = 50;
const INTERVIEW_MODES = ["HR", "Technical"];
export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const filepath = req.file.path;
    const fileBuffer = await fs.promises.readFile(filepath);
    const uint8Array = new Uint8Array(fileBuffer);

    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let resumeText = "";

    // Extract text from each page of the PDF

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = content.items.map((item) => item.str).join(" ");
      resumeText += pageText + "\n";
    }

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    const messages = [
      {
        role: "system",
        content: `
            Extract structured data from resume.

            Return strictly JSON:
            {
                "role": "string",
                "experience": "string",
                "projects": ["project1", "project2"],
                "skills": ["skill1", "skill2"]
            }
            `,
      },
      {
        role: "user",
        content: resumeText,
      },
    ];

    const aiResponse = await askAi(messages);

    const parsed = parseAiJson(aiResponse);

    fs.unlinkSync(filepath);

    const asArray = (v) =>
      Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 50) : [];

    res.json({
      role: typeof parsed.role === "string" ? parsed.role : "",
      experience: typeof parsed.experience === "string" ? parsed.experience : "",
      projects: asArray(parsed.projects),
      skills: asArray(parsed.skills),
      resumeText,
    });
  } catch (error) {
    console.error("Analyze resume error:", error);

    // unlink can itself throw (locked file); never let cleanup swallow the response
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.error("Failed to remove uploaded file:", cleanupError);
    }

    if (error instanceof AiServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: "Could not read that resume. Please try another PDF." });
  }
};

export const generateQuestions = async (req, res) => {
  try {
    let { role, experience, projects, skills, resumeText, mode } = req.body;

    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();

    if (!role || !experience || !mode) {
      return res
        .status(400)
        .json({ message: "Role, experience and mode are required" });
    }

    if (!INTERVIEW_MODES.includes(mode)) {
      return res
        .status(400)
        .json({ message: `Mode must be one of: ${INTERVIEW_MODES.join(", ")}` });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Billing is not live yet — credits are unlimited until BILLING_ENABLED=true
    if (BILLING_ENABLED && user.credits < INTERVIEW_COST) {
      return res.status(400).json({
        message: `Not enough credits. ${INTERVIEW_COST} credits required.`,
      });
    }

    const projectText =
      Array.isArray(projects) && projects.length ? projects.join(", ") : "None";

    const skillText =
      Array.isArray(skills) && skills.length ? skills.join(", ") : "None";

    const safeResume = resumeText?.trim() || "None";

    const userPrompt = `
      Role: ${role}
      Experience: ${experience}
      InterviewMode: ${mode}
      Projects: ${projectText}
      Skills: ${skillText}
      Resume: ${safeResume}
    `;

    if (!userPrompt) {
      return res.status(400).json({ message: "Prompt not found" });
    }

    const messages = [
      {
        role: "system",
        content: `
            You are a real human interviewer conducting a professional interview.

            Speak in simple, natural English as if you are directly talking to the candidate.

            Generate exactly 5 interview questions.

            Strict Rules:
            - Each question must contain between 15 and 25 words.
            - Each questions must be a single complete sentence.
            - Do Not number them.
            - Do Not add explanations.
            - Do Not add extra text before or after.
            - One question per line only.
            - Keep language simple and conversational.
            - Questions must feel practical and realistic.

            Difficulty progression:
            - Question 1: easy
            - Question 2: easy
            - Question 3: medium
            - Question 4: medium
            - Question 5: hard

            Make questions based on the candidate's role, experience, interview mode, projects, skills and resume details.
            `,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const aiResponse = await askAi(messages);

    if (!aiResponse || !aiResponse.trim()) {
      return res.status(400).json({ message: "AI response is empty" });
    }

    const questionsArray = aiResponse
      .split("\n")
      .map((question) => question.trim())
      .filter((question) => question.length > 0)
      .slice(0, 5);

    if (questionsArray.length === 0) {
      return res
        .status(502)
        .json({ message: "AI failed to generate questions" });
    }

    // Create first — a failure here must not consume credits
    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionsArray.map((question, index) => ({
        question: question,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: [60, 60, 90, 90, 120][index],
      })),
    });

    let creditsLeft = user.credits;

    if (BILLING_ENABLED) {
      // Conditional $inc is atomic — two concurrent requests can't both pass the check
      const debited = await User.findOneAndUpdate(
        { _id: user._id, credits: { $gte: INTERVIEW_COST } },
        { $inc: { credits: -INTERVIEW_COST } },
        { new: true },
      );

      if (!debited) {
        // Lost the race — roll back the interview we just created
        await Interview.deleteOne({ _id: interview._id });
        return res.status(400).json({
          message: `Not enough credits. ${INTERVIEW_COST} credits required.`,
        });
      }
      creditsLeft = debited.credits;
    }

    return res.status(200).json({
      interviewId: interview._id,
      creditsLeft,
      userName: user.name,
      questions: interview.questions,
    });
  } catch (error) {
    console.error("Generate questions error:", error);
    if (error instanceof AiServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Could not start the interview." });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timeTaken } = req.body;

    const index = Number(questionIndex);
    if (!Number.isInteger(index) || index < 0) {
      return res.status(400).json({ message: "Invalid question index" });
    }

    // Scope by userId so a user can only ever touch their own interview
    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.userId,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.status === "completed") {
      return res
        .status(409)
        .json({ message: "This interview is already finished" });
    }

    const question = interview.questions[index];

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Idempotency — don't let an answer be re-scored after feedback was shown
    if (question.answer !== undefined && question.answer !== null && question.feedback) {
      return res.status(409).json({
        message: "This question has already been answered",
        feedback: question.feedback,
      });
    }

    // Cap the stored/prompted answer so a huge body can't be pushed into the AI call
    const trimmedAnswer =
      typeof answer === "string" ? answer.trim().slice(0, 5000) : "";

    // Whitespace-only counts as no answer (speech recognition seeds it with " ")
    if (!trimmedAnswer) {
      question.score = 0;
      question.feedback = "You did not submit an answer.";
      question.answer = "";

      await interview.save();

      return res.json({
        feedback: question.feedback,
      });
    }

    // >= because the client's timeTaken maxes out at exactly timeLimit
    if (Number(timeTaken) >= question.timeLimit) {
      question.score = 0;
      question.feedback = "You exceeded the time limit.";
      question.answer = trimmedAnswer;

      await interview.save();

      return res.json({
        feedback: question.feedback,
      });
    }

    const messages = [
      {
        role: "system",
        content: `
            You are a professional human interviewer evaluating a candidate's answer in a real interview.

            Evaluate naturally and fairly, like a real person would.

            Score the answer in these areas (0 to 10):

            1. Confidence - Does the answer sound clear, confident, and well-presented?
            2. Communication - Is the language simple, clear, and easy to understand?
            3. Correctness - Is the answer accurate, relevant, and complete?

            Rules: 
            - Be realistic and unbiased.
            - Do not give random high scores.
            - If the answer is weak, score low.
            - If the answer is strong and detailed, score high.
            - Consider clarity, structure, and relevance.

            Calculate:
            finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

            Feedback Rules:
            - Write natural human feedback.
            - 10 to 15 words only.
            - Sound like real interview feedback.
            - Can suggest improvements if needed.
            - Do Not repeat the question.
            - Do Not explain scoring.
            - Keep tone professional and honest,

            Return ONLY valid JSON in this format:

            {
            "confidence": number,
            "communication": number,
            "correctness": number,
            "finalScore": number,
            "feedback": "short human feedback"
            }
              `,
      },
      {
        role: "user",
        content: `
            Question: ${question.question}
            Answer: ${trimmedAnswer}
        `,
      },
    ];

    const aiResponse = await askAi(messages);

    const parsed = parseAiJson(aiResponse);

    // Never trust AI-supplied numbers — clamp to the 0-10 the schema expects
    const confidence = clampScore(parsed.confidence);
    const communication = clampScore(parsed.communication);
    const correctness = clampScore(parsed.correctness);
    // Recompute rather than trusting finalScore, which the model often gets wrong
    const score = clampScore((confidence + communication + correctness) / 3);

    const feedback =
      typeof parsed.feedback === "string" && parsed.feedback.trim()
        ? parsed.feedback.trim().slice(0, 500)
        : "Answer recorded.";

    question.answer = trimmedAnswer;
    question.confidence = confidence;
    question.communication = communication;
    question.correctness = correctness;
    question.score = score;
    question.feedback = feedback;

    await interview.save();

    return res.status(200).json({ feedback });
  } catch (error) {
    console.error("Submit answer error:", error);
    if (error instanceof AiServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Could not score that answer." });
  }
};

export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.userId,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const totalQuestions = interview.questions.length;

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((question) => {
      totalScore += question.score || 0;
      totalConfidence += question.confidence || 0;
      totalCommunication += question.communication || 0;
      totalCorrectness += question.correctness || 0;
    });

    const avg = (total) =>
      totalQuestions ? Number((total / totalQuestions).toFixed(1)) : 0;

    const finalScore = avg(totalScore);

    // Store the rounded value so this endpoint and the report endpoint agree
    interview.finalScore = finalScore;
    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
      finalScore,
      confidence: avg(totalConfidence),
      communication: avg(totalCommunication),
      correctness: avg(totalCorrectness),
      questionWiseScore: interview.questions.map((question) => ({
        question: question.question,
        score: question.score || 0,
        feedback: question.feedback || "",
        confidence: question.confidence || 0,
        communication: question.communication || 0,
        correctness: question.correctness || 0,
      })),
    });
  } catch (error) {
    console.error("Finish interview error:", error);
    return res.status(500).json({ message: "Could not finish the interview." });
  }
};

export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");

    return res.status(200).json(interviews);
  } catch (error) {
    console.error("Get my interviews error:", error);
    return res
      .status(500)
      .json({ message: "Could not load your interview history." });
  }
};

export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const totalQuestions = interview.questions.length;

    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((question) => {
      totalConfidence += question.confidence || 0;
      totalCommunication += question.communication || 0;
      totalCorrectness += question.correctness || 0;
    });

    const avg = (total) =>
      totalQuestions ? Number((total / totalQuestions).toFixed(1)) : 0;

    // Same shape as finishInterview so the report renders identically either way
    return res.status(200).json({
      finalScore: Number((interview.finalScore || 0).toFixed(1)),
      confidence: avg(totalConfidence),
      communication: avg(totalCommunication),
      correctness: avg(totalCorrectness),
      questionWiseScore: interview.questions.map((question) => ({
        question: question.question,
        score: question.score || 0,
        feedback: question.feedback || "",
        confidence: question.confidence || 0,
        communication: question.communication || 0,
        correctness: question.correctness || 0,
      })),
    });
  } catch (error) {
    console.error("Get interview report error:", error);
    return res.status(500).json({ message: "Could not load this report." });
  }
};
