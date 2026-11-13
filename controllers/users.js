const User = require("../models/user.js");

// Only allow redirecting back to a local path (prevents open redirects)
const safeReturnTo = (value) => {
    if (typeof value !== "string") return null;
    if (!value.startsWith("/") || value.startsWith("//")) return null;
    return value;
};

module.exports.renderSignupForm = (req, res ) => {
    res.render("users/signup.ejs", {
        pageTitle: "Sign up",
        returnTo: safeReturnTo(req.query.returnTo) || "",
    });

}

module.exports.signup = async(req, res, next) => {
    const returnTo = safeReturnTo(req.body.returnTo) || safeReturnTo(req.session.redirectUrl);
    try{
        let {username, email, password } = req.body;
        const newUser = new User({email, username});
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err){
                return next(err);
            }
            delete req.session.redirectUrl;
            req.flash("success", "Welcome to Homestay!");
            res.redirect(returnTo || "/listings");
        });
        
    }catch(e){
        req.flash("error", e.message);
        const params = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
        res.redirect(`/signup${params}`);
    }
 
}

module.exports.renderLoginForm = async(req, res) => {
     res.render("users/login.ejs", {
         pageTitle: "Log in",
         returnTo: safeReturnTo(req.query.returnTo) || "",
     });
}

module.exports.login = async(req, res) => {
        const returnTo = safeReturnTo(req.body.returnTo)
            || safeReturnTo(res.locals.redirectUrl)
            || "/listings";
        delete req.session.redirectUrl;
        req.flash("success", "Welcome back to Homestay!");
        console.log("[auth] login success ->", returnTo);
        res.redirect(returnTo);
    }

module.exports.logout =  (req, res ) => {
    req.logout((err) => {
        if(err){
            return next (err);
        }
        req.flash("success", "You Logged Out!");
        res.redirect("/listings");
    });
}