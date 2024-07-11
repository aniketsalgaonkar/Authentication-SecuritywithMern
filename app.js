require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");  // 1st type of encryption
// const md5 = require("md5");                      // 2nd type of encryption
// const bcrypt = require("bcryptjs");              // 3rd type of encryption
// const saltRounds = 10;
const session = require("express-session"); // cookie session
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

//----------- session ---------------
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
// ----------------------------------

// console.log(md5("hello"));
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
});

// userSchema.plugin(encrypt, {                       // Encrption through mongoose encryption .env method
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

userSchema.plugin(passportLocalMongoose); // session
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// ---------- session ------------------
passport.use(User.createStrategy());
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});
// -------------------------------------

//------------- Google OAuth ----------------

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);
//-----------------------------------------------
app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/play", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("play");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    })
    .catch(function (err) {
      console.log(err);
      res.redirect("/register");
    });
});

// ----------------- Bcrypt encryption ----------------------------  in app.post("/register")
// bcrypt.hash(req.body.password, saltRounds).then(function (hash) {
//   const user = new User({
//     email: req.body.username,
//     // password: md5(req.body.password),
//     password: hash,
//   });
//   user
//     .save()
//     .then(function () {
//       res.render("secrets");
//     })
//     .catch(function (err) {
//       res.send(err);
//     });
// });
// });

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });

  // -------------- bcrypt -----------------------------------
  // const insertedEmail = req.body.username;
  // const insertedPassword = req.body.password;
  // User.findOne({ email: insertedEmail }).then(function (user) {
  //   if (user) {
  //     bcrypt.compare(insertedPassword, user.password, function (err, response) {
  //       if (response === true) {
  //         res.render("secrets");
  //       }
  //     });
  //   }
  // });
});

app.get("/logout", function (req, res) {
  req.logout(function () {
    res.redirect("/");
  });
});
app.listen(3000, function (req, res) {
  console.log("Server is listening to port 3000");
});
