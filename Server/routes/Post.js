const express = require("express");
const postRouter = express.Router();
const passport = require("passport");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Community = require("../models/Community");

//create post
postRouter.post(
	"/create",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const post = new Post(req.body);
		post.author.username = req.user.username;
		post.author.profilePicture = req.user.profilePicture;
		await post.save((err) => {
			if (err)
				res.status(500).json({
					message: "Error has occured",
					success: false,
				});
			else {
				req.user.posts.push(post);
				req.user.save((err) => {
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
);

//delete post
postRouter.delete(
	"/delete/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res, next) => {
		try {
			const post = await Post.findById(req.params.id);
			if (!post) {
				res.status(500).json({
					message: "post not found",
					success: false,
				});
			} else {
				if (
					req.user.role == "admin" ||
					post.author.username == req.user.username
				) {
					Post.findOneAndRemove(
						{ _id: req.params.id },
						async (err) => {
							if (err) {
								next(err);
							}
							if (req.user.role == "user") {
								if (post.community) {
									const community = await Community.findOne({
										username: post.community.username,
									});
									if (community) {
										await community.posts.pull(
											req.params.id
										);
										await community.save();
									}
								}
								await req.user.posts.pull(post);
								await req.user.save((err) => {
									if (err)
										res.status(500).json({
											message: "Error has occured",
											success: false,
										});
								});
							} else {
								const user = await User.findOne({
									username: post.author.username,
								});
								if (user) {
									user.posts.pull(post._id);
									user.save((err) => {
										if (err)
											res.status(500).json({
												message: "Error has occured",
												success: false,
											});
									});
								} else {
									res.status(500).json({
										message: "Error has occured",
										success: false,
									});
								}
							}
							res.status(200).json({
								message: "Post successfully deleted",
								success: true,
							});
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
		} catch (err) {
			next(err);
		}
	}
);

//update post
postRouter.put(
	"/update/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res, next) => {
		try {
			const post = await Post.findById(req.params.id);
			if (!post) {
				res.status(500).json({
					message: "Post does not exists",
					success: false,
				});
			}
			if (post.author.username == req.user._id) {
				await post.updateOne({ $set: req.body });
				res.status(200).json({
					message: "the post has been updated",
					success: true,
				});
			} else {
				res.status(403).json({
					message: "unauthorized",
					success: false,
				});
			}
			next();
		} catch (err) {
			next(err);
		}
	}
);

//upvote or undo-upvote a post
postRouter.put(
	"/upvote/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res, next) => {
		try {
			const post = await Post.findById(req.params.id);
			if (
				!post.upvotes.includes(req.user._id) &&
				!post.downvotes.includes(req.user._id)
			) {
				await post.updateOne({ $push: { upvotes: req.user._id } });
				res.status(200).json({
					message: "The post has been upvoted",
					success: true,
				});
			} else if (
				!post.upvotes.includes(req.user._id) &&
				post.downvotes.includes(req.user._id)
			) {
				await post.updateOne({ $push: { upvotes: req.user._id } });
				await post.updateOne({ $pull: { downvotes: req.user._id } });
				res.status(200).json({
					message: "The post has been upvoted",
					success: true,
				});
			} else {
				await post.updateOne({ $pull: { upvotes: req.user._id } });
				res.status(200).json({
					message: "The post has been un-upvoted",
					success: true,
				});
			}
			next();
		} catch (err) {
			next(err);
		}
	}
);

//dwnvote or undo-downvote a post
postRouter.put(
	"/downvote/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res, next) => {
		try {
			const post = await Post.findById(req.params.id);
			if (
				!post.downvotes.includes(req.user._id) &&
				!post.upvotes.includes(req.user._id)
			) {
				await post.updateOne({ $push: { downvotes: req.user._id } });
				res.status(200).json({
					message: "The post has been downvoted",
					success: true,
					user: req.user.username,
				});
			} else if (
				!post.downvotes.includes(req.user._id) &&
				post.upvotes.includes(req.user._id)
			) {
				await post.updateOne({ $push: { downvotes: req.user._id } });
				await post.updateOne({ $pull: { upvotes: req.user._id } });
				res.status(200).json({
					message: "The post has been downvoted",
					success: true,
				});
			} else {
				await post.updateOne({ $pull: { downvotes: req.user._id } });
				res.status(200).json({
					message: "The post has been un-downvoted",
					success: true,
				});
			}
			next();
		} catch (err) {
			next(err);
		}
	}
);

//get all posts
postRouter.get("/all", (req, res) => {
	Post.find({})
		.populate("posts")
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
					posts: document,
					message: "All posts successfully fetched",
					success: true,
				});
			}
		});
});

