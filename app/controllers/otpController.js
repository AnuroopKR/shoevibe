const userotp = require('../model/userOtp');
const userdb = require("../model/userModel");
const nodeMailer=require('nodemailer');
const speakeasy=require ('speakeasy');
const walletdb=require('../model/walletModel')
// Function to send OTP via email
function sendOTPByEmail(email, otp) {
    console.log(email )
    const mailTransporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'shoevibein@gmail.com',
            pass: 'idgk eavc iafg mvfy',
        },
    });

    const mailDetails = { 
        from: 'shoevibein@gmail.com',
        to: email,
        subject: 'OTP',
        text:` Your OTP is: ${otp}`
    };

    // Return a promise to handle success and error in the calling route
    return mailTransporter.sendMail(mailDetails)
}



const otpController={
    sendOtp:async(email,res)=>{
        console.log(email)
       

    // Generate a secret key with a length of 20 characters
    const secret = speakeasy.generateSecret({ length: 20 });

    // Generate a TOTP code using the secret key
    const code = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
        digits:4
    });
    const otp=code

    // Log the secret key and TOTP code to the console (for demonstration purposes)
    console.log('Secret:', secret.base32);
    console.log('TOTP Code:', otp);


    
    const newUserotp = new userotp({
       email,
        otp   
    });

    await newUserotp.save();


    // Send the OTP to the entered email
    sendOTPByEmail(email, otp) 
        .then(() => {
            return console.log('Email sent successfully');
            // res.json({ success: true, message: 'Email sent successfully' });
            // res.render('otp')
        })
        .catch(error => { 
            console.error('Error sending email:', error);
            res.json({ success: false, message: 'Error sending email' });
        });

},

verifyOtp: async(req,res)=>{
    const {a,b,c,d}=req.body
   const entrOtp=a+b+c+d
    console.log(a+b+c+d);
email=req.session.email;
console.log(email);
//  const entrOtp=code
 console.log(`entered otp:${entrOtp}`)

const userOtp = await userotp.findOne({email})
console.log(`userotp:${userOtp}`);

if(!userOtp){
    console.log('tva')
    return res.render('/otp',{message:"Invalid Otp",email})
}
    if(entrOtp===userOtp.otp){
        const result=await userdb.updateOne({email:email},{$set:{is_varified:true}})
        
        const userData=await userdb.findOne({email:email})
        console.log('workes')
        req.session.isLogged = true;  
        req.session.userId=userData._id
        console.log("userId:",userData) 
      const wallet= new walletdb({
        userId:userData._id,
        balance:0
      })
      await wallet.save()
        // res.json({success:true,message:'OTP is valid'})
        res.redirect('/home')
    }
    else{
console.log('else worked');
const message="invalied otp"
res.render("users/otp",{log:"log",email,message});
}
   },
   resendOtp:async (req, res) => {
    try {
        email=req.session.email
        const result = await userotp.deleteOne({ email:email });
        otpController.sendOtp(email);
        res.render("users/otp",{log:"log",email,message:""});
    } catch (error) { 
      console.log(error.message);  
    } 
  },
  verifyOtpset: async (req, res) => {
    try {
       const email=req.query.email
       console.log(email)
       const otp=req.query.otp
       const userOtp = await userotp.findOne({email})
       if(otp===userOtp.otp){
        const result=await userdb.updateOne({email:email},{$set:{is_varified:true}})
        const userData=await userdb.findOne({email:email})
        console.log('workes')
        
        req.session.userId=userData._id
        console.log("userId:",userData) 
      
        // res.json({success:true,message:'OTP is valid'})
       return res.redirect('/loadPasswordform')
    }
    else{
console.log('else worked');
        res.redirect('/otp',{message:"invalied otp"})
    }
      res.render("users/setPassword",{userId:req.session.userId});
    } catch (error) {
      console.log(error.message); 
    }
  } ,
  generateOtp:async(email,res)=>{
    console.log(email)
   

// Generate a secret key with a length of 20 characters
const secret = speakeasy.generateSecret({ length: 20 });

// Generate a TOTP code using the secret key
const code = speakeasy.totp({
    secret: secret.base32,
    encoding: 'base32',
    digits:4
});
const otp=code

// Log the secret key and TOTP code to the console (for demonstration purposes)
console.log('Secret:', secret.base32);
console.log('TOTP Code:', otp);



const newUserotp = new userotp({
   email,
    otp   
});

await newUserotp.save();


// Send the OTP to the entered email
sendEmail(email, otp) 
    .then(() => {
        return console.log('Email sent successfully');
        // res.json({ success: true, message: 'Email sent successfully' });
        // res.render('otp')
    })
    .catch(error => { 
        console.error('Error sending email:', error);
        res.json({ success: false, message: 'Error sending email' });
    });

},
           
} 


function sendEmail(email, otp) {
    console.log(email )
    const mailTransporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'shoevibein@gmail.com',
            pass: 'idgk eavc iafg mvfy',
        },
    }); 

    // Construct the URL for the link (replace 'yourwebsite.com' with your actual website domain)
    const resetPasswordLink = `https//shoevibz-mohy1uu0.b4a.run/loadPassword?email=${email}&otp=${otp}`;

    const mailDetails = { 
        from: 'shoevibein@gmail.com',
        to: email,
        subject: 'OTP',
        // Include the OTP and the reset password link in the email body
        html: `<p>Click <a href="${resetPasswordLink}">here</a> to reset your password.</p>`
    };

    // Return a promise to handle success and error in the calling route
    return mailTransporter.sendMail(mailDetails)
}



module.exports=otpController