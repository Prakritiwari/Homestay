const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req,res) => {
    let allListings =  await Listing.find({});
    res.render("./listings/index.ejs",{allListings});
 }

module.exports.renderNewForm = (req, res) => {
     res.render("./listings/new.ejs");

 }

module.exports.showListing = async(req,res) => {
      let {id} = req.params;
      let listing = await Listing.findById(id)
         .populate({path: "reviews",
             populate : {
             path: "author"
             },
         })
         .populate("owner");
      if(!listing){
         req.flash("error", "The Listing you want does not exist!");
         res.redirect("/listings");
      }
      res.render("./listings/show.ejs", {listing});
  }

module.exports.createListing = async (req,res) => {
       if(!req.body.listing){
           throw new ExpressError(400, "Listing data invalid!")
       }
       let {title, description, image, price, location, country} = req.body;
       let newListing = new Listing ({
           title: title,
           description: description,
           image: image,
           price : price,
           location: location,
           country: country,
       });  

    //    let response = await geocodingClient
    //    .forwardGeocode({
    //     query: req.body.listing.location ,
    //     limit: 1,
    //     })
    //     .send()

    //    let url = req.file.path;
    //    let filename = req.file.filename;
    //    let newListing = new Listing (req.body.listing);
    //    newListing.owner = req.user._id;
    //    newListing.image = { url , filename }
    //    newListing.geometry = response.body.features[0].geometry;
    //    newListing.category = req.body.category;
    //    await newListing.save();
    //    req.flash("success", "New Listing Created!");
    //    res.redirect("/listings");
   }

module.exports.renderEditForm = async (req,res) => {
        let {id} = req.params;
        let listing = await Listing.findById(id);
        if(!listing){
           req.flash("error", "The Listing you want does not exist!");
           res.redirect("/listings");
        }

        let originalImageUrl = listing.image.url;
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300/w_250");
        res.render("./listings/edit.ejs",{listing , originalImageUrl});
    }

module.exports.updateListing = async(req,res) => {
     // if(!req.body.listing){
     //     throw new ExpressError(400, "Listing data invalid!")
     // }
     let {id} = req.params;
     let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

     if(typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url , filename};
        await listing.save();
     }
     
     req.flash("success", "Listing Updated!");
     res.redirect(`/listings/${id}`);
 
 }

module.exports.destroyListing = async(req,res) => {
     let {id} = req.params;
     await Listing.findByIdAndDelete(id);
     req.flash("success", "Listing Deleted!");
     res.redirect("/listings");
 }

 module.exports.renderCategory = async(req, res) => {
   
   let allListings= await Listing.find({category :req.params.category});
    if(allListings[0] == null){
    req.flash("error","Sorry! Theres no current Listing here : (")
   }
   console.log(allListings);
  
   res.render( "./listings/filter.ejs", { allListings})
 } 