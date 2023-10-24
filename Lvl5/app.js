//jshint esversion:6
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

// Set up session handling
app.use(session ({
    secret : "Our secret",
    resave : true,
    saveUninitialized : false
}));

// Initialize Passport and set up session management
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser : true, useUnifiedTopology: true})

const userSchema = new mongoose.Schema({
    email : String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// Configure Passport to use a local strategy for authentication
passport.use(User.createStrategy());

// Serialize and deserialize the user to maintain sessions
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

  // Set up Google OAuth2.0 authentication strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: ["email", "profile"],
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("profile: " + profile);
    User.findOrCreate({ googleId: profile.id, username: profile.emails[0].value  }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/auth/google", 
    passport.authenticate("google", { scope: ["email","profile"] })
)

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/logout", function (req, res){
    req.logout( function(err) {
        if(err) {
            console.log(err);
        }
        else{
            res.redirect("/");
        }
    });
    
});

app.get("/secrets", async (req, res) => { 
    try {
        const foundUsers = await User.find({ "secret": { $ne: null } }).exec();
        res.render("secrets", { usersWithSecrets: foundUsers });
    } catch (err) {
        console.log(err);
    }
});

app.get("/submit", (req, res) => {
    if( req.isAuthenticated() ){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit", async (req, res) => {
    try{
    const submittedSecret = req.body.secret;

    console.log( "submitSecret : ",submittedSecret);
    console.log( "User : ",req.user);

    const foundUser = await User.findById(req.user.id);

            if(foundUser) {
                foundUser.secret = submittedSecret;
                await foundUser.save()
                res.redirect("/secrets");
            }
    }
    catch(err){
        console.log("Error : ",err);
    }
})

app.post("/register", async (req, res) => {
    // Use User.register method provided by Passport-Local-Mongoose
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err); 
            res.redirect("/register");
        }
        else{
        // Authenticate user after registration and redirect to secrets
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
        }
      });
});

app.post("/login", async (req, res) => {
    // Create a new User with the provided username and password
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
    // Use req.login for login and passport authentication
        req.login(user, function(err, user) {
            if(err){
                console.log(err);
            }
            else{
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets")
                })
            }
        })
})


app.listen(3000, function(){
    console.log("Server started 3000");
})