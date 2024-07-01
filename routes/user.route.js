const express = require("express");
const { userModel } = require("../model/user.model");
const userRouter = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const nodemailer = require('nodemailer');
const { diskStorage } = require("../middleware/upload.middleware");
const { auth } = require("../middleware/auth.middleware");
const { courseModel } = require("../model/course.model");
const { access } = require("../middleware/access.middleware");

const upload = multer({ storage: diskStorage('profilePics') });

//get userDetails for Particular User
userRouter.get("/:id", async (req, res) => {
    try {
        const userDetails = await userModel.findById(req.params.id).populate("wishlist")
        res.status(200).json(userDetails);
    }
    catch (error) {
        res.status(400).json({ message: "Failed to Get user details. Please try again later." });
    }
})

userRouter.get("/verifyOTP/:email", async (req, res) => {
    try {
        const userDetails = await userModel.findOne({ email: req.params.email });
        if (!userDetails) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(userDetails);
    } catch (error) {
        res.status(500).json({ message: "Failed to Get user details. Please try again later." });
    }
});


//Register For User
userRouter.post("/verificationOTP", async (req, res) => {
    const { email, firstname } = req.body;
    try {
        const existingUserByEmail = await userModel.findOne({ email });

        if (existingUserByEmail) {
            return res.status(400).json({ message: "Email already exists, Please Login" });
        }

        const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'pnemade1916@gmail.com',
                pass: 'ysrvgcxswskoddur'
            }
        });

        const mailOptions = {
            from: 'pnemade1916@gmail.com',
            to: email,
            subject: 'Your Password Reset OTP',
            text: `Hello ${firstname},

Thank you for registering with Swanirbhar.

Your OTP for account verification is: ${verificationOTP}

Please use this OTP to complete your registration process.

If you did not initiate this request, please ignore this email.

Best regards,
The Swanirbhar Team`
        };

        const info = await transporter.sendMail(mailOptions)

        const userDetails = new userModel({
            email,
            verificationOTP
        });

        await userDetails.save();
        res.status(200).json({ message: 'OTP sent to your email successfully.' });
    } catch (error) {
        res.status(400).json({ message: "Registration Failed, Please try again later." });
    }
});

userRouter.put("/register/:email", async (req, res) => {
    const { firstname, lastname, password, phoneNumber, verificationOTP } = req.body;
    const email = req.params.email;

    try {
        const userDetails = await userModel.findOne({ email });

        if (!userDetails || userDetails.verificationOTP !== verificationOTP) {
            return res.status(400).json({ message: "Incorrect OTP. Please Check It Again" });
        }

        bcrypt.hash(password, 10, async (err, hash) => {
            if (err) {
                return res.status(500).json({ message: "Error hashing password" });
            }

            userDetails.firstname = firstname;
            userDetails.lastname = lastname;
            userDetails.password = hash;
            userDetails.phoneNumber = phoneNumber;
            userDetails.verificationOTP = null;

            await userDetails.save();
            return res.status(200).json({ message: "OTP Verified, Registration Successful, You Can Login Now" });
        });
    } catch (error) {
        return res.status(500).json({ message: "Registration Failed, Please try again later." });
    }
});

//Login For the User
userRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email }).select('+password');
        if (user) {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY);
                    res.status(200).json({ message: "Login Successful", token, userId: user._id });
                } else {
                    res.status(400).json({ message: "Wrong Email or Password" });
                }
            });
        } else {
            res.status(400).json({ message: "Email does not exist, Please Sign Up" });
        }
    } catch (error) {
        res.status(400).json({ message: "Login Failed. Please try again later." });
    }
});

//update the etails for the user 
userRouter.put("/updateDetails/:id", upload.single("profilePic"), async (req, res) => {
    const { id } = req.params;
    const { firstname, lastname, phoneNumber, facebook, linkedin, github, personalWebsite } = req.body;
    const profilePic = req.file ? req.file.filename : undefined;

    try {
        let user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (firstname) user.firstname = firstname;
        if (lastname) user.lastname = lastname;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (profilePic) user.profilePic = profilePic;
        if (facebook) user.socials.facebook = facebook;
        if (linkedin) user.socials.linkedin = linkedin;
        if (github) user.socials.github = github;
        if (personalWebsite) user.socials.personalWebsite = personalWebsite;

        await user.save();

        res.status(200).json({ message: "User details updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update user details. Please try again later." });
    }
});


userRouter.put("/resetOTP", async (req, res) => {
    const { email } = req.body;
    const resetPasswordOTP = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        const existingUser = await userModel.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: 'Email not found. Please check your email address.' });
        }

        existingUser.resetPasswordOTP = resetPasswordOTP;
        await existingUser.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'pnemade1916@gmail.com',
                pass: 'ysrvgcxswskoddur'
            }
        });

        const mailOptions = {
            from: 'pnemade1916@gmail.com',
            to: email,
            subject: 'Your Password Reset OTP',
            text: `Dear user,

            Your OTP for password reset is: ${resetPasswordOTP}

            If you did not request this, please ignore this email.

            Best regards,
            Swanirbhar`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent to your email successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
    }
});

userRouter.put("/resetPassword", async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const existingUser = await userModel.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: 'Email not found. Please check your email address.' });
        }

        bcrypt.hash(newPassword, 10, async (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ message: "Error hashing password" });
            }

            existingUser.password = hashedPassword;
            existingUser.resetPasswordOTP = null;
            await existingUser.save();

            return res.status(200).json({ message: "Password updated successfully" });
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to update password. Please try again later.' });
    }
});



userRouter.put("/wishlist", auth, access("user"), async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user._id;

    try {
        const course = await courseModel.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.wishlist.includes(courseId)) {
            return res.status(400).json({ message: 'Course already in wishlist' });
        }
        user.wishlist.push(courseId);
        await user.save();
        res.status(200).json({ message: 'Course Added to wishlist' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to Add to Wishlist. Please try again later.' });
    }
})

userRouter.delete("/wishlist", auth, async (req, res) => {
    const userId = req.user._id;
    const { courseId } = req.body;

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const index = user.wishlist.indexOf(courseId);
        if (index === -1) {
            return res.status(400).json({ message: 'Course not found in wishlist.' });
        }

        user.wishlist.splice(index, 1);
        await user.save();

        res.status(200).json({ message: 'Course removed from wishlist.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove course from wishlist. Please try again later.' });
    }
});

userRouter.delete('/:id', async (req, res) => {
    try {
        await userModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: 'Failed to Delete Account. Please try again later.' });
    }
})


module.exports = {
    userRouter
};
