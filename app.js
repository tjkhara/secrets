require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var md5 = require('md5');

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create the schema
const usersSchema = new mongoose.Schema({
  email: String,
  password: String,
});


// Create the model
const User = mongoose.model("User", usersSchema);

//TODO

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// To register the users
app.post("/register", (req, res) => {
  const userEmail = req.body.username;
  const userPassword = req.body.password;

  const newUser = new User({
    email: userEmail,
    password: md5(userPassword),
  });

  newUser.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});

// To check the users credentials and log them in
app.post("/login", (req, res) => {
  const userEmail = req.body.username;
  const userPassword = req.body.password;

  // Check in the db to see if you can find a user with this email
  User.findOne({ email: userEmail }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      if (user) {
        if (user.password === md5(userPassword)``) {
          res.render("secrets");
        } else {
          console.log("User found, but password does not match.");
        }
      } else {
        console.log("No user found");
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server has started.");
});
