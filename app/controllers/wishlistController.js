const productdb=require("../model/productModel");
const wishlistdb=require("../model/wishListModel")

const wishlistController={
    loadWishlist: async (req,res)=>{
        try{
            // const userId="65ca2c92dd3a7e82dea485b2";
              const userId=req.session.userId; 
            const wishlist=await wishlistdb.findOne({userId:userId}).populate('products');
            console.log(wishlist)
            res.render('users/wishlist',{wishlist,userId})
 
        }
        catch(error){
            console.log(error.message); 
        }
    },
    addToWishlist:async (req,res)=>{ 
        try{
            // const userId="65ca2c92dd3a7e82dea485b2";
              const userId=req.session.userId; 
            const productId=req.body.id
            console.log(1111,productId)
            const wishlist=await wishlistdb.findOne({userId:userId})
            // already have a cart 
            if(wishlist){
                const existingProductIndex = wishlist.products.findIndex(item => item.toString() === productId);
                console.log(existingProductIndex);
                if(existingProductIndex>=0){
                    wishlist.products.splice(existingProductIndex,1)
                    console.log(8888,wishlist)
                   await wishlist.save()   
                }
          else{
            await wishlistdb.updateOne( 
                { userId: userId },
                {
                  $addToSet: {
                    products: productId
                    
                  }
                }
              );
            } 
          }
            else{
                const wishlistData = new wishlistdb({
                    products:[productId],
                    userId:userId 
                  });
                   
                  await wishlistData.save(); 
            }
            // res.redirect('/userCatagory')
            res.status(200).json("success")
        }
        catch(error){ 
            console.log(error.message)
        }
    },
    deleteWishlist: async(req,res)=>{
        try{
            // const userId="65ca2c92dd3a7e82dea485b2";
              const userId=req.session.userId; 
            const productId=req.body.id
            
            const wishlist=await wishlistdb.findOne({userId:userId})
            // already have a cart 
            if(wishlist){
                const existingProductIndex = wishlist.products.findIndex(item => item.toString() === productId);
                console.log(existingProductIndex);
                if(existingProductIndex>=0){
                    wishlist.products.splice(existingProductIndex,1)
                    console.log(8877,wishlist)
                   await wishlist.save()   
                }

            }  
            res.status(200).json("success")
        } catch(error){ 
            console.log(error.message)
        }       
    }
}
 
module.exports = wishlistController;