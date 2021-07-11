const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
	{
		author: [
			{
				username: { type: String },
				profilePicture: { type: String },
			},
		],
		reason: {
			type: String,
			max: 100,
			required: true,
		},
		type: {
			for: {
				type: String,
			},
			id: { type: String },
		},
		status: {
			type: String,
			default: "pending",
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Report", ReportSchema);
