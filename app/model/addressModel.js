const mongoose = require('mongoose');

// Define the Address schema
const addressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  address: { type: String, required: true },
  landMark: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pin: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',required:true },
  status:{type:Boolean,
    default:true

  }
});

// Create the Address model
module.exports = mongoose.model('Address', addressSchema);

// Export the Address model for use in other modules

