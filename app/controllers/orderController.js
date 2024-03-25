const userdb = require("../model/userModel");
const addressdb = require("../model/addressModel");
const orderdb = require("../model/orderModel");
const cartdb = require("../model/cartModel");
const productdb=require("../model/productModel");
const orderid = require('order-id')('key'); 
const walletdb=require('../model/walletModel');
const coupondb=require('../model/couponModel');
const Razorpay = require('razorpay'); 
const mongoose = require('mongoose');
const crypto=require('crypto')

var instance = new Razorpay({
  key_id: process.env.Razorpay_key_id,
  key_secret: process.env.Razorpay_key_secret
});

const orderController={ 

    loadCheckout: async (req, res) => { 
        try {
          // const userId="65ca2c92dd3a7e82dea485b2"
          const userId=req.session.userId;
          const id = new mongoose.Types.ObjectId(userId); 

          const addressData=await addressdb.find({userId:userId}) 
          const cartData=await cartdb.findOne({ userId: userId }).populate('products.productId')
          const wallet=await walletdb.findOne({userId:userId})
          const coupon=await coupondb.find({usersUsed:{$nin:id}})
          // console.log(coupon)

        //  console.log(wallet) 
         if (!cartData.products || cartData.products.length === 0) {
          res.redirect('/cart');
      } 
          else{
          res.render("users/checkout",{userId,addressData,cartData,wallet,coupon});  
          } 
        } catch (error) {
          console.log(error);  
        }
        }, 
        conformCheckout: async (req, res) => {
        try {
          // const userId = "65ca2c92dd3a7e82dea485b2"
          const userId=req.session.userId;
         const addressId=req.body.selectedAddressId
         const couponId=req.body.couponId
          // console.log(req.body);
          const coupon= await coupondb.findOne({_id:couponId}) 
          const cart = await cartdb.findOne({userId:userId});
          if (!cart) {
              throw new Error('Cart not found');
          } if(!addressId){
          var address=await addressdb.findOne({userId:userId,status:true})
          }else{
            var address=await addressdb.findOne({userId:userId,_id:req.body.selectedAddressId});
          }

          const productData=await cartdb.findOne({userId:userId})
          const paymentMethod=req.body.paymentMethod
          // cash on delivery
          if(paymentMethod==='cash_on_delivery'){
            const method="cash on delivery"
            let id=await saveOrder(productData,method,userId,cart,couponId)
            res.status(200).json({ message:'hiii',data:id,status:false});

            
            // wallet payment
          }else if(paymentMethod==="wallet-payment"){
            const wallet=await walletdb.findOne({userId:userId})
            if(wallet&&wallet.balance>(productData.totalPrice+50)){
              const method="wallet payment"
              var randomNumber = Math.floor(Math.random() * Math.pow(10, 12));
              var walletId = randomNumber.toString().padStart(12, '0');
              let id=await saveOrder(productData,method,userId,cart,couponId)
              wallet.balance= wallet.balance-(productData.totalPrice+50)
              wallet.transactions.push({
                type:'Debit',
                amount:productData.totalPrice+50,
                transactionId:walletId, 
                transactionDate:new Date(),
                status:'Completed'
              })
              await wallet.save()
              res.status(200).json({ message:'hiii',data:id,status:false});

            }

            // razorpay 
          }else{
            const method="Online payment"
            let id=await saveOrder(productData,method,userId,cart,couponId)
            let order= await generateRazorpay(id)
            res.status(200).json({ message:'hiii',data:id,status:true,order});

          } 
           
       
        function generateRazorpay(id) {
          return new Promise((resolve, reject) => {
            var options = {
              amount: id.price*100,  
              currency: "INR",
              receipt: id.id 
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
             
        
      
          
          }
         catch (error) {
          console.log(error);
        } 

       async function saveOrder(productData,method,userId,cart,couponId){
          const id = orderid.generate()
          let totalPrice
          if(!couponId){
            totalPrice=productData.totalPrice+50
          }else{ 
            const coupon= await coupondb.findOne({_id:couponId}) 
            totalPrice=productData.totalPrice+50-coupon.discount
            coupon.usersUsed.push(userId)
            await coupon.save()
          }
            const order = new orderdb({
              products:productData.products,
              orderId:id,
              paymentIntent:{
                type:method
              }, 
              totalPrice:totalPrice,
              address:address,
              userId: userId
              });
              await order.save();
              const cartItems=cart.products;
            await Promise.all(
              cartItems.map(async (cartItem) => {
                const product = await productdb.findById(cartItem.productId).exec();
                if (product) {
                  product.quantity -= cartItem.quantity;
                  await product.save();
                }
              })
            );
            cart.products = []; 
          await cart.save();
          console.log('All products deleted successfully',id);
          data={
            id:id,
            price:totalPrice
          } 
          return data
        }


        }, 
        checkoutAddress: async (req, res) => {
        try {
           const formData=req.body  
            const userId=req.session.userId;
            const { firstName, lastName, address, landmark, city, state, pin } = req.body;
            
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
      
          res.json(responseData);
      
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
        },
        orderPlaced: async (req, res) => {
        try {
            const orderId=req.params.orderId
          const userId=req.session.userId
          const orderData=await orderdb.findOne({orderId:orderId}).populate('products.productId')
        //  const orderData=await orderdb.findOne({orderId:orderId})
          res.render("users/placedOrder",{userId:req.session.userId,orderData});
        } catch (error) {
          console.log(error.message);
        }
        }, 
        orderListUser: async (req, res) => {
          try {
            const userId=req.session.userId
            const orderData=await orderdb.find({userId:userId})
            if(orderData){
              res.render("users/orderList",{orderData,userId:userId});
            }
            else{
              res.status(500).send("Orderlist is empty.");
            }
            
          } catch (error) {
            console.log(error.message);
          }
          }, 
          userOrderDetails: async (req, res) => {
            try {
                const orderId=req.params.orderId
              const userId=req.session.userId
              const orderData=await orderdb.findOne({orderId:orderId}).populate('products.productId')
              res.render("users/orderDetails",{userId,orderData});
            } catch (error) {
              console.log(error.message); 
            }
            },
            cancelOrder: async (req, res) => {
                try {
                    const orderId=req.params.orderId
                  const userId=req.session.userId
                  const productData=await cartdb.findOne({userId:userId})

                 console.log(orderId)
                const updatedOrder=await orderdb.findOneAndUpdate(
                    { orderId: orderId },
                    { $set: { orderStatus: "Cancelled" } },
                    { new: true } 
                  )
                     
                      if (updatedOrder) {
                        console.log("Order status updated successfully:");
                        
                      const order=await orderdb.findOne({orderId:orderId})
                      console.log(order.paymentIntent,order)
                      if(order.paymentIntent.type=="Online payment"||order.paymentIntent.type=="wallet-payment"){
                        if(order.status!="Not Processed"){
                        const wallet=await walletdb.findOne({userId:userId})
                        console.log(wallet)
                        var randomNumber = Math.floor(Math.random() * Math.pow(10, 12));
                        var walletId = randomNumber.toString().padStart(12, '0');
                        wallet.balance= wallet.balance+(order.totalPrice)
                        wallet.transactions.push({
                          type:'Credit',
                          amount:order.totalPrice,
                          transactionId:walletId, 
                          transactionDate:new Date(),
                          status:'Completed'
                        })
                        console.log(wallet)
                        await wallet.save()
                      }
                      }else{
                        console.log("COD")
                      }
                  
                      } else {
                        console.log("Order not found");
                      }
                    
                    const orderData=await orderdb.findOne({orderId:orderId}).populate('products.productId')
                    res.status(200).json({userId,orderData});
                 
                 
                } catch (error) {
                  console.log(error.message);
                }
                } ,
                verifyPayment: async (req, res) => {
                  
                    try {
                      const id=req.body.order.receipt
                      const payment=req.body.payment
                      const orderData=await orderdb.findOne({orderId:req.body.order.receipt})
                      const userId=req.session.userId;
                     const addressId=req.body.selectedAddressId
                     let hmac=crypto.createHmac('sha256','7npRH8K1zAV8b3jk7WBf9Dtb')
                     hmac.update(payment.razorpay_order_id+'|'+payment.razorpay_payment_id)
                     hmac=hmac.digest('hex')
                     if(hmac==payment.razorpay_signature){
                      
                      orderData.paymentIntent={
                       type: 'Online payment',
                       status:'success',
                       paymentId:payment.razorpay_payment_id
                      }
                      orderData.orderStatus="Placed"
                      await orderData.save()
                      res.status(200).json({ message:'hiii',data:id,success:true});

                     }else{
                      orderData.paymentIntent={
                        type: 'Online payment',
                        status:'failed'
                       }
                       res.status(200).json({ message:'hiii',data:id,success:false});

                     }
                    }
                     catch (error) {
                      console.log(error);
                      res.status(500)
                    }
                    },

                    returnOrder: async (req, res) => {
                      try {
                          const orderId=req.params.orderId
                        const userId=req.session.userId
                       
                      orderdb.findOneAndUpdate(
                          { orderId: orderId },
                          { $set: { orderStatus: "Return request" } },
                          { new: true }
                        )
                          .then(updatedOrder => {
                            if (updatedOrder) {
                              console.log("Order status updated successfully:", updatedOrder);
                              
                              
                        
                              
                            } else {
                              console.log("Order not found");
                              
                            }
                          })
                          .catch(error => {
                            console.error("Error updating order status:", error);
                            // Handle errors
                          });
                          console.log(1111)
                          const orderData=await orderdb.findOne({orderId:orderId}).populate('products.productId')
                          console.log(2222,orderData)
                          res.status(200).json({userId,orderData});
                       
                       
                      } catch (error) {
                        console.log(error.message);
                      }
                      } ,


                    // returnOrder: async (req, res) => {
                    //   try {
                    //       const orderId=req.params.orderId
                    //     const userId=req.session.userId
                    //     const order=await orderdb.findOne({orderId:orderId})
 
                       
                    //  const updatedOrder=await orderdb.findOneAndUpdate(
                    //       { orderId: orderId },
                    //       { $set: { orderStatus: "Return request" } },
                    //       { new: true } // Set to true to return the updated document
                    //     )
                          
                    //         if (updatedOrder) {
                    //           console.log("Order status updated successfully:");
                              
                    //           if(order.paymentIntent.type=="Online payment"||order.paymentIntent.type=="wallet-payment"){
                    //             if(order.status!="Not Processed"){
                                
                    //             const wallet=await walletdb.findOne({userId:userId})
                    //             console.log(wallet)
                    //             var randomNumber = Math.floor(Math.random() * Math.pow(10, 12));
                    //             var walletId = randomNumber.toString().padStart(12, '0');
                    //             wallet.balance= wallet.balance+(order.totalPrice)
                    //             wallet.transactions.push({
                    //               type:'Credit',
                    //               amount:order.totalPrice,
                    //               transactionId:walletId, 
                    //               transactionDate:new Date(),
                    //               status:'Completed'
                    //             })
                    //             console.log(wallet)
                    //             await wallet.save()
                    //           }
                    //           }else{
                    //             console.log("COD")
                    //           }
                        
                    //           // Handle any additional logic here
                    //         } else {
                    //           console.log("Order not found");
                    //           // Handle if the order is not found
                    //         }
                          
                    //       console.log(1111)
                    //       const orderData=await orderdb.findOne({orderId:orderId}).populate('products.productId')
                    //       console.log(2222,orderData)
                    //       res.status(200).json({userId,orderData});
                       
                       
                    //   } catch (error) {
                    //     console.log(error.message);
                    //   }
                    //   } ,



 // ================================for admin side =================================

                    
                      orderList: async (req, res) => {
                        try {
                          const orderData=await orderdb.find().populate('products.productId').populate('userId').sort({ createdAt: -1 })
                          res.render("admin/orderList",{orderData});
                        } catch (error) {
                          console.log(error.message);
                        }
                      },
                      orderDetails: async (req, res) => {
                        try {
                          const orderId=req.params.orderId
                          const orderData=await orderdb.findOne({_id:orderId}).populate('products.productId').populate('userId')
                          console.log(orderData)
                          res.render("admin/orderDetails",{orderData}); 
                        } catch (error) {
                          console.log(error.message);  
                        } 
                      },
                      changeOrderStatus: async (req, res) => {
                        try {
                         const orderId=req.body.orderId;
                         const status=req.body.orderStatus
                  
                  
                         orderdb.findOneAndUpdate(
                          { orderId: orderId },
                          { $set: { orderStatus: status } },
                          { new: true }  
                        )
                          .then(updatedOrder => {
                            if (updatedOrder) {
                              console.log("Order status updated successfully:");
                              
                            } else {
                              console.log("Order not found");
                              
                            }
                          })
                          .catch(error => {
                            console.error("Error updating order status:", error);
                            
                          });
                          res.status(200).json({ message: "Order status updated successfully"});
                        } catch (error) {
                          console.log(error.message);
                          res.status(500).send("Error logging out.");
                        }
                      },
                      returnAccept: async (req, res) => {
                        try {
                          const orderId=req.params.orderId
                          console.log(orderId)
                           const order=await orderdb.findOne({orderId:orderId}) 
                          const updatedOrder=await orderdb.findOneAndUpdate(
                            { orderId: orderId },
                            { $set: { orderStatus: "Returned" } },
                            { new: true } 
                          )
                            
                              if (updatedOrder) {
                                console.log("Order status updated successfully:");
                                
                                if(order.paymentIntent.type=="Online payment"||order.paymentIntent.type=="wallet-payment"){
                                  if(order.status!="Not Processed"){
                                  const userId=order.userId
                                  console.log(userId)
                                  const wallet=await walletdb.findOne({userId:userId})
                                  console.log(wallet)
                                  var randomNumber = Math.floor(Math.random() * Math.pow(10, 12));
                                  var walletId = randomNumber.toString().padStart(12, '0');
                                  wallet.balance= wallet.balance+(order.totalPrice)
                                  wallet.transactions.push({
                                    type:'Credit',
                                    amount:order.totalPrice,
                                    transactionId:walletId, 
                                    transactionDate:new Date(),
                                    status:'Completed'
                                  })
                                  console.log(wallet)
                                  await wallet.save()
                                }
                                }else{
                                  console.log("COD")
                                }
                          
                                // Handle any additional logic here
                              } else {
                                console.log("Order not found");
                                // Handle if the order is not found
                              }
                            
                            console.log(1111)
                            const orderData=await orderdb.findOne({orderId:orderId}).populate('products.productId')
                            console.log(2222,orderData)
                            res.status(200).json({orderData});
  
                        } catch (error) { 
                          console.log("error",error); 
                          res.status(500) 
                        }
                      },
 
                      
                      
                  
                
}

module.exports = orderController;