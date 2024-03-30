const mongoose=require("mongoose");

const productSchema=new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    colour:{
        type:String,
        require:true
    },
    size:{
        type:Number,
        require:true
    },
    brand:{
        type:String,
        require:true
    },
    description:{
        type:String,
        require:true
    },
    price:{
        type:Number,
        require:true
    },
    sold:{
        type:Number,
        require:true 
    },
    file:{
        type:[String],
        require:true
    },
    // tags:{
    //     type:String,
    //     require:true 
    // },
    category:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"category",
            required:true
    }, 
    quantity:{
        type:Number,
        require:true
    },       
    date:{
        type: Date,
        default: Date.now,
    },
    status:{
        type:String,
        require:true
    },
    offerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Offer"
    }
});
module.exports=mongoose.model('product',productSchema)  