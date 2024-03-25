const mongoose=require("mongoose");

const couponSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    couponCode:{
        type:String,
        require:true,
        unique:true
    },
    description:{
        type:String
    },
    expiry:{
        type:Date,
        require:true,
        default:  new Date('9999-12-31T23:59:59.999Z')
    },
    discount:{
        type:Number,
        require:true
    } ,
    minimumRate:{
        type:Number, 
        require:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    usersUsed:[
        {userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"
        }
        }]
   
   
   
});
module.exports=mongoose.model('coupon',couponSchema)