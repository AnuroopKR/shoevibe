const mongoose=require("mongoose");

const cartSchema=new mongoose.Schema({
    products:[{
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"product",
        required:true
    },
    quantity:{
        type:Number,
        require:true
    },
    price:{
        type:Number
    }
}],
userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
    require:true
},
totalPrice:{
    type:Number
}
});
module.exports=mongoose.model('cart',cartSchema)