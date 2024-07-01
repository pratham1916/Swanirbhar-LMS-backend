const express = require("express");
const aiRouter = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCGZK4tW1Ndf3fKSdcP2wF6fe2vqWUXuzA");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

aiRouter.post("/course-details", async (req, res) => {
    try {
        const { query } = req.body;

        const prompt = `You are an AI assistant for an online learning platform. Please respond to course-related questions only. If the question is not related to courses, respond with "I can only answer questions related to our courses."
        Question: ${query}
        Response: Please provide a concise answer of 100-120 words in paragraph form.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        res.status(200).json({ success: true, text });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "An error occurred while generating content",
            error: err.message,
        });
    }
});

module.exports = aiRouter;
