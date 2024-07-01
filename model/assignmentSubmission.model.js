const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");

const assignmentSubmissionSchema = mongoose.Schema({
    assignmentData: { type: mongoose.Schema.Types.ObjectId, ref: "assignment" },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    submissionURL: { type: String },
    grade: { type: Number },
    feedback: { type: String }
}, { versionKey: false, timestamps: true });

assignmentSubmissionSchema.plugin(paginate);
const assignmentSubmissionModel = mongoose.model("Submission", assignmentSubmissionSchema);

module.exports = {
    assignmentSubmissionModel
};