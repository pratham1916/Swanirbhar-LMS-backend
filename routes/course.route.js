const express = require("express");
const { auth } = require("../middleware/auth.middleware");
const { courseModel } = require("../model/course.model");
const { access } = require("../middleware/access.middleware");
const { userModel } = require("../model/user.model");
const { diskStorage } = require("../middleware/upload.middleware");
const multer = require("multer");
const courseRouter = express.Router();

const upload = multer({ storage: diskStorage('thumbnails') });

// Get all courses (students, instructor)
courseRouter.get("/", auth, access("user", "admin"), async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const sortDirection = req.query.sort === "desc" ? -1 : 1;
        const levelFilter = req.query.level;

        const options = {
            page,
            limit,
            populate: [
                { path: 'createdBy', select: 'firstname lastname email' },
                { path: 'enrolledUsers', select: 'firstname lastname email' }
            ],
            sort: { pricing: sortDirection }
        };

        const query = {};

        if (req.query.courseName) {
            query.courseName = { $regex: req.query.courseName, $options: 'i' };
        }

        if (levelFilter) {
            query.level = levelFilter;
        }

        const courses = await courseModel.paginate(query, options);

        res.status(200).json({
            courses: courses.docs,
            totalData: courses.totalDocs,
            pages: courses.totalPages
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error getting courses" });
    }
});

//get only those courses which student is Enroll(student)
courseRouter.get("/myAddedCourses", auth, access("user"), async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const sortDirection = req.query.sort === "desc" ? -1 : 1;
        const levelFilter = req.query.level;

        const query = {
            createdBy: req.user._id
        };

        const options = {
            page,
            limit,
            populate: [
                { path: 'createdBy', select: 'firstname lastname email' },
                { path: 'enrolledUsers', select: 'firstname lastname email' }
            ],
            sort: { pricing: sortDirection }
        };

        if (req.query.courseName) {
            query.courseName = { $regex: req.query.courseName, $options: 'i' };
        }

        if (levelFilter) {
            query.level = levelFilter;
        }

        const courses = await courseModel.paginate(query, options);

        res.status(200).json({
            courses: courses.docs,
            totalData: courses.totalDocs,
            pages: courses.totalPages
        });
    } catch (error) {
        res.status(500).json({ message: "Error getting courses", error });
    }
});

courseRouter.get("/myEnrolledCourses", auth, access("user"), async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const sortDirection = req.query.sort === "desc" ? -1 : 1;
        const levelFilter = req.query.level;

        const query = {
            enrolledUsers: req.user._id
        };

        const options = {
            page,
            limit,
            populate: [
                { path: 'createdBy', select: 'firstname lastname email' },
                { path: 'enrolledUsers', select: 'firstname lastname email' }
            ],
            sort: { pricing: sortDirection }
        };

        if (req.query.courseName) {
            query.courseName = { $regex: req.query.courseName, $options: 'i' };
        }

        if (levelFilter) {
            query.level = levelFilter;
        }

        const courses = await courseModel.paginate(query, options);

        res.status(200).json({
            courses: courses.docs,
            totalData: courses.totalDocs,
            pages: courses.totalPages
        });
    } catch (error) {
        res.status(500).json({ message: "Error getting courses", error });
    }
});

// Get details of a specific course
courseRouter.get("/:id", auth, async (req, res) => {
    const courseId = req.params.id;
    try {
        const course = await courseModel.findById(courseId).populate('createdBy').populate('enrolledUsers');
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.status(200).json({ course });
    } catch (error) {
        res.status(500).json({ message: "Error getting course details" });
    }
});

//Create the Course(instructor)
courseRouter.post("/", auth, upload.single('thumbnail'), async (req, res) => {
    const { courseName, description, topics, pricing, category, level, language, duration } = req.body;

    try {
        const thumbnailName = req.file ? req.file.filename : undefined;

        const courseDetails = new courseModel({
            courseName,
            description,
            createdBy: req.user._id,
            topics,
            thumbnail: thumbnailName,
            pricing,
            category,
            level,
            language,
            duration
        });

        const savedCourse = await courseDetails.save();
        res.status(201).json({ message: "Course created successfully", course: savedCourse });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error creating course" });
    }
});

//Update the Course
courseRouter.put("/:id", auth, upload.single('thumbnail'), async (req, res) => {
    const courseId = req.params.id;
    const { courseName, description, pricing, category, level, language, duration, status } = req.body;

    try {
        const thumbnailName = req.file ? req.file.filename : undefined;

        const updatedCourse = await courseModel.findByIdAndUpdate(courseId, {
            courseName, description, pricing, thumbnail: thumbnailName, category, level, language, duration, status
        }, { new: true });

        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.status(200).json({ message: "Course updated successfully", course: updatedCourse });
    } catch (error) {
        res.status(500).json({ message: "Error updating course" });
    }
});

//Update the Course topics(instructor)
courseRouter.put("/:courseId/topics/:topicId", auth, async (req, res) => {
    const { courseId, topicId } = req.params;
    const { title, url } = req.body;

    try {
        const course = await courseModel.findById(courseId);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const topic = course.topics.id(topicId);
        if (!topic) {
            return res.status(404).json({ message: "Topic not found" });
        }

        topic.title = title;
        topic.url = url;

        await course.save();

        res.status(200).json({ message: "Topic updated successfully"});
    } catch (error) {
        res.status(500).json({ message: "Error updating topic" });
    }
});

// Add multiple topics to a course (instructor)
courseRouter.post("/:courseId/topics", auth, async (req, res) => {
    const { courseId } = req.params;
    const { topics } = req.body;

    try {
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        topics.forEach(topic => {
            course.topics.push(topic);
        });

        await course.save();
        res.status(200).json({ message: "Topics added successfully"});
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

//Enroll the Course
courseRouter.put("/enroll/:id", auth, async (req, res) => {
    const courseId = req.params.id;
    try {
        const courseDetails = await courseModel.findOne({ _id: courseId })
        if (!courseDetails) {
            return res.status(404).json({ message: "Course Does not Present" });
        }

        if (courseDetails.enrolledUsers.includes(req.user._id)) {
            return res.status(400).json({ message: "Already Enrolled in this Course" });
        }

        await courseModel.updateOne({ _id: courseId }, { $set: { enrolledUsers: [...courseDetails.enrolledUsers, req.user._id] } })

        res.status(200).json({ message: "Course Enrolled successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error updating course" });
    }
});

//Delete the Course
courseRouter.delete("/:id", auth, async (req, res) => {
    try {
        await courseModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Course deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting course", error });
    }
});

module.exports = {
    courseRouter
};
