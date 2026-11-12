const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const User = require("../models/user.js");

const CATEGORY_META = [
    { name: "Trending", icon: "fa-solid fa-fire" },
    { name: "Rooms", icon: "fa-solid fa-bed" },
    { name: "Iconic Cities", icon: "fa-solid fa-mountain-city" },
    { name: "Mountains", icon: "fa-solid fa-mountain" },
    { name: "Castles", icon: "fa-brands fa-fort-awesome" },
    { name: "Amazing Pools", icon: "fa-solid fa-person-swimming" },
    { name: "Camping", icon: "fa-solid fa-campground" },
    { name: "Farms", icon: "fa-solid fa-cow" },
    { name: "Arctic", icon: "fa-solid fa-snowflake" },
    { name: "Domes", icon: "fa-solid fa-igloo" },
    { name: "Boats", icon: "fa-solid fa-ship" },
];

const greetingFor = (hour) => {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
};

module.exports.index = async (req, res) => {
    const [totalListings, totalHosts, locations, priceStats, categoryGroups, featuredListings] = await Promise.all([
        Listing.countDocuments(),
        User.countDocuments(),
        Listing.distinct("location"),
        Listing.aggregate([{ $group: { _id: null, averagePrice: { $avg: "$price" } } }]),
        Listing.aggregate([
            { $match: { category: { $ne: null } } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
        ]),
        Listing.aggregate([
            { $lookup: { from: "reviews", localField: "reviews", foreignField: "_id", as: "reviews" } },
            {
                $addFields: {
                    averageRating: { $avg: "$reviews.rating" },
                    reviewCount: { $size: "$reviews" },
                },
            },
            { $sort: { averageRating: -1, reviewCount: -1, _id: -1 } },
            { $limit: 4 },
        ]),
    ]);

    const averagePrice = priceStats.length && priceStats[0].averagePrice
        ? Math.round(priceStats[0].averagePrice)
        : 0;
    const destinationCount = locations.filter((location) => location && String(location).trim() !== "").length;

    const countByCategory = categoryGroups.reduce((counts, group) => {
        counts[group._id] = group.count;
        return counts;
    }, {});

    const categoryStats = CATEGORY_META
        .map((category, index) => ({
            ...category,
            count: countByCategory[category.name] || 0,
            order: index,
        }))
        .sort((a, b) => b.count - a.count || a.order - b.order);

    // Personal hosting snapshot for signed-in users
    let hosting = null;
    if (req.user) {
        const myListings = await Listing.find({ owner: req.user._id })
            .populate("reviews")
            .sort({ _id: -1 });

        hosting = {
            listingCount: myListings.length,
            reviewCount: myListings.reduce((total, listing) => total + (listing.reviews ? listing.reviews.length : 0), 0),
            latest: myListings.slice(0, 2),
        };
    }

    const greeting = greetingFor(new Date().getHours());

    res.render("home.ejs", {
        pageTitle: "Dashboard",
        greeting,
        totalListings,
        totalHosts,
        destinationCount,
        averagePrice,
        categoryStats,
        featuredListings,
        hosting,
    });
};
