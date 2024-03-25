const mongoose=require("mongoose");

const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String, 
        require:true
    },
    status:{
        type:String,
        require:true
    },
    offerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Offer"
    },
    slug:{
        type:String,
        require:true
    }
});
module.exports=mongoose.model('category',categorySchema)