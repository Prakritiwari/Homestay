const app = require("../app");

module.exports = async (req, res) => {
    try {
        await app.connectDB();
        return app(req, res);
    } catch (err) {
        console.error("Application Error:", err);

        return res.status(500).send("Internal Server Error");
    }
};