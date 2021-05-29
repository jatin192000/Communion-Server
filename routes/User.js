const express = require("express");
const userRouter = express.Router();
const passport = require("passport");
const passportConfig = require("../passport");
const JWT = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (userID) => {
	return JWT.sign(
		{
			iss: process.env.JWT_KEY,
			sub: userID,
		},
		process.env.JWT_KEY,
		{ expiresIn: process.env.JWT_EXPIRE }
	);
};

//register user
userRouter.post("/register", (req, res) => {
	const { username, email, password } = req.body;
	User.findOne(
		{
			username,
		},
		(err, user) => {
			if (err)
				res.status(500).json({
					message: {
						msgBody: "Error has occured",
						msgError: true,
					},
				});
			if (user)
				res.status(400).json({
					message: {
						msgBody: "Username is already taken",
						msgError: true,
					},
				});
			else {
				const newUser = new User({ username, email, password });
				newUser.save((err) => {
					if (err)
						res.status(500).json({
							message: {
								msgBody: "Error has occured",
								msgError: true,
							},
						});
					else
						res.status(201).json({
							message: {
								msgBody: "Account successfully created",
								msgError: false,
							},
						});
				});
			}
		}
	);
});

//login user
userRouter.post(
	"/login",
	passport.authenticate("local", { session: false }),
	(req, res) => {
		if (req.isAuthenticated()) {
			const { _id, username, role } = req.user;
			const token = signToken(_id);
			res.cookie("access_token", token, {
				httpOnly: true,
				sameSite: true,
			});
			res.status(200).json({
				isAuthenticated: true,
				user: {
					username,
					role,
					_id,
				},
			});
		}
	}
);

//delete user
userRouter.delete(
	"/delete/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		if (req.user.role == "admin" && req.user._id != req.params.id) {
			await User.findByIdAndDelete(req.params.id);
			res.status(200).json({ message: "Account Deleted", success: true });
		} else if (req.user._id == req.params.id) {
			await User.findByIdAndDelete(req.params.id);
			res.clearCookie("access_token");
			res.status(200).json({
				user: {
					username: "",
					role: "",
					_id: "",
				},
				success: true,
			});
		} else {
			res.status(500).json("You cannot delete this user");
		}
	}
);

//update user
userRouter.put(
	"/update/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		if (req.body.password) {
			res.status(401).json({
				message: "Password cannot be changed from here",
				success: false,
			});
		} else if (req.user._id == req.params.id) {
			await User.findByIdAndUpdate(req.params.id, {
				$set: req.body,
			});
			res.status(200).json({
				message: "Profile updated",
				success: true,
			});
		} else {
			res.status(401).json({ message: "unauthorized", success: false });
		}
	}
);

//change password
userRouter.put(
	"/updatePassword/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		if (req.user._id == req.params.id) {
			const user = await User.findById(req.params.id);
			user.password = req.body.password;
			user.save();
			res.status(200).json({
				message: "Password updated",
				success: true,
			});
		} else {
			res.status(401).json({ message: "unauthorized", success: false });
		}
	}
);

//follow user
userRouter.put(
	"/follow/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		if (req.user._id == req.params.id) {
			res.status(404).json({
				message: "You cannot follow yourself",
				success: false,
			});
		} else {
			try {
				const user = await User.findById(req.params.id);
				const currentUser = await User.findById(req.user._id);
				if (!user.followers.includes(req.user._id)) {
					await user.updateOne({
						$push: { followers: req.user._id },
					});
					await currentUser.updateOne({
						$push: { following: req.params.id },
					});
					res.status(200).json({
						message: "User has been followed",
						success: true,
					});
				} else {
					await user.updateOne({
						$pull: { followers: req.user._id },
					});
					await currentUser.updateOne({
						$pull: { following: req.params.id },
					});
					res.status(200).json({
						message: "User has been unfollowed",
						success: true,
					});
				}
			} catch (err) {
				res.status(500).json(err);
			}
		}
	}
);

//get user data
userRouter.get("/username/:username", async (req, res) => {
	try {
		const user = await User.findOne({ username: req.params.username });
		const {
			password,
			updatedAt,
			resetPasswordToken,
			resetPasswordExpire,
			__v,
			...other
		} = user._doc;
		if (!user)
			res.status(404).json({ message: "user not found", success: false });
		res.status(200).json(other);
	} catch (err) {
		res.status(500).json(err);
	}
});

//logout user
userRouter.get(
	"/logout",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		res.clearCookie("access_token");
		res.json({
			user: {
				username: "",
				role: "",
				_id: "",
			},
			success: true,
		});
	}
);

//authenticate user
userRouter.get(
	"/authenticated",
	passport.authenticate("jwt", { session: false }),
	(req, res) => {
		const { _id, username, role } = req.user;
		res.status(200).json({
			isAuthenticated: true,
			user: {
				_id,
				username,
				role,
			},
		});
	}
);

module.exports = userRouter;
