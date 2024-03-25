const walletdb=require ('../model/walletModel')
const Razorpay = require('razorpay'); 
const crypto=require('crypto')



var instance = new Razorpay({
  key_id: process.env.Razorpay_key_id,
  key_secret: process.env.Razorpay_key_secret
});

const walletController={
    loadWallet: async (req, res) => {
        try {
          // const userId='65ca2c92dd3a7e82dea485b2'
          const userId=req.session.userId
          const walletData=await walletdb.findOne({userId:userId})
          res.render("users/wallet",{walletData,userId});
        } catch (error) {
          console.log(error.message);
        } 
      }, 
      addToWallet:async (req, res) => {
        try {
          // const userId='65ca2c92dd3a7e82dea485b2'
          const userId=req.session.userId
          amount=Number(req.body.amount)
          const walletData=await walletdb.findOne({userId:userId})
          var randomNumber = Math.floor(Math.random() * Math.pow(10, 12));
          var id = randomNumber.toString().padStart(12, '0');

          let order= await generateRazorpay(id,amount)

          res.status(200).json({message:'success',order}) 
        } catch (error) {
          console.log(error.message);
        } 
      },
      verifyWalletPayment: async (req, res) => {
                  
        try {
          const userId=req.body.userId
          const id=req.body.order.receipt
          const payment=req.body.payment
          const order=req.body.order
          const amount=Number(req.body.order.amount)*0.01

          // const userId=req.session.userId;

         let hmac=crypto.createHmac('sha256','7npRH8K1zAV8b3jk7WBf9Dtb')
         hmac.update(payment.razorpay_order_id+'|'+payment.razorpay_payment_id)
         hmac=hmac.digest('hex')
         if(hmac==payment.razorpay_signature){
          const wallet=await walletdb.findOne({userId:userId})
          wallet.balance+=amount
          wallet.transactions.push({
            type:'Credit',
            amount:amount,
            transactionId:id, 
            transactionDate:new Date(),
            status:'Completed'
          })
          await wallet.save()
          res.status(200).json({wallet,amount}) 
         }else{
         res.status(500).json("error") 
         }

}catch (error) {
  console.log(error);
} 
      }
    }
function generateRazorpay(id,amount) {
  return new Promise((resolve, reject) => {
    var options = {
      amount: amount*100,  
      currency: "INR",
      receipt: id
    };

    instance.orders.create(options, function(err, order) {
      if (err) {
        console.error(err);
        reject(err); 
      } else {
        resolve(order);
      }
    });
  });
}
module.exports=walletController;