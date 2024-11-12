const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync");

// Render login form
router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

// Handle login with passport
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    req.flash("success", "Welcome! You are now logged in.");
    res.redirect("/index");
  }
);

module.exports = router;
