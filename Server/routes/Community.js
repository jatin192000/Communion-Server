const express = require("express");
const communityRouter = express.Router();
const passport = require("passport");
const Community = require("../models/Community");
const User = require("../models/User");
const Post = require("../models/Post");

//create community
communityRouter.post(
	"/create",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const community = new Community(req.body);
		community.admin.push({
			username: req.user.username,
			profilePicture: req.user.profilePicture,
		});
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
					const admin = community.admin.find(
						(admin) => admin["username"] === req.user.username
					);
					if (
						req.user.role == "admin" ||
						(admin && admin.username === req.user.username)
					) {
						for (i = 0; i < community.admin.length; i++) {
							await User.findOne({
								username: community.admin[i].username,
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
				const admin = community.admin.find(
					(admin) => admin["username"] === req.user.username
				);
				if (admin) {
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

//add admin
communityRouter.put(
	"/addAdmin/:id",
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
				const admin1 = community.admin.find(
					(admin1) => admin1["username"] === req.body.username
				);
				if (admin1) {
					res.status(409).json({
						message: "Already an admin of this community",
						success: true,
					});
				} else {
					const admin = community.admin.find(
						(admin) => admin["username"] === req.user.username
					);

					if (admin) {
						await community.admin.push(req.body);
						User.findOne({ username: req.body.username }).then(
							async (data) => {
								if (data) {
									data.communities.push(community);
								}
								await data.save();
							}
						);
						await community.save().then(() => {
							res.status(200).json({
								message: "Admin has been added successfully",
								success: true,
							});
						});
					} else {
						res.status(403).json({
							message: "unauthorized",
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

//add moderator
communityRouter.put(
	"/addModerator/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res, next) => {
		try {
			await Community.findById(req.params.id).then(async (community) => {
				if (!community) {
					res.status(500).json({
						message: "Community does not exists",
						success: false,
					});
				}
				if (community.moderators) {
					const moderator1 = community.moderators.find(
						(moderator) =>
							moderator["username"] === req.body.username
					);
					if (moderator1) {
						res.status(409).json({
							message: "Already a moderator of this community",
							success: true,
						});
					}
				}
				const admin = community.admin.find(
					(admin) => admin["username"] === req.user.username
				);
				if (admin) {
					await community.moderators.push(req.body);
					await community.save().then(() => {
						res.status(200).json({
							message: "Moderator has been added successfully",
							success: true,
						});
					});
				} else {
					res.status(403).json({
						message: "unauthorized",
						success: false,
					});
				}
			});
		} catch (err) {
			next(err);
		}
	}
);

//remove Admin
communityRouter.put(
	"/removeAdmin/:id",
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
				if (community.admin.length == 1) {
					res.status(406).json({
						message:
							"You are the only admin of this community, atleast one admin needed",
						success: false,
					});
				} else {
					const admin = community.admin.find(
						(admin) => admin["username"] === req.user.username
					);
					if (admin) {
						var index = -1;
						for (let i = 0; i < community.admin.length; i++) {
							if (
								community.admin[i].username ===
								req.body.username
							) {
								index = i;
								break;
							}
						}
						if (index == -1) {
							res.status(404).json({
								message: "Admin not found",
								success: false,
							});
						} else {
							community.admin.splice(index, 1);
							User.findOne({ username: req.body.username }).then(
								(data) => {
									if (data) {
										data.communities.pull(community);
									}
									data.save();
								}
							);
							community.save().then(() => {
								res.status(200).json({
									message:
										"Admin has been removed successfully",
									success: true,
								});
							});
						}
					} else {
						res.status(401).json({
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

//remove Moderator
communityRouter.put(
	"/removeModerator/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res, next) => {
		try {
			Community.findById(req.params.id).then(async (community) => {
				if (!community) {
					res.status(500).json({
						message: "Community does not exists",
						success: false,
					});
				} else {
					const admin = community.admin.find(
						(admin) => admin["username"] === req.user.username
					);
					if (admin) {
						var index = -1;
						for (let i = 0; i < community.moderators.length; i++) {
							if (
								community.moderators[i].username ===
								req.body.username
							) {
								index = i;
								break;
							}
						}
						if (index == -1) {
							res.status(404).json({
								message: "Moderator not found",
								success: false,
							});
						} else {
							community.moderators.splice(index, 1);
							community.save().then(() => {
								res.status(200).json({
									message:
										"Moderator has been removed successfully",
									success: true,
								});
							});
						}
					} else {
						res.status(401).json({
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

//create post on community
communityRouter.post(
	"/:username/createPost",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const community = await Community.findOne({
			username: req.params.username,
		});
		const post = new Post(req.body);
		post.community.username = community.username;
		post.community.profilePicture = community.profilePicture;
		post.author.username = req.user.username;
		post.author.profilePicture = req.user.profilePicture;
		await post.save(async (err) => {
			if (err)
				res.status(500).json({
					message: "Error has occured",
					success: false,
				});
			else {
				await community.posts.push(post);
				await community.save(async (err) => {
					if (err) {
						res.status(500).json({
							message: "Error has occured",
							success: false,
						});
					} else {
						await req.user.posts.push(post);
						await req.user.save((err) => {
							if (err)
								res.status(500).json({
									message: "Error has occured",
									success: false,
								});
							else
								res.status(200).json({
									message: "Post created Successfully",
									success: true,
								});
						});
					}
				});
			}
		});
	}
);

communityRouter.put(
	"/:username/follow",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const community = await Community.findOne({
				username: req.params.username,
			});
			const currentUser = await User.findById(req.user._id);
			if (!currentUser.communities.includes(community._id)) {
				await community.updateOne({
					$push: { followers: currentUser._id },
				});
				await currentUser.updateOne({
					$push: { communities: community._id },
				});
				res.status(200).json({
					message: "Community has been followed",
					success: true,
				});
			} else {
				await community.updateOne({
					$pull: { followers: req.user._id },
				});
				await currentUser.updateOne({
					$pull: { communities: community._id },
				});
				res.status(200).json({
					message: "Community has been Unfollowed",
					success: true,
				});
			}
		} catch (err) {
			res.status(500).json({ message: err.message, success: false });
		}
	}
);

module.exports = communityRouter;
