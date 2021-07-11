const express = require("express");
const adminRouter = express.Router();
const passport = require("passport");
const User = require("../models/User");
const Post = require("../models/Post");
const Community = require("../models/Community");
const Data = require("../models/Data");
const Report = require("../models/Report");

adminRouter.get(
	"/",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		if (req.user.role === "admin") {
			try {
				var dashboardData = [];
				await User.countDocuments({}, function (err, result) {
					if (err) {
						console.log(err);
					} else {
						dashboardData.push({ userCount: result });
					}
				});
				await Post.countDocuments({}, function (err, result) {
					if (err) {
						console.log(err);
					} else {
						dashboardData.push({ postCount: result });
					}
				});
				await Community.countDocuments({}, function (err, result) {
					if (err) {
						console.log(err);
					} else {
						dashboardData.push({ communityCount: result });
					}
				});
				await Report.countDocuments({}, function (err, result) {
					if (err) {
						console.log(err);
					} else {
						dashboardData.push({ reportCount: result });
					}
				});
				var d = new Date();
				var y = d.getFullYear();
				const data = await Data.find(
					{ year: y },
					"year users posts communities reports comments"
				);
				res.status(200).json({
					count: dashboardData,
					data: data[0],
					message: "data successfully fetched",
					success: true,
				});
			} catch (error) {
				console.log(error.message);
			}
		} else
			res.status(403).json({
				message: "You're not an admin,go away",
				success: false,
			});
	}
);

adminRouter.get("/users", async (req, res) => {
	try {
		const users = await User.find(
			{},
			"username email role profilePicture createdAt"
		).exec();
		if (users) {
			res.status(200).json({
				users: users,
				message: "Users successfully fetched",
				success: true,
			});
		} else {
			res.status(400).json({
				message: "Users not found",
				success: false,
			});
		}
	} catch (err) {
		res.status(500).json({
			message: err.message,
			success: false,
		});
	}
});
adminRouter.get("/reports", async (req, res) => {
	try {
		const reports = await Report.find(
			{},
			"author type reason status createdAt"
		).exec();
		if (reports) {
			res.status(200).json({
				reports: reports,
				message: "Reports successfully fetched",
				success: true,
			});
		} else {
			res.status(400).json({
				message: "Reports not found",
				success: false,
			});
		}
	} catch (err) {
		res.status(500).json({
			message: err.message,
			success: false,
		});
	}
});

adminRouter.put(
	"/report/status/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const report = await Report.findById(req.params.id);
		if (report) {
			if (report.status == "pending") report.status = "solved";
			else report.status = "pending";
			report.save();
			res.status(200).json({
				message: "Status updated",
				success: true,
			});
		} else {
			res.status(404).json({
				message: "User not found",
				success: false,
			});
		}
	}
);
adminRouter.put(
	"/user/role/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const user = await User.findById(req.params.id);
		if (user) {
			if (user.role == "admin") user.role = "user";
			else user.role = "admin";
			user.save();
			res.status(200).json({
				message: "Role updated",
				success: true,
			});
		} else {
			res.status(404).json({
				message: "User not found",
				success: false,
			});
		}
	}
);

module.exports = adminRouter;
