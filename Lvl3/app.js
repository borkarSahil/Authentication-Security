//jshint esversion:6
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser : true, useUnifiedTopology: true})

const userSchema = new mongoose.Schema({
    email : String,
    password: String
});

const secret = process.env.SECRET;
console.log(secret);

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
})

app.get("/login", (req, res) => {
    res.render("login");
})

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    
    bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
        const newUser = new User({
            email : req.body.username,
            password : hash
        });
    
        try {
            await newUser.save();
            res.render("secrets");
        } catch (err) {
            console.log(err);
        }
    });

});

app.post("/login", async (req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        try {
            const foundUser = await User.findOne({ email: username });

            if (foundUser) { 
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if(result === true)
                        res.render("secrets");
                });
            }
        } catch (err) {
            console.log(err);
        }
})


app.listen(3000, function(){
    console.log("Server started 3000");
})