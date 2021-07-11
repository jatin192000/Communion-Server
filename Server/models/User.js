const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			unique: true,
			required: true,
			min: 6,
			max: 15,
		},
		email: {
			type: String,
			unique: true,
			required: true,
		},
		name: {
			type: String,
			max: 20,
		},
		bio: {
			type: String,
			max: 50,
		},
		website: {
			type: String,
			max: 100,
		},
		location: {
			type: String,
			max: 30,
		},
		profilePicture: {
			type: String,
			default: "avatar.svg",
		},
		coverPicture: {
			type: String,
			default: "noCover.png",
		},
		password: {
			type: String,
			required: true,
		},
		communities: [
			{ type: mongoose.Schema.Types.ObjectId, ref: "Community" },
		],
		role: {
			type: String,
			default: "user",
		},
		reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
		posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
		followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		resetPasswordToken: String,
		resetPasswordExpire: Date,
	},
	{ timestamps: true }
);

UserSchema.pre("save", function (next) {
	if (!this.isModified("password")) return next();
	bcrypt.hash(this.password, 10, (err, passwordHash) => {
		if (err) return next(err);
		this.password = passwordHash;
		next();
	});
});

UserSchema.methods.comparePassword = function (password, cb) {
	bcrypt.compare(password, this.password, (err, isMatch) => {
		if (err) return cb(err);
		else {
			if (!isMatch) return cb(null, isMatch);
			return cb(null, this);
		}
	});
};
UserSchema.methods.comparePasswords = async function (password) {
	return await bcrypt.compare(password, this.password);
};
UserSchema.methods.getResetPasswordToken = function () {
	const resetToken = crypto.randomBytes(20).toString("hex");

	// Hash token (private key) and save to database
	this.resetPasswordToken = crypto
		.createHash("sha256")
		.update(resetToken)
		.digest("hex");

	// Set token expire date
	this.resetPasswordExpire = Date.now() + 10 * (60 * 1000); // Ten Minutes

	return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
