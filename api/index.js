const mongoose = require("mongoose");
const app = require("../app");

module.exports = async (req, res) => {
    try {
        console.log(`[api] ${req.method} ${req.url}`);

        await app.connectDB();

        if (mongoose.connection.readyState !== 1) {
            throw new Error(`MongoDB is not connected (readyState: ${mongoose.connection.readyState})`);
        }

        console.log(`[api] serving with MongoDB database: ${mongoose.connection.name}`);

        return app(req, res);
    } catch (err) {
        console.error("Application Error:", err);

        return res.status(503).send("Database temporarily unavailable. Please try again.");
    }
};
