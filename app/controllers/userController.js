const userdb = require("../model/userModel");
const productdb = require("../model/productModel");
const categorydb=require("../model/categoryModel");
const cartdb = require("../model/cartModel");
const addressdb = require("../model/addressModel");
const orderdb = require("../model/orderModel");
const wishlistdb=require("../model/wishListModel");
const bcrypt = require("bcrypt");
const userOtp = require("../model/userOtp");
const nodeMailer = require("nodemailer");
const speakeasy = require("speakeasy");
const otpController = require("./otpController");
const jwt = require('jsonwebtoken');
const orderid = require('order-id')('key'); 

const userControllers = {

  loadLogin: async (req, res) => {
    try {
      if(req.session.isLogged){
        res.redirect("/home"); 
    }
    else{
      const log="Login"
  // res.render("users/login", {message:req.flash('message'),log});
  res.render("users/login",{userId: req.session.userId,message:req.flash('message')});
  }
      
    } catch (error) {
      console.log(error);
    }
  },
  // user signup page
  loadRegister: async (req, res) => {
    try {
      const log="Login"
      
      return res.render("users/registration", {message:req.flash('message'),userId: req.session.userId}); 
    } catch (error) {
      console.log(error.message); 
    } 
  },
  userSignup: async (req, res) => {
    if (!req.body) {
      req.flash('message', 'No data ');
      return res.redirect('/signup');  
    }
    const { name, email, mobile, password } = req.body;
    // emailvalidation
    if(isValidEmail(email)){
      if(isValidName(name)){
        if(isValidMobileNumber(mobile)){
          if(passwordToCheck(password)){
                // check is email already exist
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(password)

    const isEmail = await userdb.findOne({ email });
    

    if(isEmail){
    if (isEmail.is_varified==true) {
      console.log("isEmail,",isEmail)
      req.flash('message', 'Email already exists ');
      return res.redirect("/signup");
    } else {
      if(isEmail.is_varified==false){
        await userdb.deleteOne({ email:email});
        
      }
    }
  }
      // Create a new user
      req.session.email = email;
      const user = new userdb({
        name,
        email,
        mobile,
        password: hashedPassword,
        isAdmin:true 
      });
      console.log(user);
      await user.save();
    //   setTimeout(async () => {
    //     const userData=userdb.findOne({email:email}) 
        
    //       if (userData && !userData.is_varified){
    //         console.log('kayari')
    //         await userdb.deleteOne({ email:email});
    //       }
    // }, 180000);

      otpController.sendOtp(email); 

      // res.render(`otp?email=${email}`,otpController.sendOtp)
      res.render("users/otp",{log:"log",email,message:" "});
    

  
    
          }else{
            req.flash('message', 'Invalid password.');
            return res.redirect("/signup"); 
          }
    
        }else{
          req.flash('message', 'Invalid phonr number.');
          return res.redirect("/signup");
        }
    
      }else{
        req.flash('message', 'Invalid email address.');
        return res.redirect("/signup");
      }
  }else{
    req.flash('message', 'Invalid name.');
    return res.redirect("/signup");  
  }
  },
  userLogin: async (req, res) => {
    try {
      const { email, password } = req.body;
      const userExists = await userdb.findOne({ email });
      
      console.log(userExists,email);
      if (!userExists) {
        console.log("user not exist")
        // req.flash("message","This user doesnt exist");
        return res.render("users/login", { message: "This user doesnt exist",userId: req.session.userId});
      } 
      if(userExists.isBlocked){
        req.flash('message', 'You are blocked.');
        res.redirect('/login')
      }
      else if(await bcrypt.compare(password, userExists.password)) {
        console.log(password);

        
        const userId = userExists._id;
        req.session.isLogged = true;
        req.session.userName = userExists.name;
        req.session.userId=userId
        res.redirect("/home");
      }
      else{
        console.log("incorrect password")
        return res.render("users/login", { message: "incorrect password" ,userId: req.session.userId});
      }
    } catch (err) {
      console.log(err);
    }
  },
  // render home
  userHome: async (req, res) => {
    try {
      // const userId="65ca2c92dd3a7e82dea485b2"
      const userId=req.session.userId
     // if(req.session.isLogged){
       const productData=await productdb.find().populate('offerId').populate({
        path: 'category',
        populate: {
            path: 'offerId',
            model: 'Offer'  
        }
    })
const wishlist=await wishlistdb.findOne({userId:userId})
// console.log(9999,wishlist);
        res.render("users/home",{userId,productData,wishlist});
    // }
    // else{
    //   res.render("users/home",{log:"Login"});
    // }
      
    } catch (error) {
      console.log(error.message); 
    }
  },
  otp: async (req, res) => {
    try {
      res.render("users/otp",{log:"log"});
    } catch (error) {
      console.log(error.message);
    }
  },
  forgotPassword: async (req, res) => {
    try {
      res.render("users/forgotEmail",{userId:req.session.userId});
    } catch (error) {
      console.log(error.message); 
    }
  } ,
  loadPasswordform: async (req, res) => {
    try {
      res.render("users/setPassword",{userId:req.session.userId});
    } catch (error) {
      console.log(error.message); 
    }
  } ,
  setPassword: async (req, res) => {
    try {
      const userId=req.session.userId
      const newPassword=req.body.password;
      console.log("userId",userId,newPassword);
      const userExists = await userdb.findOne({_id:userId});
       const hashedPassword = await bcrypt.hash(newPassword, 10);
      if(!userExists){
        console.log("no user")
      }
      // if(await bcrypt.compare(newPassword, userExists.password)) 
      else{
        const result=await userdb.updateOne({_id:userId},{$set:{password:hashedPassword}})
        console.log("result : ",result)
        req.session.isLogged = true;
        res.status(200).json({ message: 'success'})
    } 
  }
  catch (error) {
      console.log(error.message); 
    }
  } ,
  submitEmail: async (req, res) => {
    try {
     const email= req.body.email
     console.log(email)
     const userData=await userdb.findOne({email:email})
     if(!userData){
      res.status(404).json({ message:"User not found" });
    }
    else{
      otpController.generateOtp(email)
      res.status(200).json({ message: 'Password reset instructions sent to your email.'})
    }
     
    } catch (error) {
      console.log(error.message); 
    }
  } ,
  logout:async (req, res) => {
    try {
      if(req.session.isLogged){
       req.session.isLogged = false;
       req.session.destroy()
      
     
        res.redirect("/home")
      }
    } catch (error) {
      console.log(error.message);
    }
  },
 
  userProfile: async (req, res) => {
    try {
      if(req.session.isLogged){
        // const userId='65ba4ea3633a04cbabab2dae';
        const userId=req.session.userId;
        const userData=await userdb.findOne({_id:userId})
        const addressData=await addressdb.find({userId:userId})
        res.render('users/userProfile',{userData,addressData,userId})
    }
    else{
      const log="Login"
  res.render("users/login", { message: "" ,log});
    }
      
    } catch (error) { 
      console.log(error.message);  
    } 
  },
  changePassword: async (req, res) => {
    try {
      const{currentPassword,repeatNewPassword,newPassword}=req.body;
      console.log(req.body);
      if(repeatNewPassword===newPassword||!req.body){
      // const userId='65ba4ea3633a04cbabab2dae';
      const userId=req.session.userId;
      const userExists = await userdb.findOne({_id:userId});
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      if(await bcrypt.compare(currentPassword, userExists.password)) {
        const result=await userdb.updateOne({_id:userId},{$set:{password:hashedPassword}})
        res.redirect("/userProfile");
      }
      else{
        const data = { message: 'incorrect password' };

  res.json(data);
        res.redirect("/userProfile");
      }
      }else{
        const data = { message: 'incorrect password' };

  res.json(data);
        res.redirect("/userProfile");
      }
    } catch (error) {
      console.log(error.message);
    }
  },
  profileUpdate:async (req, res) => {
    try {
      // const userId='65ba4ea3633a04cbabab2dae';
      const userId=req.session.userId;
      const userExists = await userdb.findOne({_id:userId});

      const userData={
        name:req.body.name,
        email:req.body.email,
        mobile:req.body.mobile
      
      }
      console.log(5555,userData)
      const result=await userdb.updateOne({_id:userId},{$set:userData})
      console.log(result);
      res.redirect("/userProfile"); 
    } catch (error) {
      console.log("error",error.message); 
    }
  },
 
  
  addAddress: async (req, res) => {
    try {
        // Log the entire form data
       const formData=req.body  
        console.log("Form Data:", req.body); 
        const userId=req.session.userId;
        // Access specific fields from the form data
        const { firstName, lastName, address, landmark, city, state, pin } = req.body;
        console.log("First Name:", firstName);
        console.log("Last Name:", lastName);
        const addres = new addressdb({
          firstName,
          lastName, 
          address,
          landmark,
          city,
          state,
          pin,
          userId:userId
        });
         
        await addres.save();
  
        // Send a JSON response back to the client
        const responseData = {
          message: 'Form submitted successfully!',
          formData: formData,
      };

      // Send a JSON response back to the client
      res.json(responseData);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  address: async (req, res) => {
  try {
    const userId=req.session.userId;
    const addressData=await addressdb.find({userId:userId})
    console.log(addressData)
    res.status(200).json({addressData})
  } catch (error){
    console.log(error.message);
  }
  }, 
  setDefault : async (req, res) => {
    try {
      const addressId=req.params.id
      const userId=req.session.userId;
      const addressData=await addressdb.updateMany({userId:userId,status:true},{$set:{status:false}})
      const result = await addressdb.updateOne({_id:addressId},{$set:{status:true}})
      // res.status(200).json('success')
      res.redirect('/userProfile')
       } catch (error){
      console.log(error);
    }
    },
  deleteAddress:  async (req, res) => {
      try {
        const addressId=req.params.id
        const userId=req.session.userId;
        const result = await addressdb.deleteOne({_id:addressId})
        res.redirect('/userProfile')
         } catch (error){
        console.log(error.message);
      }
      },
  updateAddress:  async (req, res) => {
        try {
          const addressId=req.params.id
          const userId=req.session.userId;
          const address=await addressdb.findOne({userId:userId,_id:addressId})
          console.log(1111,address,addressId);

          
            address.firstName=req.body.firstname;
            address.lastName=req.body.lastname;
            address.address=req.body.addres;
            address.landmark=req.body.landMark;
            address.city=req.body.inputcity;
            address.state=req.body.inputstate;
            address.pin=req.body.pincode;
        
           
          await address.save();
          // const result = await addressdb.deleteOne({_id:addressId})
          res.redirect('/userProfile')
           } catch (error){
          console.log(error.message);
        }
        },


};  


function isValidEmail(email) {
  // Regular expression for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidName(name) {
  // Regular expression for name validation allowing only letters and spaces
  const nameRegex = /^[A-Za-z\s]+$/;
  return nameRegex.test(name);
}
function isValidMobileNumber(mobileNumber) {
  // Regular expression for a 10-digit mobile number
  const mobileNumberRegex = /^[0-9]{10}$/;
  return mobileNumberRegex.test(mobileNumber);
}
function passwordToCheck(password) {
  // Regular expression for a strong password
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{8,}$/;

  return passwordRegex.test(password);
}


module.exports = userControllers;
