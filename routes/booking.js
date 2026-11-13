const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware/index.js");
const bookingController = require("../controllers/bookings.js");

router.get("/", isLoggedIn, wrapAsync(bookingController.index));
router.get("/:id", isLoggedIn, wrapAsync(bookingController.show));
router.post("/:id/cancel", isLoggedIn, wrapAsync(bookingController.cancel));

module.exports = router;
