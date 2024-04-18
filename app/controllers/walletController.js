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
          const userId=req.session.userId
          console.log(userId);
          const walletData=await walletdb.findOne({userId:userId})
          console.log(walletData);
          res.render("users/wallet",{walletData,userId});
        } catch (error) {
          console.log(error.message);
          res.status(500)
        } 
      }, 
      addToWallet:async (req, res) => {
        try {
          const userId=req.session.userId
          amount=Number(req.body.amount)
          const walletData=await walletdb.findOne({userId:userId})
          var randomNumber = Math.floor(Math.random() * Math.pow(10, 12));
          var id = randomNumber.toString().padStart(12, '0');

          let order= await generateRazorpay(id,amount)

          res.status(200).json({message:'success',order}) 
        } catch (error) {
          console.log(error.message);
          res.status(500)
        } 
      },
      verifyWalletPayment: async (req, res) => {
                  
        try {
          const id=req.body.order.receipt
          const payment=req.body.payment
          const order=req.body.order
          const amount=Number(req.body.order.amount)*0.01
          const userId=req.session.userId;

         let hmac=crypto.createHmac('sha256','7npRH8K1zAV8b3jk7WBf9Dtb')
         hmac.update(payment.razorpay_order_id+'|'+payment.razorpay_payment_id)
         hmac=hmac.digest('hex')
         if(hmac==payment.razorpay_signature){
          const wallet=await walletdb.findOne({userId:userId})
          if(!wallet){
            const wallet= new walletdb({
              userId:userId,
              balance:0
            })
            await wallet.save()
          }
          const walletData=await walletdb.findOne({userId:userId})

          walletData.balance+=amount
          walletData.transactions.push({
            type:'Credit',
            amount:amount,
            transactionId:id, 
            transactionDate:new Date(),
            status:'Completed'
          })
          await walletData.save()
          res.status(200).json({wallet,amount}) 
         }else{
         res.status(500).json("error") 
         }

}catch (error) {
  console.log(error);
  res.status(500)
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