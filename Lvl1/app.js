//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser : true, useUnifiedTopology: true})
// Define a user schema for the MongoDB collection
const userSchema = new mongoose.Schema({
    email : String,
    password: String
});

const User = new mongoose.model("User", userSchema);
// Route to render the home page
app.get("/", (req, res) => {
    res.render("home");
})

// Route to render the login page
app.get("/login", (req, res) => {
    res.render("login");
})

// Route to render the registration page
app.get("/register", (req, res) => {
    res.render("register");
});

// Route to handle user registration
app.post("/register", async (req, res) => {
    const newUser = new User({
        email : req.body.username,
        password : req.body.password
    });

    try {
        // Save the new user to the database
        await newUser.save();
        // Render the "secrets" page if registration is successful
        res.render("secrets");
    } catch (err) {
        // Log any errors that occur during registration
        console.log(err);
    }
});

app.post("/login", async (req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        try {
            // Attempt to find a user with the provided email (username)
            const foundUser = await User.findOne({ email: username });
    
            if (foundUser && foundUser.password === password) {
                // If the user is found and the password matches, render the "secrets" page
                res.render("secrets");
            }
        } catch (err) {
            // Log any errors that occur during the login process
            console.log(err);
        }
})


app.listen(3000, function(){
    console.log("Server started 3000");
})