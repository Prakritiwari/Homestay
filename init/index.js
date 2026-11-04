const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const initData = require("./data.js");

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/homestay");
}

main()
.then( () => {
    console.log("connection successfull with database");
}).catch((err) => {
    console.log(err);
});


const initDb = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner :'6829e67a4dd83ef989323fbb'}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
}

initDb();