//get timeline
postRouter.get(
	"/timeline",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const currentUser = await User.findById(req.user._id);
			const userPosts = await Post.find({
				"author.username": req.user.username,
			});
			const friendPosts = await Promise.all(
				currentUser.following.map(async (friendsID) => {
					const friend = await User.findById(friendsID);
					return Post.find({ "author.username": friend.username });
				})
			);
			const communityPosts = await Promise.all(
				currentUser.communities.map(async (communityID) => {
					const community = await Community.findById(communityID);
					return Post.find({
						"community.username": community.username,
					});
				})
			);
			res.json({
				posts: userPosts
					.concat(...friendPosts)
					.concat(...communityPosts),
				message: "Posts successfully fetched",
				success: true,
			});
		} catch (err) {
			res.status(500).json(err);
		}
	}
);

postRouter.get("/dashboard/:username", async (req, res) => {
	try {
		await Post.find({ "author.username": req.params.username }).then(
			(userPosts) => {
				res.json({
					posts: userPosts,
					message: "Posts successfully fetched",
					success: true,
				});
			}
		);
	} catch (err) {
		res.status(500).json({
			message: err.message,
			success: false,
		});
	}
});

postRouter.get("/dashboardCommunity/:username", async (req, res) => {
	try {
		await Post.find({
			"community.username": req.params.username,
		}).then((userPosts) => {
			res.json({
				posts: userPosts,
				message: "Posts successfully fetched",
				success: true,
			});
		});
	} catch (err) {
		res.status(500).json({
			message: err.message,
			success: false,
		});
	}
});

//comment post
postRouter.put(
	"/:id/comment",
	passport.authenticate("jwt", { session: false }),
	async (req, res, next) => {
		try {
			const comment = new Comment(req.body);
			comment.author.username = req.user.username;
			comment.author.profilePicture = req.user.profilePicture;
			await comment.save();
			await Post.findByIdAndUpdate(req.params.id, {
				$push: { comments: comment },
			}).then(() => {
				res.status(200).json({
					message: "Commented",
					success: true,
				});
			});
			next();
		} catch (err) {
			next(err);
		}
	}
);

//comment delete
postRouter.delete(
	"/:id/Deletecomment/:c_id",
	passport.authenticate("jwt", { session: false }),
	async (req, res, next) => {
		try {
			await Comment.findById(req.params.c_id).then(
				async (err, comment) => {
					if (err) {
						res.status(500).json({
							message: "Some error occured",
							success: false,
						});
					} else if (comment !== undefined) {
						if (comment.author.username == req.user.username) {
							await Comment.findByIdAndDelete(req.params.c_id);
							await Post.findByIdAndUpdate(req.params.id, {
								$pull: { comments: comment._id },
							}).then(() => {
								res.status(200).json({
									message: "Comment Deleted",
									success: true,
								});
							});
						} else {
							res.status(401).json({
								message: "Unauthorized",
								success: false,
							});
						}
					} else {
						res.status(404).json({
							message: "Comment not found",
							success: false,
						});
					}
				}
			);
			next();
		} catch (err) {
			next(err);
		}
	}
);

module.exports = postRouter;
