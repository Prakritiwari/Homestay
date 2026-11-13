if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}
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
const bookingRouter = require("./routes/booking.js");
const { saveRedirectUrl } = require("./middleware/index.js");


app.engine('ejs',ejsMate);
app.use(methodOveride('_method'));
app.set("views", path.join(__dirname,"/views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "public")));

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "homestay";

// Cache the in-flight connect promise so parallel requests share one connection
let connectionPromise = null;

async function connectDB() {
    if (!MONGO_URI) {
        throw new Error("MONGO_URI is not set in the environment");
    }

    // Reuse a live connection, but verify it first: serverless instances can be
    // frozen with a dead socket while mongoose still reports readyState === 1.
    if (mongoose.connection.readyState === 1) {
        try {
            await mongoose.connection.db.admin().ping();
            return mongoose.connection;
        } catch (err) {
            console.error("MongoDB ping failed, reconnecting:", err.message);
            await mongoose.disconnect().catch(() => {});
        }
    }

    if (!connectionPromise) {
        console.log("Connecting to MongoDB Atlas...");
        connectionPromise = mongoose
            .connect(MONGO_URI, {
                serverSelectionTimeoutMS: 8000,
                connectTimeoutMS: 8000,
                socketTimeoutMS: 45000,
                dbName: MONGO_DB_NAME,
                bufferCommands: false,
            })
            .then((mongooseInstance) => {
                console.log("MongoDB Atlas Connected:", mongooseInstance.connection.name);
                return mongooseInstance.connection;
            })
            .catch((err) => {
                console.error("MongoDB connection failed:", err.message);
                throw err;
            })
            .finally(() => {
                connectionPromise = null;
            });
    }

    return connectionPromise;
}

app.connectDB = connectDB;

module.exports = app;

const sessionOptions = {
    secret : process.env.SESSION_SECRET,
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
    res.locals.currentPath = req.path;
    next();
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/bookings", bookingRouter);
app.use("/", userRouter);

// The public home page is the listings index; the old dashboard was removed.
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// Deployment/database check — no views, no database query.
app.get("/health", (req, res) => {
    res.json({
        ok: true,
        commit: process.env.VERCEL_GIT_COMMIT_SHA || "local",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        dbName: mongoose.connection.name || null,
        uptime: Math.round(process.uptime()),
    });
});

app.get("/privacy", (req, res) => {
    res.render("info.ejs", {
        pageTitle: "Privacy",
        title: "Privacy policy",
        paragraphs: [
            "Homestay only stores the account details you provide when you sign up, such as your username, email address and the listings you create.",
            "Listing details, photos and reviews are public so travellers can discover and evaluate your stay. Your exact address is never shown publicly — only the approximate map location is displayed.",
            "We never sell your personal data. You can request deletion of your account and listings at any time by contacting hello@homestay.example.",
        ],
    });
});

app.get("/terms", (req, res) => {
    res.render("info.ejs", {
        pageTitle: "Terms",
        title: "Terms of use",
        paragraphs: [
            "By using Homestay you agree to provide accurate information about the places you list and to keep your listing details, pricing and availability up to date.",
            "Guests and hosts are responsible for communicating respectfully and for honouring confirmed bookings. Reviews must reflect a real stay experience.",
            "Prices are shown in Indian rupees. Where GST is displayed, an 18% tax estimate is added for transparency. Homestay may update these terms as the service evolves.",
        ],
    });
});


app.use((req, res, next ) => {
    console.log("[404]", req.method, req.originalUrl);
    next( new ExpressError(404, "Page not found!"));
});

app.use((err, req, res , next ) => {
    let {statusCode = 500, message = "Something went wrong!"} = err;
    res.status(statusCode).render("error.ejs" , {err});
});

// Local development entry point. On Vercel the app is imported by api/index.js,
// which calls app.connectDB() for each request instead of listening on a port.
if (require.main === module) {
    connectDB()
        .then(() => {
            app.listen("8080", () => {
                console.log("The port is listening from port 8080");
            });
        })
        .catch((err) => {
            console.log("MongoDB Connection Error:", err.message);
            process.exit(1);
        });
}
