const express = require("express");
const communityRouter = express.Router();
const passport = require("passport");
const Community = require("../models/Community");
const User = require("../models/User");

//create community
communityRouter.post(
	"/create",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const community = new Community(req.body);
		community.admin.push(req.user.username);
		await community.save((err) => {
			if (err)
				res.status(500).json({
					message: "Error has occured",
					success: false,
				});
			else {
				req.user.communities.push(community);
				req.user.save((err) => {
					if (err)
						res.status(500).json({
							message: "Error has occured",
							success: false,
						});
					else
						res.status(200).json({
							message: "Community created Successfully",
							success: true,
						});
				});
			}
		});
	}
);

//delete community
communityRouter.delete(
	"/delete/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res, next) => {
		try {
			await Community.findById(req.params.id).then(async (community) => {
				if (!community) {
					res.status(500).json({
						message: "community not found",
						success: false,
					});
				} else {
					if (
						req.user.role == "admin" ||
						community.admin.includes(req.user.username)
					) {
						for (i = 0; i < community.admin.length; i++) {
							await User.findOne({
								username: community.admin[i],
							}).then((user) => {
								if (user) {
									user.communities.pull(community._id);
									user.save((err) => {
										if (err)
											res.status(500).json({
												message: "Error has occured",
												success: false,
											});
									});
								}
							});
						}
						Community.findOneAndRemove(
							{ _id: req.params.id },
							(err) => {
								if (err) {
									next(err);
								} else {
									res.status(200).json({
										message:
											"Community successfully deleted",
										success: true,
									});
								}
								next();
							}
						);
					} else {
						res.status(403).json({
							message: "Unauthorized",
							success: false,
						});
					}
				}
			});
		} catch (err) {
			next(err);
		}
	}
);

//update community
communityRouter.put(
	"/update/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res, next) => {
		try {
			Community.findById(req.params.id).then(async (community) => {
				if (!community) {
					res.status(500).json({
						message: "Community does not exists",
						success: false,
					});
				}
				if (community.admin.includes(req.user.username)) {
					await community.updateOne({ $set: req.body }).then(() => {
						res.status(200).json({
							message: "the community has been updated",
							success: true,
						});
					});
				} else {
					res.status(403).json({
						message: "unauthorized",
						success: false,
					});
				}
				next();
			});
		} catch (err) {
			next(err);
		}
	}
);

//get all communities
communityRouter.get("/all", (req, res) => {
	Community.find({})
		.populate("communities")
		.exec((err, document) => {
			if (err)
				res.status(500).json({
					message: {
						message: "Error has occured",
						success: false,
					},
				});
			else {
				res.status(200).json({
					communities: document,
					message: "All communitys successfully fetched",
					success: true,
				});
			}
		});
});

module.exports = communityRouter;
