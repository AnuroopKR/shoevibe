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
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer'); 
const { log } = require("console");

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
          const userId=req.session.userId;
         const addressId=req.body.selectedAddressId
         const couponId=req.body.couponId
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
            const orderData=new orderdb(id)
            await orderData.save()

            const cartItems=cart.products;
            await Promise.all(
              cartItems.map(async (cartItem) => {
                const product = await productdb.findById(cartItem.productId).exec();
                if (product) {
                  product.quantity -= cartItem.quantity;
                  product.sold+=cartItem.quantity
                  await product.save();
                }
              }))

            cart.products = []; 
            await cart.save();
            res.status(200).json({ message:'hiii',data:id,status:false});

            
            // wallet payment
          }else if(paymentMethod==="wallet-payment"){
            const wallet=await walletdb.findOne({userId:userId})
            if(wallet&&wallet.balance>(productData.totalPrice+50)){
              const method="wallet payment"
              var randomNumber = Math.floor(Math.random() * Math.pow(10, 12));
              var walletId = randomNumber.toString().padStart(12, '0');
              let id=await saveOrder(productData,method,userId,cart,couponId)
              const orderData=new orderdb(id)
            await orderData.save()

            const cartItems=cart.products;
            await Promise.all(
              cartItems.map(async (cartItem) => {
                const product = await productdb.findById(cartItem.productId).exec();
                if (product) {
                  product.quantity -= cartItem.quantity;
                  product.sold+=cartItem.quantity
                  await product.save();
                }
              }))

            cart.products = []; 
            await cart.save();
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
            console.log(7777,id);
            res.status(200).json({ message:'hiii',data:id,status:true,order});

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
            const orders ={
              products:productData.products,
              orderId:id,
              paymentIntent:{
                type:method
              }, 
              totalPrice:totalPrice,
              address:address,
              userId: userId
              };
           
          console.log('All products deleted successfully',id);
          return orders
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
        console.log(1234,orderData);
          res.render("users/placedOrder",{userId,orderData});
        } catch (error) {
          console.log(error.message);
        }
        }, 
        orderListUser: async (req, res) => {
          try {
            const userId=req.session.userId
            const orderData=await orderdb.find({userId:userId}).sort({createdAt:-1})
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

                 console.log(orderId)
                const updatedOrder=await orderdb.findOneAndUpdate(
                    { orderId: orderId },
                    { $set: { orderStatus: "Cancelled" } },
                    { new: true } 
                  )
                     
                      if (updatedOrder) {
                        console.log("Order status updated successfully:");
                        
                      const order=await orderdb.findOne({orderId:orderId})
                      if(order.paymentIntent.type=="Online payment"||order.paymentIntent.type=="wallet-payment"){
                        if(order.status!="Not Processed"){
                        const wallet=await walletdb.findOne({userId:userId})
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
                      const data=req.body.data
                      const userId=req.session.userId;
                     const orderData=await orderdb.findOne({orderId:id})
                     const cart=await cartdb.findOne({userId:userId})
                     let hmac=crypto.createHmac('sha256','7npRH8K1zAV8b3jk7WBf9Dtb')
                     hmac.update(payment.razorpay_order_id+'|'+payment.razorpay_payment_id)
                     hmac=hmac.digest('hex')
                     if(hmac==payment.razorpay_signature){
                      if(orderData){
                        console.log("retry payment success")
                        orderData.paymentIntent={
                          type: 'Online payment',
                          status:'success',
                          paymentId:payment.razorpay_payment_id
                         }
                         orderData.orderStatus="Placed"
                         await orderData.save()
                      }else{
                      const orderData=new orderdb(data)
                      orderData.paymentIntent={
                       type: 'Online payment',
                       status:'success',
                       paymentId:payment.razorpay_payment_id
                      }
                      orderData.orderStatus="Placed"
                      await orderData.save()

                      const cartItems=cart.products;
            await Promise.all(
              cartItems.map(async (cartItem) => {
                const product = await productdb.findById(cartItem.productId).exec();
                if (product) {
                  product.quantity -= cartItem.quantity;
                  product.sold+=cartItem.quantity
                  await product.save();
                }
              }))

                        cart.products = []; 
                        await cart.save();
                      console.log(3333,orderData);
                    }
                      res.status(200).json({ message:'hiii',data:id,success:true});
 
                     }else{
                      if(orderData){
                        orderData.paymentIntent={
                          type: 'Online payment',
                          status:'failed '
                         }
                         await orderData.save()
                      }else
                       orderData=new orderdb(data)
                      orderData.paymentIntent={
                        type: 'Online payment',
                        status:'failed '
                       }
                       await orderData.save()
                       console.log("failed")
                      }
                       res.status(200).json({ message:'hiii',data:id,success:false});

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
                          });
                          const orderData=await orderdb.findOne({orderId:orderId}).populate('products.productId')
                          res.status(200).json({userId,orderData});
                       
                       
                      } catch (error) {
                        console.log(error.message);
                      }
                      } ,
                      invoice: async (req,res)=>{
                        try{
                          const orderId=req.params.orderId 
                          const order=await orderdb.findOne({orderId:orderId}).populate('products.productId')
                          res.render ('users/invoice',{order})
                       }catch (error) {
                        console.log(error.message);
                      }
                      },
                      
                      invoiceDownload: async (req,res)=>{
                        
                          try {
                            const orderId=req.params.orderId
                              const order = await orderdb.findOne({orderId:orderId})
                                  .populate("products.productId")
                                  
                      
                              const templatePath = path.join(__dirname, '../views/users/invoice.ejs');
                      
                      
                              const renderTemplate = async () => {
                                  try {
                                      return await ejs.renderFile(templatePath, {order});
                                  } catch (err) {
                                      console.error('Error rendering EJS template:', err);
                                      res.status(500).send('Error rendering sales report');
                                  }
                              };
                      
                              const htmlContent = await renderTemplate();
                      
                              if (!htmlContent) {
                                  return;
                              }
                      
                              const browser = await puppeteer.launch();
                              const page = await browser.newPage();
                              await page.setViewport({ width: 1280, height: 800 });
                              await page.setContent(htmlContent);
                              const pdfBuffer = await page.pdf({ format: "A4" });
                      
                              res.set({
                                  "Content-Type": "application/pdf",
                                  "Content-Length": pdfBuffer.length,
                              });
                              res.send(pdfBuffer); 
                      
                              await browser.close();
                          } catch (error) {
                              console.error('Error generating sales report:', error);
                              res.status(500).send('Error generating sales report');
                          }
                    
                      },
                      retryPayment: async(req,res)=>{
                        try{
                         const orderId= req.query.orderId
                         console.log(orderId)
                         const orderData= await orderdb.findOne({orderId:orderId})
                          if(orderData){
                          const order= await generateRazorpay(orderData)
                          console.log(orderData,1111,order)  
                               res.status(200).json({ message:'hiii',data:orderData,status:true,order});
                          }
                        }catch(error){
                          console.log(error)
                          res.status(500)
                        }
                      },  
            

 // ================================for admin side =================================

                    
                      orderList: async (req, res) => {
                        try {
                          const orderData=await orderdb.find().populate('products.productId').populate('userId').sort({ createdAt: -1 })
                          res.render("admin/orderList",{orderData});
                        } catch (error) {
                          console.log(error.message); 
                        }
                      },
                      orderLoadFetch:  async (req, res) => {
                        try { 
                          const searchQuery=req.query.search?req.query.search:"";  
                          const statusFilter=req.query.status   
                          const pageNum=req.query.pageNum 
                          
                          const perPage=10 

                          console.log(searchQuery,statusFilter,pageNum)
                          const orderList=await orderdb.find().populate('products.productId').populate('userId').sort({ createdAt: -1 })
                          const orderFilterData = orderList.filter((order) => {
                            const statusMatch = statusFilter === "all" || order.orderStatus === statusFilter;
                        
                            if (searchQuery && order.orderId) {
                                const orderIdMatch = order.orderId.includes(searchQuery);
                                return orderIdMatch && statusMatch;
                            } else {
                                return statusMatch; 
                            }
                        });
                          const count=orderFilterData.length
                          const startIndex = (pageNum - 1) * perPage;
                          const endIndex = startIndex + perPage;
                          const orderData=orderFilterData.slice(startIndex, endIndex);
                          const pages=Math.ceil(count/perPage)
                          console.log(count,"aaaa")  
                          res.status(200).json({orderData,pages,pageNum});  
                        } catch (error) {
                          console.log(error);
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
                          const order=await orderdb.findOne({orderId:orderId})
                  
                         orderdb.findOneAndUpdate(
                          { orderId: orderId },
                          { $set: { orderStatus: status } },
                          { new: true }  
                        )
                          .then(updatedOrder => {
                            if (updatedOrder) {
                              console.log("Order status updated successfully:");
                              if(status=="Delivered"){
                                order.products.map(async (item) => {
                                  const product = await productdb.findById(item.productId).exec();
                                  if (product) {
                                    product.sold += item.quantity;
                                    await product.save();
                                  }
                                })
                              }
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
                          
                              } else {
                                console.log("Order not found");
                              }
                            
                            const orderData=await orderdb.findOne({orderId:orderId}).populate('products.productId')
                            res.status(200).json({orderData});
  
                        } catch (error) { 
                          console.log("error",error); 
                          res.status(500) 
                        }
                      },
 
                      
                      
                  
                
}


 function generateRazorpay(id) {
          return new Promise((resolve, reject) => {
            var options = {
              amount: id.totalPrice*100,   
              currency: "INR",
              receipt: id.orderId 
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


module.exports = orderController;