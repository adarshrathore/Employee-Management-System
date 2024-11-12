const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  //passport automatically creates username and pw
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);