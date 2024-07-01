const mongoose = require("mongoose");
const paginate = require('mongoose-paginate-v2');

const userSchema = mongoose.Schema({
    googleId: { type: String },
    firstname: { type: String },
    lastname: { type: String },
    email: { type: String },
    phoneNumber: { type: String },
    password: { type: String },
    profilePic: { type: String },
    socials: {
        facebook: { type: String },
        linkedin: { type: String },
        github: { type: String },
        personalWebsite: { type: String }
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "course" }],
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    verificationOTP: { type: String },
    resetPasswordOTP: { type: String }
}, { versionKey: false });

userSchema.plugin(paginate);
const userModel = mongoose.model("user", userSchema);

module.exports = {
    userModel
};
