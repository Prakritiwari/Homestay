const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
   .route("/")
   //all listings (index route)
   .get( wrapAsync(listingController.index))
   //create route
   .post(isLoggedIn,
      upload.single("listing[image]"),
      validateListing, 
      wrapAsync(listingController.createListing));
   


 //new route
 router.get("/new",isLoggedIn , listingController.renderNewForm);

router.get("/filter/:category", listingController.renderCategory);

router
   .route("/:id")
   //show route
   .get( wrapAsync(listingController.showListing))
   //update route
   .put(
      isLoggedIn,
      isOwner,
      upload.single("listing[image]"),
      validateListing,
      wrapAsync(listingController.updateListing))
    //delete route
   .delete( isLoggedIn,
      isOwner,
      wrapAsync(listingController.destroyListing));

 
 //edit route
 router.get("/:id/edit",
    isLoggedIn, 
    isOwner, wrapAsync(listingController.renderEditForm));
 
 module.exports = router;

  // router.get("/testlisting", async (req,res) => {
  //    let sampleListing = new Listing ({
  //         title : "Luxury Villa",
  //         description : "Small and cozy",
  //         price : "17500", 
  //         location : "Ladakh",
  //         country : "India"
  // });
  //     await sampleListing.save();
 //     res.send("working");
 // });   
