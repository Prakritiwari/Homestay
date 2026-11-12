const Joi = require("joi");

 module.exports.listingSchema = Joi.object({
    listing : Joi.object({
        title : Joi.string().required(),
        description : Joi.string().required(),
        location : Joi.string().required(),
        country : Joi.string().required(),
        price : Joi.number().required().min(0),
        category: Joi.string().required(),
    }).required()
 });

module.exports.reviewSchema = Joi.object({
    reviews : Joi.object({
        rating : Joi.number().required().min(1).max(5),
        comment : Joi.string().required(),
    }).required()
});

module.exports.bookingSchema = Joi.object({
    booking : Joi.object({
        checkIn : Joi.date().required(),
        checkOut : Joi.date().greater(Joi.ref("checkIn")).required(),
        guests : Joi.number().integer().min(1).max(20).required(),
        paymentMethod : Joi.string().valid("card", "upi", "netbanking").required(),
        cardName : Joi.string().allow("", null),
        cardNumber : Joi.string().allow("", null),
        cardExpiry : Joi.string().allow("", null),
        cardCvv : Joi.string().allow("", null),
        upiId : Joi.string().allow("", null),
        bankName : Joi.string().allow("", null),
    }).required()
});
