const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const { processPayment } = require("../utils/payment.js");

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TAX_RATE = 0.18;
const MAX_GUESTS = 20;
const MAX_NIGHTS = 365;

const startOfTodayUTC = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const parseDateOnly = (value) => {
    if(typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
};

const toDateInput = (date) => new Date(date).toISOString().slice(0, 10);

const nightsBetween = (checkIn, checkOut) => Math.round((checkOut - checkIn) / MS_PER_DAY);

const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
});

const calculatePricing = (pricePerNight, nights) => {
    const subtotal = Math.round(pricePerNight * nights);
    const tax = Math.round(subtotal * TAX_RATE);
    return { subtotal, tax, total: subtotal + tax };
};

const isListingAvailable = async (listingId, checkIn, checkOut) => {
    const conflict = await Booking.exists({
        listing: listingId,
        status: { $in: ["pending", "confirmed"] },
        checkIn: { $lt: checkOut },
        checkOut: { $gt: checkIn },
    });

    return !conflict;
};

const reservationUrl = (listingId, { checkIn, checkOut, guests }) => {
    const params = new URLSearchParams({
        checkIn: toDateInput(checkIn),
        checkOut: toDateInput(checkOut),
        guests: String(guests),
    });

    return `/listings/${listingId}/reserve?${params.toString()}`;
};

const ownsListing = (listing, user) => String(listing.owner) === String(user._id);

const validateStay = (checkIn, checkOut, guests) => {
    if(!checkIn || !checkOut || checkOut <= checkIn || checkIn < startOfTodayUTC()){
        return "Please choose valid check-in and check-out dates.";
    }

    const nights = nightsBetween(checkIn, checkOut);
    if(nights < 1 || nights > MAX_NIGHTS){
        return `Stays must be between 1 and ${MAX_NIGHTS} nights.`;
    }

    if(!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS){
        return `Please choose between 1 and ${MAX_GUESTS} guests.`;
    }

    return null;
};

module.exports.renderReservation = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if(!listing){
        req.flash("error", "The listing you want to reserve does not exist.");
        return res.redirect("/listings");
    }

    if(ownsListing(listing, req.user)){
        req.flash("error", "You can't reserve your own listing.");
        return res.redirect(`/listings/${listing._id}`);
    }

    const checkIn = parseDateOnly(req.query.checkIn);
    const checkOut = parseDateOnly(req.query.checkOut);
    const guests = Number.parseInt(req.query.guests, 10) || 1;
    const stayError = validateStay(checkIn, checkOut, guests);

    if(stayError){
        req.flash("error", stayError);
        return res.redirect(`/listings/${listing._id}`);
    }

    if(!(await isListingAvailable(listing._id, checkIn, checkOut))){
        req.flash("error", "Those dates are already booked. Please choose different dates.");
        return res.redirect(`/listings/${listing._id}`);
    }

    const nights = nightsBetween(checkIn, checkOut);
    const pricePerNight = listing.price || 0;
    const pricing = calculatePricing(pricePerNight, nights);

    res.render("bookings/new.ejs", {
        pageTitle: `Reserve · ${listing.title}`,
        listing,
        checkIn: toDateInput(checkIn),
        checkOut: toDateInput(checkOut),
        checkInDisplay: formatDate(checkIn),
        checkOutDisplay: formatDate(checkOut),
        nights,
        guests,
        pricePerNight,
        pricing,
    });
};

module.exports.createBooking = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if(!listing){
        req.flash("error", "The listing you want to reserve does not exist.");
        return res.redirect("/listings");
    }

    if(ownsListing(listing, req.user)){
        req.flash("error", "You can't reserve your own listing.");
        return res.redirect(`/listings/${listing._id}`);
    }

    const bookingInput = req.body.booking || {};
    const checkIn = parseDateOnly(bookingInput.checkIn);
    const checkOut = parseDateOnly(bookingInput.checkOut);
    const guests = Number.parseInt(bookingInput.guests, 10);
    const stayError = validateStay(checkIn, checkOut, guests);

    if(stayError){
        req.flash("error", stayError);
        return res.redirect(`/listings/${listing._id}`);
    }

    if(!(await isListingAvailable(listing._id, checkIn, checkOut))){
        req.flash("error", "Those dates were just booked by someone else. Please choose different dates.");
        return res.redirect(`/listings/${listing._id}`);
    }

    const nights = nightsBetween(checkIn, checkOut);
    const pricePerNight = listing.price || 0;
    const pricing = calculatePricing(pricePerNight, nights);

    const payment = await processPayment({
        method: bookingInput.paymentMethod,
        amount: pricing.total,
        details: {
            cardName: bookingInput.cardName,
            cardNumber: bookingInput.cardNumber,
            cardExpiry: bookingInput.cardExpiry,
            cardCvv: bookingInput.cardCvv,
            upiId: bookingInput.upiId,
            bankName: bookingInput.bankName,
        },
    });

    if(!payment.success){
        req.flash("error", payment.message);
        return res.redirect(reservationUrl(listing._id, { checkIn, checkOut, guests }));
    }

    const booking = await Booking.create({
        listing: listing._id,
        guest: req.user._id,
        checkIn,
        checkOut,
        guests,
        nights,
        pricePerNight,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        total: pricing.total,
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: bookingInput.paymentMethod,
        transactionId: payment.transactionId,
        cardLast4: payment.cardLast4,
    });

    req.flash("success", "Payment successful — your stay is booked!");
    console.log("[booking] confirmed", booking._id.toString(), "-> /bookings");
    res.redirect("/bookings");
};

module.exports.index = async (req, res) => {
    const bookings = await Booking.find({ guest: req.user._id })
        .populate("listing")
        .sort({ checkIn: 1 });

    // Upcoming stays first (soonest), then past stays (most recent)
    const today = startOfTodayUTC();
    bookings.sort((a, b) => {
        const aUpcoming = new Date(a.checkOut) >= today;
        const bUpcoming = new Date(b.checkOut) >= today;

        if(aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

        return aUpcoming
            ? new Date(a.checkIn) - new Date(b.checkIn)
            : new Date(b.checkOut) - new Date(a.checkOut);
    });

    res.render("bookings/index.ejs", {
        pageTitle: "My trips",
        bookings,
    });
};

module.exports.show = async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate("listing");
    if(!booking || String(booking.guest) !== String(req.user._id)){
        req.flash("error", "We couldn't find that booking on your account.");
        return res.redirect("/bookings");
    }

    const canCancel = booking.status === "confirmed" && new Date(booking.checkIn) >= startOfTodayUTC();

    res.render("bookings/show.ejs", {
        pageTitle: "Booking details",
        booking,
        canCancel,
        formatDate,
    });
};

module.exports.cancel = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if(!booking || String(booking.guest) !== String(req.user._id)){
        req.flash("error", "We couldn't find that booking on your account.");
        return res.redirect("/bookings");
    }

    if(booking.status === "cancelled"){
        req.flash("error", "This booking is already cancelled.");
        return res.redirect(`/bookings/${booking._id}`);
    }

    if(booking.status !== "confirmed"){
        req.flash("error", "This booking cannot be cancelled.");
        return res.redirect(`/bookings/${booking._id}`);
    }

    if(new Date(booking.checkIn) < startOfTodayUTC()){
        req.flash("error", "You can't cancel a stay that has already started.");
        return res.redirect(`/bookings/${booking._id}`);
    }

    booking.status = "cancelled";
    booking.paymentStatus = "refunded";
    await booking.save();

    req.flash("success", "Booking cancelled and your demo payment was refunded.");
    res.redirect(`/bookings/${booking._id}`);
};
