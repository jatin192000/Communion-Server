const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
	{
		author: {
			username: { type: String },
			profilePicture: { type: String },
		},
		community: {
			username: { type: String },
			profilePicture: { type: String },
		},
		title: {
			type: String,
			required: [true, "Title of post is required"],
			max: 200,
		},
		body: {
			type: String,
			required: [true, "Body of post is required"],
			max: 10000,
		},
		upvotes: {
			type: Array,
			default: [],
		},
		downvotes: {
			type: Array,
			default: [],
		},
		comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);
