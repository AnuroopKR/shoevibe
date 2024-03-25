const mongoose = require("mongoose");

var orderSchema = new mongoose.Schema(
  {
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
        },
        quantity: Number,
        price: Number,
        offer: {
          type: String,
          default: false,
        }
      },
    ],
   orderId : {
      type: String
    },
    totalPrice:{
      type:Number
  },
    paymentIntent: {},
    requestReson: {
      type: String,
      default: "Not Request" 
    },
    orderStatus: {
      type: String,
      default: "Not Processed",
      enum: [
        "Not Processed",
        "Placed",
        "Processing",
        "Dispatched",
        "Cancelled",
        "Delivered",
        "Returned",
        "Return request"
      ],
    },
    address: {
      type: Object
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },

 
    expectedDelivery: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
        