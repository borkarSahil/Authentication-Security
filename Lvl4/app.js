//jshint esversion:6
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');



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
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

// Configure Passport to use a local strategy for authentication
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home");
})

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

app.get("/secrets", (req, res) => { 
    if( req.isAuthenticated() ){
        res.render("secrets");
    }else{
        res.redirect("/login");
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