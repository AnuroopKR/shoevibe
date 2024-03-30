const userdb = require("../model/userModel");
const productdb = require("../model/productModel");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


const middleWare={
authenticateToken:(req, res, next)=>{
    const token =req.cookies.secretCode
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Token missing' });
    }
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Forbidden - Invalid token' });
      }
  
      req.user = user;
      next();
    });
  },
  isLoged:async (req, res,next) => {
    try {
        if(req.session.isLogged){
          const isBlocked=await userdb.findOne({_id:req.session.userId},{isBlocked:1});
          if(!isBlocked.isBlocked){
             next()
          }else{
            req.session.destroy()
            res.redirect('/login');   
          }
          // next()
        }
        else{
      res.redirect('/login');
        }
    } catch (error) {
      console.log(error.message); 
    }
  },
  isLogedforFetch:async (req, res,next) => {
    try {
        if(req.session.isLogged){
          const isBlocked=await userdb.findOne({_id:req.session.userId},{isBlocked:1});
          if(!isBlocked.isBlocked){
             next()
          }else{
            req.session.destroy()
            res.status(200).json({error:true})  
          }
          // next()
        }
        else{
          res.status(200).json({error:true})    
        }
    } catch (error) {
      console.log(error.message); 
    }
  },
  isadminLogged:async (req, res,next) => {
    try {
        if(req.session.isadminLogged){
            next()
        }
        else{
      res.render("admin/adminLogin", { message: "" });  
        }
    } catch (error) {
      console.log(error.message);
    }
  },
  userBlock: async (req, res,next) => {
    try {
      const userId=req.params.userId;
      await userdb.updateOne(
        { _id:userId},
        { $set: { isBlocked: false } } 
      );
      next()
    } catch (error) {
      console.log(error.message);
    } 
  },
  userunBlock: async (req, res,next) => {
    try {
      const userId=req.params.userId; 
      await userdb.updateOne(
        { _id:userId},
        { $set: { isBlocked: true } } 
      );
      
      
      next()
    } catch (error) { 
      console.log(error.message);
    }
  },
  isLogedin:async (req, res,next) => {
    try {
        if(req.session.isLogged){
          res.redirect('/home');     
          }else{
             next()
        }
        
    } catch (error) {
      console.log(error.message); 
    }
  }
}
// create JWT tocken
        // console.log(user)
        // const token = jwt.sign({ userid }, secretKey, { expiresIn: '1h' });
        // res.json({ token });
        // res.cookie(accessToken,token);

module.exports = middleWare;