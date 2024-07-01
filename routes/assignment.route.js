const express = require("express");
const { auth } = require("../middleware/auth.middleware");
const { access } = require("../middleware/access.middleware");
const { assignmentModel } = require("../model/assignment.model");
const { courseModel } = require("../model/course.model");
const assignmentRouter = express.Router();

//Get All the Assignment(instructor)
assignmentRouter.get("/", auth, access("instructor"), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        const options = {
            page,
            limit,
            populate: [
                { path: 'course', select: 'courseName' },
            ]
        };

        const assignments = await assignmentModel.paginate({}, options);

        res.status(200).json({
            status: "success",
            assignments: assignments.docs,
            totalData: assignments.totalDocs,
            pages: assignments.totalPages
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error getting assignments",
            error: error.message
        });
    }
});

//Get Only those Assignment for which student is Enroll For(sutudent)
assignmentRouter.get("/myAssignment", auth, access("student"), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        const courses = await courseModel.find({ students: { $in: [req.user._id] } });
        const courseIds = courses.map(course => course._id);

        const options = {
            page,
            limit,
            populate: [
                { path: 'course', select: 'courseName' },
            ]
        };

        const assignments = await assignmentModel.paginate({ course: { $in: courseIds } }, options);

        res.status(200).json({
            status: "success",
            assignments: assignments.docs,
            totalData: assignments.totalDocs,
            pages: assignments.totalPages,
        });
    } catch (error) {
        res.status(500).json({status: "error",message: "Error getting assignments"});
    }
});

// Get details of a specific Assignment
assignmentRouter.get("/:id", auth, access("student", "instructor"), async (req, res) => {
    const assignmentId = req.params.id;
    try {
        const assignmentDetails = await assignmentModel.findById(assignmentId).populate('course')
        if (!assignmentDetails) {
            return res.status(404).json({ status: "error", message: "Assignment not found" });
        }
        res.status(200).json({ status: "success", assignmentDetails });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error getting assignment details", error });
    }
});

//Create the assignment(instructor)
assignmentRouter.post("/", auth, access("instructor"), async (req, res) => {
    const { title, description, deadline, courseId } = req.body;

    try {
        const assignmentDetails = new assignmentModel({
            title, description, deadline, course: courseId
        });
        const savedAssignment = await assignmentDetails.save();
        res.status(201).json({ status: "success", message: "Assignment created successfully", assignment: savedAssignment });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error creating assignment", error });
    }
});

//Update the assignment(instructor)
assignmentRouter.put("/:id", auth, access("instructor"), async (req, res) => {
    const assignmentId = req.params.id;
    const { title, description, deadline } = req.body;

    try {
        const updatedAssignment = await assignmentModel.findByIdAndUpdate(assignmentId, {
            title, description, deadline
        }, { new: true });

        res.status(200).json({ status: "success", message: "Assignment updated successfully", assignment: updatedAssignment });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error updating assignment", error });
    }
});

//Delete the assignment(instructor)
assignmentRouter.delete("/:id", auth, access("instructor"), async (req, res) => {
    const assignmentId = req.params.id;

    try {
        await assignmentModel.findByIdAndDelete(assignmentId);

        res.status(200).json({ status: "success", message: "Assignment deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Error deleting assignment", error });
    }
});

module.exports = {
    assignmentRouter
}