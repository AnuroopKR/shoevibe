const userdb = require("../model/userModel");
const productdb = require("../model/productModel");
const categorydb = require("../model/categoryModel");
const orderdb = require("../model/orderModel");
const coupondb = require("../model/couponModel");
const bcrypt = require("bcrypt");
const userOtp = require("../model/userOtp");
const nodeMailer = require("nodemailer");
const speakeasy = require("speakeasy");
const otpController = require("./otpController");
const multer=require('multer')
const storage = multer.memoryStorage()
const path=require('path');
const sharp = require("sharp");
const { constants } = require("fs");
  
// const uploadDir = path.join(__dirname, "../../public/uploads");
const uploads = multer({ storage: storage }).array("image", 5);
const upload = multer({ storage: storage }).single('productImage');
const adminControllers = {
  adminHome: async (req, res) => {
      try {
        const orderData = await orderdb.find();
        const price = orderData.reduce((crr, acc) => crr + acc.totalPrice, 0);
        res.render("admin/adminhome",{orderData,price});
      } catch (error) {
        console.log(error.message);
      }
    },
    adminLogin: async (req, res) => {
      try {
        res.render("admin/adminLogin");
      } catch (error) {
        console.log(error.message);
      }
    },
    adminLoginhome: async (req, res) => {
      try {
        const { email, password } = req.body;
        console.log(req.body)
       
        const userExists = await userdb.findOne({ email }); 
        
        if (!userExists) {
          // req.flash("message","This user doesnt exist");
          return res.status(500).json( { message: "This user doesnt exist" });
        }
        else if(await bcrypt.compare(password, userExists.password)&&userExists.isAdmin===true) {
          
          const userId = userExists._id;
          req.session.isadminLogged = userExists.name
          // req.session.userName = userExists.name;
          res.status(200).json({success:true})        }
        else{
          console.log("wrong password");
          return res.status(500).json( {success:false, message: "This user doesnt exist" }); 
        }
      } catch (err) {
        console.log(err);
      }
    },
    userManage: async (req, res) => {
      try {
        const userData=await userdb.find();
        
        res.render("admin/userManage",{userData});
      } catch (error) {
        console.log(error.message);
      }
    },
    // Other functions...
  
    // post for admin page home
    adminLogout: async (req, res) => {
      try {
        req.session.isadminLogged=null
        res.render("admin/adminLogin");
      } catch (error) {
        console.log(9999,error);
        res.status(500).send(error);
      }
    },
    
   
      salesReport: async (req, res) => {
      try {

        const orderData=await orderdb.find().populate('products.productId').populate('userId')
        res.render("admin/salesReport",{orderData});
      } catch (error) {
        console.log(error.message);
      }
    },
    salesReportLoad: async (req, res) => {
      try {
        const startDate = new Date(req.body.startDate);
const endDate = new Date(req.body.endDate);

// Check if the parsed dates are valid
if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    // Handle invalid date format
    console.error("Invalid date format"); 
} else {
    // Dates are valid, proceed with the query
    const orderData = await orderdb.find({
      orderStatus: "Delivered",
        createdAt: {
            $gte: startDate, 
            $lte: endDate 
        }
    }).populate('products.productId').populate('userId');


        res.status(200).json({orderData})
      }
     } catch (error) {
        console.log(error.message);
      }
    }
  }; 
    
 

  function generateCouponCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let couponCode = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      couponCode += characters[randomIndex];
    }
  
    return couponCode;
  }
  
    
  



  module.exports = adminControllers;


