const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const listingSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: /.+\@.+\..+/,
  },
  mobilenumber: {
    type: Number,
    required: true,
  },
  designation: {
    type: String,
    enum: ["Manager", "Team Lead", "HR", "Designer", "Developer", "Sales"],
    required: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },
  course: {
    type: [String],
    enum: ["B.Tech", "BCA", "MCA", "BSc"],
    required: true,
  },
  image: {
    type: String,
    // required: true,
  },
  createdate: {
    type: String,
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;