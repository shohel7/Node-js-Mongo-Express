const express = require("express");
const cors = require("cors");
const ejs = require("ejs");
const app = express();

require("./config/database");
require("./config/passport");
const User = require("./models/user.model");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();


app.set('view engine', 'ejs');
app.use(cors());
app.use(express.urlencoded({ extended: true}));
app.use(express.json());

// session
app.set('trust proxy', 1) // trust first proxy
app.use(
    session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    collectionName: 'session',
  })
//   cookie: { secure: true }
  })
);

// passport initialize 
app.use(passport.initialize());
app.use(passport.session());

// base url
app.get('/', (req, res) => {
    res.render('index.ejs');
});

// // register : get => register page will return
// app.get('/register', (req, res) => {
//     res.render('register');
// });
// // register : post => register form post
// app.post('/register', async(req, res) => {
//    try {
//     const user = await User.findOne({ username: req.body.username });
//     if (user) return res.status(400).send("user already exits");

//     bcrypt.hash(req.body.password, saltRounds, async(err, hash)=> {
//         const newUser = new  User({
//             username: req.body.username,
//             password: hash,
//         });
//         await newUser.save();
//         res.redirect("/login");
//     });

//    } catch (error) {
//     res.status(500).send(error.message);
//    }
// });

// check login status
const checkLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) {
        return res.redirect("/profile");
    }
    next();
}
// login : get => login page will return
app.get('/login', checkLoggedIn, (req, res) => {
    res.render('login');
});

// // login : post => login from post
// app.post('/login', 
//   passport.authenticate('local', {
//      failureRedirect: '/login',
//      successRedirect: '/profile',
// })
// );

// login with google auth
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', {
     failureRedirect: '/login',
     successRedirect: '/profile',
}),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

// check authenticated user
const checkAuthenticated = (req, res, next) => {
    if(req.isAuthenticated()) {
        return next();
    }
   res.redirect('/login');
}

// profile protected route
app.get('/profile', checkAuthenticated, (req, res) => {
    res.render('profile', {username: req.user.username}); 
 });

// logout route
app.get('/logout', (req, res) => {    
    try {
        req.logout((err)=>{
            if (err) {
                return next(err);
            }
            res.redirect('/');
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = app;