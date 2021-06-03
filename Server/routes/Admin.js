const express = require("express");
const adminRouter = express.Router();
const passport = require("passport");
const User = require("../models/User");

adminRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    if (req.user.role === "admin") {
      res.status(200).json({
        message: {
          msgBody: "You are an admin",
          msgError: false,
        },
      });
    } else
      res.status(403).json({
        message: {
          msgBody: "You're not an admin,go away",
          msgError: true,
        },
      });
  }
);

module.exports = adminRouter;
