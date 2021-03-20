require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

// session
app.use(
  session({
    secret: "Longo longo longo",
    resave: false,
    saveUninitialized: true,
  })
);

// passport
app.use(passport.initialize());
app.use(passport.session());

// mongoose connection

const mongoUser = process.env.MONGO_USER
const mongoPassword = process.env.MONGO_PASSWORD

mongoose.connect(`mongodb+srv://${mongoUser}:${mongoPassword}@firstcluster.ohomc.mongodb.net/userDB`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Create the schema
const usersSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});

// Configure passport-local-mongoose
// Enable it
usersSchema.plugin(passportLocalMongoose);

// Add the findOrCreate plugin
usersSchema.plugin(findOrCreate);

// Create the model
const User = mongoose.model("User", usersSchema);

// Using passport-local-mongoose
// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// serialize and deserialize using passport
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// Configure passport-local-mongoose END ***

// Google oauth code start

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

// Google oauth code END ***

// Routes START

app.get("/", (req, res) => {
  res.render("home");
});

// Route for google button
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to the secrets page.
    res.redirect("/secrets");
  }
);

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// The secrets route
// Show all secrets
app.get("/secrets", (req, res) => {
  User.find({"secret": {$ne: null}},function (err, foundUsers) {
    if (err) {
      console.log(err);
    } else {
      if(foundUsers){
        res.render('secrets', {usersWithSecrets: foundUsers})
      }
    }
  });
});

// logout route
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

// To register the users
app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function () {
          // This call back is only triggered if authentication is successful
          res.redirect("/secrets");
        });
      }
    }
  );
});

// To check the users credentials and log them in
app.post("/login", (req, res) => {
  // Create new user
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  // Use passport to authenticate this user
  // the login function will login the user once
  // the authenticate function will keep the user logged in
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        // This call back is only triggered if authentication is successful
        res.redirect("/secrets");
      });
    }
  });
});

// Routes to the submit secrets page
app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

// Post route for submit
app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;

  // Find the user by id and update the secret
  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function () {
          res.redirect("/secrets");
        });
      }
    }
  });
});

// Routes END ***

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server has started.");
});
