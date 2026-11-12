const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const LISTING_CATEGORIES = ["Trending","Rooms","Iconic Cities","Mountains","Castles","Amazing Pools","Camping","Farms","Arctic","Domes","Boats"];

// Only accept plain strings from the query string (guards against NoSQL injection)
const queryString = (value) => (typeof value === "string" ? value : "");

// Returns a non-negative number from the query string, or null when absent/invalid
const queryNumber = (value) => {
    const raw = queryString(value).trim();
    if(raw === "") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports.index = async (req,res) => {
    const sortOptions = {
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        newest: { _id: -1 },
        oldest: { _id: 1 },
    };
    const requestedSort = queryString(req.query.sort);
    const currentSort = sortOptions[requestedSort] ? requestedSort : "oldest";

    // Collect the active filters
    const requestedCategory = queryString(req.query.category);
    const activeCategory = LISTING_CATEGORIES.includes(requestedCategory) ? requestedCategory : "";
    const searchQuery = queryString(req.query.query).trim();
    const minPrice = queryNumber(req.query.minPrice);
    const maxPrice = queryNumber(req.query.maxPrice);
    const minRating = queryNumber(req.query.minRating);

    const match = {};
    if(activeCategory) match.category = activeCategory;

    if(minPrice !== null || maxPrice !== null){
        match.price = {};
        if(minPrice !== null) match.price.$gte = minPrice;
        if(maxPrice !== null) match.price.$lte = maxPrice;
    }

    if(searchQuery){
        const regex = new RegExp(escapeRegex(searchQuery), "i");
        match.$or = [
            { title: regex },
            { location: regex },
            { country: regex },
            { category: regex },
        ];
    }

    const pipeline = [
        { $match: match },
        { $lookup: { from: "reviews", localField: "reviews", foreignField: "_id", as: "reviews" } },
    ];

    // Filter on the average review rating
    if(minRating !== null && minRating > 0){
        pipeline.push({ $addFields: { averageRating: { $avg: "$reviews.rating" } } });
        pipeline.push({ $match: { averageRating: { $gte: minRating } } });
    }

    pipeline.push({ $sort: sortOptions[currentSort] });

    const allListings = await Listing.aggregate(pipeline);

    const heading = searchQuery
        ? "Search results"
        : activeCategory
            ? activeCategory
            : "Explore stays";

    res.render("./listings/index.ejs", {
        allListings,
        currentSort,
        categories: LISTING_CATEGORIES,
        activeCategory,
        searchQuery,
        priceFilter: {
            min: minPrice !== null ? minPrice : "",
            max: maxPrice !== null ? maxPrice : "",
        },
        ratingFilter: {
            min: minRating !== null && minRating > 0 ? minRating : "",
        },
        heading,
        pageTitle: searchQuery
            ? `Search: ${searchQuery}`
            : activeCategory
                ? `${activeCategory} stays`
                : "Explore stays",
    });
 }

module.exports.myListings = async (req, res) => {
    const allListings = await Listing.find({ owner: req.user._id })
        .populate("reviews")
        .sort({ _id: -1 });
    res.render("./listings/index.ejs", {
        allListings,
        currentSort: "newest",
        heading: "My listings",
        subheading: "Places you host on Homestay",
        isMyListings: true,
        pageTitle: "My listings",
    });
 }

module.exports.renderNewForm = (req, res) => {
     res.render("./listings/new.ejs", { pageTitle: "List your place" });

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
         return res.redirect("/listings");
      }
      res.render("./listings/show.ejs", {listing, pageTitle: listing.title});
  }

module.exports.createListing = async (req,res) => {
       if(!req.body.listing){
           throw new ExpressError(400, "Listing data invalid!")
       }
       let {title, description, price, location, country, category} = req.body.listing;

       let response = await geocodingClient
       .forwardGeocode({
        query: `${location}, ${country}`,
        limit: 1,
        })
        .send()

       let geometry = { type: "Point", coordinates: [78.9629, 20.5937] }; // fallback: centre of India
       if(response.body.features.length > 0){
           geometry = response.body.features[0].geometry;
       }

       let newListing = new Listing({
           title: title,
           description: description,
           price : price,
           location: location,
           country: country,
           category: category,
           geometry: geometry,
       });

       if(typeof req.file !== "undefined") {
           let url = req.file.path;
           let filename = req.file.filename;
           newListing.image = { url , filename };
       }

       newListing.owner = req.user._id;
       await newListing.save();

       req.flash("success", "New Listing Created!");
       res.redirect(`/listings/${newListing._id}`);
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
        res.render("./listings/edit.ejs",{listing , originalImageUrl, pageTitle: `Edit · ${listing.title}`});
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

 module.exports.searchListings = async (req, res) => {
   const query = queryString(req.query.query).trim();
   if(!query){
     return res.redirect("/listings");
   }

   res.redirect(`/listings?query=${encodeURIComponent(query)}`);
 }

 module.exports.renderCategory = async (req, res) => {
   const category = req.params.category;
   res.redirect(`/listings?category=${encodeURIComponent(category)}`);
 } 