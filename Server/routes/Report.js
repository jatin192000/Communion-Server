const express = require("express");
const reportRouter = express.Router();
const passport = require("passport");
const Community = require("../models/Community");
const Report = require("../models/Report");
const User = require("../models/User");
const Post = require("../models/Post");
const Data = require("../models/Data");
//create report
reportRouter.post(
	"/create/:type/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		var d = new Date();
		var y = d.getFullYear();
		var m = d.getMonth();
		const x = await Report.find(
			{ type: { for: req.params.type, id: req.params.id } },
			async function (err, data) {
				if (err) {
					return res.status(500).json({
						message: "Some error occured",
						success: true,
					});
				} else if (data.length > 0) {
					var flag = true;
					for (var i = 0; i < data[0].author.length; i++) {
						if (data[0].author[i].username == req.user.username) {
							flag = false;
							return res.status(200).json({
								message: "Reported Successfully",
								success: true,
							});
						}
					}
					if (flag) {
						const report = await Report.findById(data[0]._id);
						report.author.push({
							username: req.user.username,
							profilePicture: req.user.profilePicture,
						});
						report.save();
						const dataFind = await Data.find({ year: y });
						if (dataFind.length > 0) {
							var newCount = dataFind[0].reports;
							newCount[m] += 1;
							await Data.findByIdAndUpdate(dataFind[0]._id, {
								$set: { reports: newCount },
							});
						} else {
							const dataCreate = new Data({
								year: y,
								users: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
								posts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
								communities: [
									0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
								],
								reports: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
								comments: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
							});
							dataCreate.reports[m] = 1;
							dataCreate.save();
						}
						return res.status(200).json({
							message: "Reported Successfully",
							success: true,
						});
					}
				}
			}
		);
		if (x.length == 0) {
			const dataFind = await Data.find({ year: y });
			if (dataFind.length > 0) {
				var newCount = dataFind[0].reports;
				newCount[m] += 1;
				await Data.findByIdAndUpdate(dataFind[0]._id, {
					$set: { reports: newCount },
				});
			} else {
				const dataCreate = new Data({
					year: y,
					users: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					posts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					communities: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					reports: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
					comments: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				});
				dataCreate.reports[m] = 1;
				dataCreate.save();
			}
			const report = new Report(req.body);
			report.author.push({
				username: req.user.username,
				profilePicture: req.user.profilePicture,
			});
			report.type.for = req.params.type;
			report.type.id = req.params.id;
			await report.save((err) => {
				if (err)
					return res.status(500).json({
						message: "Error has occured",
						success: false,
					});
				else {
					report.save((err) => {
						if (err)
							return res.status(500).json({
								message: "Error has occured",
								success: false,
							});
						else {
							if (report.type.for == "post") {
								Post.findById(report.type.id).then((data) => {
									if (
										data.community &&
										data.community.username
									) {
										Community.find({
											username: data.community.username,
										}).then((data) => {
											if (data.admin) {
												data.admin.forEach(
													(element) => {
														User.find({
															username:
																element.username,
														}).then((data) => {
															data.reports.push(
																report
															);
														});
													}
												);
											}
										});
									}
								});
							}
							User.find({ role: "admin" }).then((data) => {
								data.forEach((element) => {
									element.reports.push(report);
									element.save();
								});
							});
							res.status(200).json({
								message: "Reported Successfully",
								success: true,
							});
						}
					});
				}
			});
		}
	}
);
module.exports = reportRouter;
