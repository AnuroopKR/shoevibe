const express=require("express");
const route=express.Router();
const userController=require("../controllers/userController");
const otpController=require('../controllers/otpController');
const productController=require("../controllers/productController");
const cartController=require('../controllers/cartController');
const orderController=require("../controllers/orderController");
const middleWare = require("../controllers/middleWare");
const wishlistController = require("../controllers/wishlistController");
const walletController=require("../controllers/walletController")
const couponController=require("../controllers/couponController")




route.get('/signup',middleWare.isLogedin,userController.loadRegister); 
// for login
route.get('/login',middleWare.isLogedin,userController.loadLogin);


route.post('/signup',userController.userSignup)
route.post('/login',userController.userLogin)
route.get('/home',userController.userHome)
route.post('/otp',otpController.verifyOtp)
route.get('/otp',userController.otp)
route.get('/forgotPassword',userController.forgotPassword)
route.post('/forgotPassword',userController.submitEmail)
route.get('/loadPassword',otpController.verifyOtpset)
route.get('/loadPasswordform',userController.loadPasswordform)
route.post('/setPassword',userController.setPassword)   
route.get('/logout',userController.logout) 
route.get('/userCatagory',productController.userCatagory) 
// route.get('/userCatagory',productController.userCatagory)  
route.get('/userProduct/:productId',productController.loadProduct)
route.get('/categoryLoad',productController.userProductList)    
route.get('/resendOtp',otpController.resendOtp) 
// profile 
route.get('/userProfile',middleWare.isLoged,userController.userProfile)  
route.post('/changePassword',middleWare.isLoged,userController.changePassword)
route.post('/userUpdate',middleWare.isLoged,userController.profileUpdate)  

// address   
route.post('/address',middleWare.isLoged,userController.addAddress)
route.post('/addAddress',middleWare.isLoged,userController.addAddress)
route.get('/deleteAddress/:id',middleWare.isLoged,userController.deleteAddress)
route.get ('/setDefault/:id',middleWare.isLoged,userController.setDefault) 
route.post('/addressEdit/:id',middleWare.isLoged,userController.updateAddress)
// cart
route.post('/addtoCart',middleWare.isLogedforFetch,cartController.addtoCart)
route.get('/cart',middleWare.isLoged,cartController.loadCart) 
route.post('/updateQuantity',middleWare.isLoged,cartController.updateQuantity)
route.delete('/deleteCart',middleWare.isLogedforFetch,cartController.deleteCart) 
// checkout
route.get('/checkout',middleWare.isLoged,orderController.loadCheckout)
route.post('/checkout',middleWare.isLoged,orderController.conformCheckout)
route.post('/checkoutAddress',middleWare.isLoged,orderController.checkoutAddress) 
route.post('/verifyPayment',middleWare.isLoged,orderController.verifyPayment)
// order
route.get('/orderPlaced/:orderId',middleWare.isLoged,orderController.orderPlaced) 
route.get('/orderList',middleWare.isLoged,orderController.orderListUser)
route.get('/orderDetails/:orderId',middleWare.isLoged,orderController.userOrderDetails)
route.get('/cancelOrder/:orderId',middleWare.isLoged,orderController.cancelOrder)
route.get('/returnOrder/:orderId',middleWare.isLoged,orderController.returnOrder)
route.get('/download-invoice/:orderId',middleWare.isLoged,orderController.invoiceDownload)

route.get('/invoice/:orderId',middleWare.isLoged,orderController.invoice)


//wishlist
route.put('/addWishlist',middleWare.isLogedforFetch,wishlistController.addToWishlist) 
route.get('/loadWishlist',middleWare.isLoged,wishlistController.loadWishlist)
route.delete('/deleteWishlist',middleWare.isLoged,wishlistController.deleteWishlist) 
// wallet
route.get('/loadWallet',middleWare.isLoged,walletController.loadWallet)
route.post('/addToWallet',middleWare.isLoged,walletController.addToWallet)
route.post('/verifywallet',middleWare.isLoged,walletController.verifyWalletPayment)

// coupon
route.get('/checkCoupon',middleWare.isLoged,couponController.checkCoupen)




 
module.exports=route;