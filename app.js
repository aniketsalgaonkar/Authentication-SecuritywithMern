require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://localhost:27017/userDB");
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
});

const User = new mongoose.model("User", userSchema);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  const user = new User({
    email: req.body.username,
    password: req.body.password,
  });

  user
    .save()
    .then(function () {
      res.render("secrets");
    })
    .catch(function (err) {
      res.send(err);
    });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  const insertedEmail = req.body.username;
  const insertedPassword = req.body.password;

  User.findOne({ email: insertedEmail }).then(function (user) {
    if (user) {
      if (user.password === insertedPassword) {
        res.render("secrets");
      }
    } else {
      res.render("login");
    }
  });
});
app.listen(3000, function (req, res) {
  console.log("Server is listening to port 3000");
});
