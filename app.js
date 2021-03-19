require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

// session
app.use(session({
  secret: 'Longo longo longo',
  resave: false,
  saveUninitialized: true
}))

// passport
app.use(passport.initialize())
app.use(passport.session())

// mongoose connection
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

// Create the schema
const usersSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// Configure passport-local-mongoose
// Enable it
usersSchema.plugin(passportLocalMongoose);

// Create the model
const User = mongoose.model("User", usersSchema);

// Using passport-local-mongoose
// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Configure passport-local-mongoose END ***

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

// The secrets route
app.get('/secrets', (req, res) => {
  if(req.isAuthenticated()){
    res.render('secrets')
  } else {
    res.redirect('login')
  }
})

// logout route
app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

// To register the users
app.post("/register", (req, res) => {
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err)
    } else {
      passport.authenticate("local")(req, res, function(){
        // This call back is only triggered if authentication is successful
        res.redirect("/secrets")
      })
    }
  })
});

// To check the users credentials and log them in
app.post("/login", (req, res) => {
  // Create new user
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })

  // Use passport to authenticate this user
  // the login function will login the user once
  // the authenticate function will keep the user logged in
  req.login(user, function(err){
    if(err){
      console.log(err)
    } else {
      passport.authenticate("local")(req, res, function(){
        // This call back is only triggered if authentication is successful
        res.redirect("/secrets")
      })
    }
  })
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server has started.");
});
