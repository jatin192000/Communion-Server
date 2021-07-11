const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

app.use(cookieParser());
app.use(express.json());

mongoose.connect(
	process.env.MONGO_URL,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true,
	},
	() => {
		console.log("successfully connected to database");
	}
);

const userRouter = require("./routes/User");
const postRouter = require("./routes/Post");
const adminRouter = require("./routes/Admin");
const communityRouter = require("./routes/Community");
const reportRouter = require("./routes/Report");
app.use("/user", userRouter);
app.use("/post", postRouter);
app.use("/admin", adminRouter);
app.use("/community", communityRouter);
app.use("/report", reportRouter);
app.listen(process.env.PORT, () => {
	console.log(`express server started at port ${process.env.PORT}`);
});
