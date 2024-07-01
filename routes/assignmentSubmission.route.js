const express = require("express");
const { auth } = require("../middleware/auth.middleware");
const { assignmentModel } = require("../model/assignment.model");
const { assignmentSubmissionModel } = require("../model/assignmentSubmission.model");
const { access } = require("../middleware/access.middleware");

const submissionRoute = express.Router();

// Submit an assignment (student)
submissionRoute.post("/submit/:id", auth, access("student"), async (req, res) => {
    const assignmentId = req.params.id;
    const { submissionURL } = req.body;
    const userId = req.user._id;

    try {
        const assignment = await assignmentModel.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ status: "error", message: "Assignment not found" });
        }

        const existingSubmission = await assignmentSubmissionModel.findOne({ assignmentData: assignmentId, submittedBy: userId });

        if (existingSubmission) {
            return res.status(400).json({ status: "error", message: "Assignment already submitted" });
        }

        const newSubmission = new assignmentSubmissionModel({
            assignmentData: assignmentId, // Corrected field name
            submittedBy: userId,
            submissionURL: submissionURL
        });

        const savedSubmission = await newSubmission.save();

        res.status(200).json({ status: "success", message: "Assignment submitted successfully", savedSubmission });
    } catch (error) {
        console.error("Error submitting assignment:", error);
        res.status(500).json({ status: "error", message: "Error submitting assignment" });
    }
});

// Get the submissions of a particular assignment
submissionRoute.get("/:id", auth, access("instructor"), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const assignmentId = req.params.id; 
        
        const filter = { assignmentData: assignmentId };
        console.log(filter);

        const options = {
            page,
            limit,
            populate: [{ path: 'assignmentData' }, { path: 'submittedBy' }]
        };

        const submissions = await assignmentSubmissionModel.paginate(filter, options);

        res.status(200).json({
            status: "success",
            submissions: submissions.docs,
            totalData: submissions.totalDocs,
            pages: submissions.totalPages
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error fetching submissions",
            error
        }); 
    }
});

// Route for students to view their own assignment submissions
submissionRoute.get("/mySubmission", auth, access("student"), async (req, res) => {
    const userId = req.user._id;
    console.log(userId);
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        const options = {
            page,
            limit,
            populate: [
                { path: 'assignmentData' } // Corrected populate field name
            ]
        };
        
        const submissions = await assignmentSubmissionModel.paginate({ submittedBy: userId }, options); // Filter by submittedBy instead of assignmentData

        res.status(200).json({
            status: "success",
            submissions: submissions.docs,
            totalData: submissions.totalDocs,
            pages: submissions.totalPages
        });

    } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({
            status: "error",
            message: "Error fetching submissions"
        });
    }
});

// Provide feedback and grade for the submission
submissionRoute.put("/feedback/:id", auth, access("instructor"), async (req, res) => {
    const assignmentId = req.params.id;
    const { grade, feedback } = req.body;

    try {
        const assignmentSubmission = await assignmentSubmissionModel.findOne({ assignmentData: assignmentId });

        if (!assignmentSubmission) {
            return res.status(404).json({ status: "error", message: "Assignment submission not found" });
        }

        if (!assignmentSubmission.submittedBy) {
            return res.status(400).json({ status: "error", message: "Assignment is not yet submitted" });
        }

        assignmentSubmission.grade = grade;
        assignmentSubmission.feedback = feedback;

        const updatedSubmission = await assignmentSubmission.save();

        res.status(200).json({ status: "success", message: "Feedback and grade provided successfully", updatedSubmission });
    } catch (error) {
        console.error("Error providing feedback and grade:", error);
        res.status(500).json({ status: "error", message: "Error providing feedback and grade" });
    }
});

module.exports = {
    submissionRoute
};