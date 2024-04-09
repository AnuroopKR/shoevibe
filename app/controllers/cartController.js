const userdb = require("../model/userModel");
const cartdb = require("../model/cartModel");
const productdb=require("../model/productModel");
 
const cartController={
    loadCart: async (req, res) => {
        try {
          // const userId = "65ca2c92dd3a7e82dea485b2"
          const userId=req.session.userId;
          const cartData=await cartdb.findOne({ userId: userId }).populate('products.productId')
         
          res.render("users/cart",{userId, cartData});
         
        } catch (error) { 
          console.log(error.message);
        } 
      },
      addtoCart: async (req, res) => {
        try {
          // const userId="65ca2c92dd3a7e82dea485b2"
          const userId=req.session.userId; 
          const productId=req.body.productId;  
          const quantity=req.body.quantity
          console.log("add to cart",req.body,productId)
          const productData=await productdb.findOne({_id:productId})
          .populate('offerId')            
          .populate({
              path: 'category',
              populate: {
                  path: 'offerId',
                  model: 'Offer'  
              }
          })
          const limit=await productdb.findOne({_id:productId},{quantity:1})
          
          
          const userCart=await cartdb.findOne({userId:userId})
        //   const CartData = await cartdb.findOne({ userId:userId}).populate({
        //     path: 'products.productId',
        //     populate: {
        //         path: 'offerId',
        //         model: 'Offer' 
        //     }
        // }).populate({
        //     path: 'products.productId',
        //     populate: {
        //         path: 'category',
        //         populate: {
        //             path: 'offerId',
        //             model: 'Offer' 
        //         }
        //     }
        // });

        let price
              if(productData.offerId){

             price=productData.price-(productData.price*productData.offerId.discount/100)
              }else if(productData.category.offerId){
              price=productData.price-(productData.price*productData.category.offerId.discount/100)
              }else{
                price=productData.price
              }
              const total=price*quantity

              console.log("add to cart",total)
          // already have a cart 
          if(userCart){
            const existingProduct = userCart.products.find((product) =>  
        product.productId.equals(productId));
        
        // product allready exists   
            if(existingProduct){
             let productQuantity=Number(existingProduct.quantity)+Number(quantity) 
             if(productQuantity>=limit.quantity){
              productQuantity=limit.quantity
             }
             
             const total=price*productQuantity
              await cartdb.updateOne(
                { userId: userId, "products.productId": productId },
                {
                  $set: {
                    "products.$.quantity": productQuantity,"products.$.price":total
                  },
              } 
            );
            
              
            const totalPrice=userCart.totalPrice+total
        
           
          await cartdb.updateOne(
            { userId: userId},
            {
              $set: {
               totalPrice:totalPrice
              }
          } )
            
          }
            // not exists the product
          else{
            await cartdb.updateOne(
              { userId: userId },
              {
                $push: {
                  products: {
                    productId: productId,
                    quantity:quantity,
                    price:total
                  }
                }
              }
            );
            const userCart=await cartdb.findOne({userId:userId})
            const totalPrice = userCart.products.reduce((total, product) => {
              
              return total + product.price;
          }, 0); 
          
          await cartdb.updateOne(
            { userId: userId}, 
            {
              $set: { 
               totalPrice:totalPrice
              } 
          } )
    }
          
          }
          // user not have a cart
          else{
          
            const cart = new cartdb({
              products:[{
              productId:productId,
              quantity:req.body.quantity,
              price:total}],
              userId:userId,
              totalPrice:total  
            });
            
            await cart.save(); 
             
          }
    
          res.status(200).json({success:true})
          
          
        } catch (error) {
          res.status(500)

          console.log(error.message); 
        }
      },
      updateQuantity: async (req, res) => {
        try {
            const {quantity,productId,total,id} = req.body;
            
            // const userId="65ca2c92dd3a7e82dea485b2"
            const userId=req.session.userId;
            const userCart = await cartdb.findOne({ userId:userId})

    console.log(userCart)
            if (!userCart) {
              throw new Error("User cart not found");   
            } 
            const productData=await productdb.findOne({_id:productId}).populate('offerId')            
            .populate({
                path: 'category',
                populate: {
                    path: 'offerId',
                    model: 'Offer'  
                }
            })
            console.log(10,productData,productId)

              let price
              if(productData.offerId){
                console.log(1)
             price=productData.price-(productData.price*productData.offerId.discount/100)
              }else if(productData.category.offerId){
                console.log(2)

              price=productData.price-(productData.price*productData.category.offerId.discount/100)
              }else{
                console.log(3)

                price=productData.price
              }
              const ptotal=price*quantity


            const cartItem = userCart.products.find((item) =>
              item._id.equals(id)
            );
      
            if (!cartItem) {
              throw new Error("Cart item not found");
            }
          
            cartItem.price=ptotal
            cartItem.quantity = quantity; 
            await userCart.save();
            const totalPrice = userCart.products.reduce((total, product) => {
              
              return total + product.price;
          }, 0);
          
            userCart.totalPrice=totalPrice 
            await userCart.save();
      
           
            res.status(200).json({ message: 'Quantity updated successfully'  });

        } catch (error) {
            console.log(error);  
            res.status(500).send('Error updating quantity');
        } 
      },
      deleteCart: async (req, res) => {
        try {
          // const userId="65ca2c92dd3a7e82dea485b2";
          const userId=req.session.userId; 
          const productId=req.body.id
          
          const userCart=await cartdb.findOne({userId:userId})
          
          // already have a cart
          if(userCart){
            
              userCart.products =  userCart.products.filter(product => !product._id.equals( productId));

              const totalPrice = userCart.products.reduce((total, product) => {
                return total + product.price;
            }, 0);
              userCart.totalPrice=totalPrice
              await userCart.save();
      
            
            
          res.status(200).json("success");
          }
        } catch (error) {
          console.log(error.message);
        }
      
        },
}

module.exports = cartController;

// let price
//               if(productData.products.productId.offerId){
//              price=productData.price-(productData.price*productData.products.productId.offerId.discount/100)
//               }else if(productData.products.productId.offerId){
//               price=productData.price-(productData.price*productData.products.productId.category.offerId.discount/100)
//               }else{
//                 price=productData.products.productId.price
//               }