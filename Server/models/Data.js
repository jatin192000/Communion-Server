const mongoose = require("mongoose");

const DataSchema = new mongoose.Schema({
	year: {
		type: String,
		unique: true,
	},
	users: [
		{
			type: Number,
			default: 0,
		},
	],
	posts: [
		{
			type: Number,
			default: 0,
		},
	],
	communities: [
		{
			type: Number,
			default: 0,
		},
	],
	reports: [
		{
			type: Number,
			default: 0,
		},
	],
	comments: [
		{
			type: Number,
			default: 0,
		},
	],
});

module.exports = mongoose.model("Data", DataSchema);
