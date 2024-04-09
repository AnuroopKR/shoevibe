const mongoose=require("mongoose");
// const dotenv=require('dotenv')
mongoose.connect("mongodb://localhost:27017/shoevibe",{serverSelectionTimeoutMS:5000});
const express=require("express");
const app=express();
const path=require("path");
const session=require('express-session'); 
const morgan=require('morgan')
const cookieParser = require('cookie-parser');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//for user
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/app/views'));
app.use(express.static(path.join(__dirname,'/public')));

app.use(express.urlencoded({extended:false}));
app.use(cookieParser());

// app.use(morgan('tiny'))  
// session
app.use(session({ 
    secret:"secret",
    resave: false,
    saveUninitialized: false ,
    
})) 
app.use(flash());



app.use(function (err,req, res, next) {
    res.status(500);
    res.render("errorpage/404");
  });  

const userRoute=require('./app/route/userRoute');
app.use('/',userRoute);
const adminRoute=require('./app/route/adminRoute');
app.use('/admin',adminRoute);

app.listen(4000,()=>{
    console.log("server is running..4000")
})