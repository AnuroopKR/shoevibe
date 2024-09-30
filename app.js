const mongoose=require("mongoose");
require('dotenv').config();
mongoose.connect("mongodb+srv://shoevibz:NasvHduPbRMffhD6@shoevibz.6q2ferj.mongodb.net/Shoevibz")
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
const uuid = require('uuid'); 

console.log(process.env.mongodb_url);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//for user
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/app/views'));
app.use(express.static(path.join(__dirname,'/public')));

app.use(express.urlencoded({extended:false}));
app.use(cookieParser());

app.use(morgan('tiny'))  
// session 
app.use(session({
    genid: () => {
      return uuid.v4(); 
    },
    secret: 'your_secret_key', 
    resave: false,
    saveUninitialized: false
}))

app.use(flash());

app.use((req,res,next)=>{
    res.set('Cache-control','no-store,no-cache')
    next()
})

 


  app.use((err, req, res, next)=> {
    res.status(404);

    res.render("errorpage/404");
});


const userRoute=require('./app/route/userRoute');
app.use('/',userRoute);
const adminRoute=require('./app/route/adminRoute');
app.use('/admin',adminRoute);

app.use('*',(req,res)=>{
  res.render("errorpage/404");

})

app.listen(3000,()=>{
    console.log("server is running..3000")
})