const express=require("express");
const adminRoute=express.Router()
const adminController=require("../controllers/adminControllers");
const otpController=require('../controllers/otpController');
const productController=require("../controllers/productController");
const middleWare = require("../middleWares/middleWare"); 
const multer=require('multer');
const path= require('path');
const offerController = require("../controllers/offerController");
const orderController = require("../controllers/orderController");
const couponController=require("../controllers/couponController")

// Set up multer to handle multiple file uploads
 
  // const storage = multer.diskStorage({
  //   destination: function (req, file, cb) {
  //       cb(null, path.join(__dirname,"..",'public','uploads')); // Specify the upload directory

  //   },
  //   filename: function (req, file, cb) {

  //     cb(null,  Date.now() + '-' + file.originalname)
  //   }
  // })
  
  // const upload = multer({ storage: storage })


adminRoute.get('/home',middleWare.isadminLogged,adminController.adminHome);
adminRoute.get('/',middleWare.isadminLogged,adminController.adminHome)
adminRoute.post('/login',adminController.adminLoginhome);     
adminRoute.get('/user',middleWare.isadminLogged,adminController.userManage); 
adminRoute.get('/userLoad',middleWare.isadminLogged,adminController.userLoad); 


adminRoute.get('/logout',adminController.adminLogout)
adminRoute.get('/unblockUser/:userId',middleWare.isadminLogged,adminController.userBlock)
adminRoute.get('/blockUser/:userId',middleWare.isadminLogged,adminController.userunBlock)
// product
adminRoute.get('/productList',middleWare.isadminLogged,productController.productList);
adminRoute.get('/productListLoad',middleWare.isadminLogged,productController.productListLoad);
adminRoute.get('/addProduct',middleWare.isadminLogged,productController.addProduct); 
adminRoute.post('/addProduct',middleWare.isadminLogged,productController.addProductDetails)
adminRoute.get('/listProduct/:productId',middleWare.isadminLogged,productController.unlistProduct) 
adminRoute.get('/unlistProduct/:productId',middleWare.isadminLogged,productController.listProduct)
adminRoute.get('/editProduct/:productId',middleWare.isadminLogged,productController.editProduct)
adminRoute.post('/editProduct/:productId',middleWare.isadminLogged,productController.updateProduct)
adminRoute.post('/editImage',middleWare.isadminLogged,productController.editImage)
// category
adminRoute.get('/category',middleWare.isadminLogged,productController.category)
adminRoute.post('/addCategory',middleWare.isadminLogged,productController.addCategory) 
adminRoute.get('/editCategory/:categoryId',middleWare.isadminLogged,productController.editCategory);
adminRoute.post('/editCategory/:categoryId',middleWare.isadminLogged,productController.updateCategory)
adminRoute.get('/deleteCategory/:categoryId',middleWare.isadminLogged,productController.deleteCategory); 
// order
adminRoute.get('/orderList',middleWare.isadminLogged,orderController.orderList)
adminRoute.get('/orderDetails/:orderId',middleWare.isadminLogged,orderController.orderDetails) 
adminRoute.post('/changeOrderStatus',middleWare.isadminLogged,orderController.changeOrderStatus)
adminRoute.get('/returnAccept/:orderId',middleWare.isadminLogged,orderController.returnAccept)
adminRoute.get('/orderListLoadFetch',middleWare.isadminLogged,orderController.orderLoadFetch)


// coupen
adminRoute.get('/couponList',middleWare.isadminLogged,couponController.couponList)
adminRoute.post('/createCoupon',middleWare.isadminLogged,couponController.createCoupon)  
adminRoute.delete('/deleteCoupon',middleWare.isadminLogged,couponController.deleteCoupon)
// sales report
adminRoute.get('/salesReport',middleWare.isadminLogged,adminController.salesReport)  
adminRoute.post('/salesReportLoad',middleWare.isadminLogged,adminController.salesReportLoad)
// offer
adminRoute.get('/offerLoad',middleWare.isadminLogged,offerController.loadOfferPage) 
adminRoute.post('/addOffer',middleWare.isadminLogged,offerController.addOffer)
adminRoute.delete('/deleteOffer',middleWare.isadminLogged,offerController.deleteOffer)
adminRoute.get('/offerLoadProduct',middleWare.isadminLogged,offerController.loadOfferProduct) 
adminRoute.put('/applyOffer',middleWare.isadminLogged,offerController.applyOffer)
adminRoute.get('/removeOffer',middleWare.isadminLogged,offerController.removeOffer)


 
  
 
 
module.exports=adminRoute; 