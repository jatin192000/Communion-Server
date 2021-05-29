const express = require("express");
const postRouter = express.Router();
const passport = require("passport");
const Post = require("../models/Post");
const User = require("../models/User");

//create post
postRouter.post(
	"/create",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const post = new Post(req.body);
		post.author = req.user.username;
		await post.save((err) => {
			if (err)
				res.status(500).json({
					message: {
						msgBody: "Error has occured",
						msgError: true,
					},
				});
			else {
				req.user.posts.push(post);
				req.user.save((err) => {
					if (err)
						res.status(500).json({
							message: {
								msgBody: "Error has occured",
								msgError: true,
							},
						});
					else
						res.status(200).json({
							message: {
								msgBody: "Successfully created post",
								msgError: false,
							},
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
				if (req.user.role == "admin" || post.author == req.user._id) {
					Post.findOneAndRemove({ _id: req.params.id }, (err) => {
						if (err) {
							next(err);
						}
						if (req.user.role == "user") {
							req.user.posts.pull(post);
							req.user.save((err) => {
								if (err)
									res.status(500).json({
										message: {
											msgBody: "Error has occured",
											msgError: true,
										},
									});
							});
						} else {
							const user = User.findById(post.author);
							if (!user) {
								user.posts.pull(post._id);
								user.save((err) => {
									if (err)
										res.status(500).json({
											message: {
												msgBody: "Error has occured",
												msgError: true,
											},
										});
								});
							}
						}
						res.status(200).json({
							message: "Post successfully deleted",
							success: true,
						});
						next();
					});
				} else {
					res.status(403).json({
						message: {
							msgBody: "Unauthorized",
							msgError: true,
						},
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
			if (post.author == req.user._id) {
				await post.updateOne({ $set: req.body });
				res.status(200).json({
					message: "the post has been updated",
					success: true,
				});
			} else {
				res.status(403).json({
					message: "unauthorized",
					success: "false",
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
						msgBody: "Error has occured",
						msgError: true,
					},
				});
			else {
				res.status(200).json({ posts: document, success: true });
			}
		});
});

module.exports = postRouter;
