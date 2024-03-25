const coupondb = require('../model/couponModel')
const mongoose = require('mongoose');

const couponController={
couponList: async (req, res) => {
    try {

      const couponData=await coupondb.find()
      res.render("admin/coupon",{couponData});
    } catch (error) {
      console.log(error.message);
    } 
  },
  createCoupon: async (req, res) => {
    try {
      const couponCode = generateCouponCode(12);
      const coupon=new coupondb({
        name:req.body.couponName,
        description:req.body.description,
        expiry:req.body.expiry,
        discount:req.body.discount,
        minimumRate:req.body.minimumRate,
        couponCode:couponCode 
      })
      await coupon.save();
      
      res.status(200).json("coupen data")
    } catch (error) {
      console.log(error.message);
    }
  },
  deleteCoupon: async (req, res) => {
    try {
      const couponId=req.body.couponId
      const couponData=await coupondb.deleteOne({_id:couponId})
      res.status(200).json("success");
    } catch (error) {
      console.log(error.message);
    } 
  },
  checkCoupen:  async (req, res) => {
    try {
      const couponId=req.query.couponId
    // const id=req.query.couponId
    // const couponId = new ObjectId(id);

      const couponData=await coupondb.findOne({_id:couponId})
      res.status(200).json({couponData});
    } catch (error) {
      console.log(error);
    } 
  }

}
  function generateCouponCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let couponCode = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      couponCode += characters[randomIndex];
    }
  
    return couponCode;
  }
  module.exports = couponController;

