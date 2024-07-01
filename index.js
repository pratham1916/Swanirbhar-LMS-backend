const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require('path')
const { connection } = require("./config/db.config");
const { userRouter } = require("./routes/user.route");
const { courseRouter } = require("./routes/course.route");
const { assignmentRouter } = require("./routes/assignment.route");
const aiRouter = require("./routes/openAI.route");
const { submissionRoute } = require("./routes/assignmentSubmission.route");
// const passport = require("passport");
// const session = require("express-session");
// const { AuthRouter } = require("./routes/auth.route");
// require("./passport");

const app = express();

// app.use(
//     session({
//         secret: process.env.SECRET_KEY,
//         resave: false,
//         saveUninitialized: true
//     })
// );

// app.use(passport.initialize());
// app.use(passport.session());

app.use(cors());
app.use(express.json());
app.use("/user", userRouter);
app.use("/courses", courseRouter);
app.use("/assignment", assignmentRouter)
app.use("/submission", submissionRoute)
app.use("/", aiRouter)
// app.use('/auth', AuthRouter)
app.use('/uploads', express.static(path.join(__dirname, '/uploads')))


app.listen(process.env.PORT, async () => {
    try {
        await connection;
        console.log("DB Connected Successfully");
        console.log(`Server is Running on Port ${process.env.PORT}`);
    } catch (error) {
        console.log(error);
    }
});
