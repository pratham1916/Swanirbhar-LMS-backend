const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");

const courseSchema = mongoose.Schema({
    thumbnail: { type: String },
    courseName: { type: String },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    topics: [{
        title: { type: String },
        url: { type: String }  
    }],
    pricing: { type: Number },
    category: { type: String},
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced']},
    language: { type: String},
    duration: { type: Number},
    status: { type: String, enum: ['Active', 'Archived', 'Upcoming'], default: 'Active' },
},{ versionKey: false, timestamps: true });

courseSchema.plugin(paginate);
const courseModel = mongoose.model("course", courseSchema);

module.exports = {
    courseModel
};