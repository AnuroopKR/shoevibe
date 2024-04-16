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
          res.status(500)

        } 
      },
      addOffer: async (req, res) => {
        try {
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
          res.status(500)

        }
      },
      deleteOffer: async (req, res) => {
        try {
           const offerId=req.body.offerId
          const offerData=await offerdb.deleteOne({_id:offerId})
          res.status(200).json("success")
        } catch (error) {
          console.log(error.message);
          res.status(500)

        } 
      },
      loadOfferProduct: async (req, res) => {
        try {
          const status=req.query.status
          const id=req.query.id
          console.log("productId",id);
          const offerData=await offerdb.find()
          res.render("admin/Offer",{offerData,id,status});
        } catch (error) {
          console.log(error.message);
          res.status(500)

        } 
      } ,
      applyOffer:  async (req, res) => {
        try {
          const id=new ObjectId(req.body.id);
          console.log(666,typeof(id));
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
          res.status(500)

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
          res.status(500)

        }   
      } ,
      editOfferLoad:  async (req, res) => {
        try {
          const offerId=req.query.offerId;
        console.log(1111,offerId);
          const offer=await offerdb.findOne({_id:offerId})
          console.log(offer);
          res.render("admin/editOffer",{offer})
        } catch (error) {
          console.log(error);
          res.status(500)
        }
      },
      updateOffer: async (req, res) => {
        try {
          const offer=await offerdb.findOne({_id:req.body.id})
          if (offer) {
          offer.title=req.body.offerName,
          offer.description=req.body.description,
          offer.expirationDate=req.body.expiryDate,
          offer.discount=req.body.percentage,
          offer.startingDate=req.body.startingDate

          await offer.save();
          console.log(9999);
          res.status(200).json("offer data")
          }
        } catch (error) {
          res.status(500)
          console.log(error.message);
        }
      },
 }

 module.exports =offerController;