const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
	{
		author: {
			username: { type: String },
			profilePicture: { type: String },
		},
		body: {
			type: String,
			max: 1000,
		},
		upvotes: {
			type: Array,
			default: [],
		},
		downvotes: {
			type: Array,
			default: [],
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
