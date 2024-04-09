  const offerdb=require('../model/offerModel')
  const productdb=require('../model/productModel')
  const categorydb=require('../model/categoryModel')
  const mongoose = require('mongoose')
  const { ObjectId } = mongoose.Types;


 const offerController={
    loadOfferPage: async (req, res) => {
        try {
          
          const offerData=await offerdb.find()
          res.render("admin/addOffer",{offerData});
        } catch (error) {
          console.log(error.message);
        } 
      },
      addOffer: async (req, res) => {
        try {
        //   const couponCode = generateCouponCode(12);
          const offer=new offerdb({
            title:req.body.offerName,
            description:req.body.description,
            expirationDate:req.body.expiryDate,
            discount:req.body.percentage,
            startingDate:req.body.startingDate,
            
          })
          await offer.save();
          
          res.status(200).json("offer data")
        } catch (error) {
          console.log(error.message);
        }
      },
      deleteOffer: async (req, res) => {
        try {
           const offerId=req.body.offerId
          const offerData=await offerdb.deleteOne({_id:offerId})
          res.status(200).json("success")
        } catch (error) {
          console.log(error.message);
        } 
      },
      loadOfferProduct: async (req, res) => {
        try {
          const status=req.query.status
          const id=req.query.productId
          console.log("productId",id);
          const offerData=await offerdb.find()
          res.render("admin/Offer",{offerData,id,status});
        } catch (error) {
          console.log(error.message);
        } 
      } ,
      applyOffer:  async (req, res) => {
        try {
          const id=(req.body.id)
          console.log(666,req.body.offerId);
          const status=req.body.status
          const offerId=new ObjectId(req.body.offerId);
          const offerData=await offerdb.find()
          if(status==="product"){
          const result=await productdb.updateOne({_id:id},{$set:{offerId:offerId}})
          }else if(status==="category"){
            const result=await categorydb.updateOne({_id:id},{$set:{offerId:offerId}})
          }
          
          res.status(200).json({offerData,id});
        } catch (error) { 
          console.log(error.message);
        }   
      },
      removeOffer:  async (req, res) => {
        try {
          const id=req.query.id
          const status=req.query.status
          const offerData=await offerdb.find()
          if(status==="product"){
            const result=await productdb.updateOne({_id:id},{ $unset: { offerId: "" } })
            }else if(status==="category"){
              console.log(id)
              const result=await categorydb.updateOne({_id:id},{ $unset: { offerId: "" } })
            }
          res.status(200).json({offerData,id});
        } catch (error) { 
          console.log(error.message);
        }   
      }  
 }

 module.exports =offerController;