if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

// console.log(process.env);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
var methodOveride = require('method-override');
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStratergy = require("passport-local");
const User = require("./models/user.js")

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const { saveRedirectUrl } = require("./middleware.js");


app.engine('ejs',ejsMate);
app.use(methodOveride('_method'));
app.set("views", path.join(__dirname,"/views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "public")));

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/homestay");
}

main()
.then( () => {
    console.log("connection successfull with database");
}).catch((err) => {
    console.log(err);
});

const sessionOptions = {
    secret : "mysupersecretstring",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    }
}


// app.get("/", (req,res) => {
//     res.send("Hi! I'm root home page");
    
// });

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);


app.all("*sf", (req, res, next ) => {
    next( new ExpressError(404, "Page not found!"));
});

app.use((err, req, res , next ) => {
    let {statusCode = 500, message = "Something went wrong!"} = err;
    res.status(statusCode).render("error.ejs" , {err});
});

app.listen("8080", () => {
    console.log("The port is listening from port 8080");
});
