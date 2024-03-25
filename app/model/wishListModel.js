const mongoose=require("mongoose");

const wishlistSchema=new mongoose.Schema({
    products:[{
          type:mongoose.Schema.Types.ObjectId,
        ref:"product",
    
}],
userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
    require:true
}
});
module.exports=mongoose.model('wishlist',wishlistSchema) 