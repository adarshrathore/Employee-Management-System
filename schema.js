const Joi = require('joi');

module.exports.listingSchema = Joi.object({
  listing : Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    mobilenumber: Joi.string()
      .length(10)  // Ensure the length is exactly 10 digits
      .pattern(/^[0-9]+$/)  // Ensure only digits are allowed
      .required(),
    designation: Joi.string().required(),
    gender: Joi.string().valid('Male', 'Female').required(),
    course: Joi.array().items(Joi.string()).required(),
  }).required(),
});