const express = require("express");
const userRouter = express.Router();
const passport = require("passport");
const passportConfig = require("../passport");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
let path = require("path");
const JWT = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendMail");
const crypto = require("crypto");

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
					message: "Error has occured",
					success: false,
				});
			if (user)
				res.status(400).json({
					message: "Username is Already Taken",
					success: false,
				});
			else {
				const newUser = new User({ username, email, password });
				newUser.save((err) => {
					if (err)
						res.status(500).json({
							message: "Email Already Exists for another user",
							success: false,
						});
					else
						res.status(201).json({
							message: "Account Successfully Created",
							success: true,
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
				message: "Logged Successfully",
				success: true,
			});
		} else {
			res.status(404).json({
				message: "Invalid Credentials",
				success: true,
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
				message: "Deleted and Logged out Successfully",
				success: true,
			});
		} else {
			res.status(500).json({
				message: "You cannot delete this user",
				success: false,
			});
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
			res.status(401).json({
				message: "unauthorized",
				success: false,
			});
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
			res.status(401).json({
				message: "unauthorized",
				success: false,
			});
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
				res.status(500).json({ message: err.message, success: false });
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
			res.status(404).json({
				message: "user not found",
				success: false,
			});
		res.status(200).json(other);
	} catch (err) {
		res.status(500).json({
			message: err.message,
			success: false,
		});
	}
});

//user image upload

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./client/public/Images");
	},
	filename: function (req, file, cb) {
		cb(null, uuidv4() + "-" + Date.now() + path.extname(file.originalname));
	},
});

const fileFilter = (req, file, cb) => {
	const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
	if (allowedFileTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

var upload = multer({ storage, limits: { fileSize: 1000000 }, fileFilter });

userRouter
	.route("/uploadProfile/:id")
	.put(
		upload.single("profile"),
		passport.authenticate("jwt", { session: false }),
		async (req, res) => {
			const photo = req.file.filename;
			if (req.params.id == req.user._id) {
				const user = await User.findById(req.params.id);
				user.profilePicture = photo;
				user.save()
					.then(() =>
						res.status(200).json({
							message: "Profile Picture Uploaded",
							success: true,
						})
					)
					.catch((err) =>
						res
							.status(500)
							.json({ message: err.message, success: false })
					);
			} else {
				res.status(401).json({
					message: "Unauthorized",
					success: false,
				});
			}
		}
	);
userRouter
	.route("/uploadCover/:id")
	.put(
		upload.single("cover"),
		passport.authenticate("jwt", { session: false }),
		async (req, res) => {
			const photo = req.file.filename;
			if (req.params.id == req.user._id) {
				const user = await User.findById(req.params.id);
				user.coverPicture = photo;
				user.save()
					.then(() =>
						res.status(200).json({
							message: "Cover Picture Uploaded",
							success: true,
						})
					)
					.catch((err) =>
						res
							.status(500)
							.json({ message: err.message, success: false })
					);
			} else {
				res.status(401).json({
					message: "Unauthorized",
					success: false,
				});
			}
		}
	);

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
			message: "Logged out Successfully",
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
			message: "User Authenticated",
			success: true,
		});
	}
);

//forgot password
userRouter.post("/forgotpassword", async (req, res) => {
	const { email } = req.body;
	try {
		const user = await User.findOne({ email });

		if (!user) {
			res.status(404).json({
				message: "No user with this email found",
				success: false,
			});
		}

		const resetToken = user.getResetPasswordToken();

		await user.save();

		const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;

		const message = `<h1>You have requested a password reset</h1><p>Please go to the link to reset your password</p><a href = ${resetUrl} clicktracking=off>${resetUrl}</a>`;

		try {
			await sendEmail({
				to: user.email,
				subject: "Password Reset Request",
				text: message,
			});

			res.status(200).json({
				message: "Reset Link Sent to email",
				success: true,
			});
		} catch (error) {
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;

			await user.save();
			res.status(500).json({
				message: "Email could not be send",
				success: false,
			});
		}
	} catch (error) {
		res.status(500).json({
			message: error.message,
			success: false,
		});
	}
});
userRouter.put("/passwordreset/:resetToken", async (req, res) => {
	const resetPasswordToken = crypto
		.createHash("sha256")
		.update(req.params.resetToken)
		.digest("hex");

	try {
		const user = await User.findOne({
			resetPasswordToken,
			resetPasswordExpire: { $gt: Date.now() },
		});

		if (!user) {
			res.status(400).json({
				message: "Invalid Reset Token",
				success: false,
			});
		} else {
			user.password = req.body.password;
			user.resetPasswordToken = undefined;
			user.resetPasswordExpire = undefined;

			await user.save().then(
				res.status(201).json({
					message: "Password Reset Success",
					success: true,
				})
			);
		}
	} catch (error) {
		console.log(error.message);
	}
});

module.exports = userRouter;
