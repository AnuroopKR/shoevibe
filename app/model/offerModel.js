const mongoose = require('mongoose');


const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  discount: {
    type: Number,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
   startingDate: {
    type: Date,
    required: true
  },
  
},
{
    timestamps: true
  }
  );



module.exports = mongoose.model('Offer', offerSchema);

