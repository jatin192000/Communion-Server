const mongoose = require("mongoose");

const CommunitySchema = new mongoose.Schema(
	{
		username: {
			type: String,
			unique: true,
			required: true,
			min: 6,
			max: 15,
		},
		admin: [{ type: String }],
		name: {
			type: String,
			max: 20,
		},
		about: {
			type: String,
			max: 200,
		},
		profilePicture: {
			type: String,
			default: "avatar.png",
		},
		coverPicture: {
			type: String,
			default: "noCover.png",
		},
		tags: [{ type: String }],
		posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
		followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Community", CommunitySchema);
