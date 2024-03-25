const mongoose=require('mongoose');

const userOtpSchema = new mongoose.Schema({


    email:String,
    otpSecret:String,
    otp:String,
    expiry:Date,
    expireAt: { type: Date, default: Date.now, expires: 60 } 
//   email:{
//     type:String,
//     required:true
//   },
//   otp: {
//     type: Number,
//     required: true
//   },
//   expiration_time: {
//     type: Date,
//     // required: true
//   },
//   is_used: {
//     type: Boolean,
//     default: false
//   },
//   created_at: {
//     type: Date,
//     default: Date.now
//   }
});

const OTP = mongoose.model('userOtp', userOtpSchema);

module.exports = OTP;
