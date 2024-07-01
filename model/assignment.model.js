const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");

const assignmentSchema = mongoose.Schema({
    title: { type: String },
    description: { type: String },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "course" },
    deadline: { type: Date }
}, { versionKey: false, timestamps: true });

assignmentSchema.plugin(paginate);
const assignmentModel = mongoose.model("assignment", assignmentSchema);

module.exports = {
    assignmentModel
}