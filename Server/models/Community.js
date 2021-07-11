const mongoose = require("mongoose");

const CommunitySchema = new mongoose.Schema(
	{
		username: {
			type: String,
			unique: true,
			required: true,
			min: 5,
			max: 25,
		},
		admin: [
			{
				username: { type: String },
				profilePicture: { type: String },
			},
		],
		moderators: [
			{
				username: { type: String },
				profilePicture: { type: String },
			},
		],
		name: {
			type: String,
			max: 20,
		},
		about: {
			type: String,
			max: 200,
		},
		rules: {
			type: String,
			max: 1000,
		},
		profilePicture: {
			type: String,
			default: "community.svg",
		},
		coverPicture: {
			type: String,
			default: "communityCover.svg",
		},
		tags: [{ type: String }],
		posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
		reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Report" }],
		followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Community", CommunitySchema);
