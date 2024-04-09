const productdb = require("../model/productModel");
const categorydb=require("../model/categoryModel");
 const wishlistdb=require("../model/wishListModel");
 const offerdb=require("../model/offerModel")
 const multer=require('multer')

 const storage = multer.memoryStorage()
const path=require('path');
const sharp = require("sharp");
const uploads = multer({ storage: storage }).array("image", 5);
const upload = multer({ storage: storage }).single('productImage');


const productController={
 
userCatagory: async (req, res) => {
  try {
    const id=req.query.category; 
    // const userId="65ca2c92dd3a7e82dea485b2"
    const userId=req.session.userId
    const wishlist=await wishlistdb.findOne({userId:userId})
    const category=await categorydb.find()  
      
        res.render("users/catagory",{category,userId,wishlist});
    
  } catch (error) { 
    throw new Error(error);
    // console.log(error.message);   
  }  
},
userProductList: async (req,res)=>{
  try{
    const category=req.query.id=="undefined" ? {$exists:true}:req.query.id  ;  
    const userId=req.session.userId
    const price1=req.query.price1 ? req.query.price1:0
    const price2=req.query.price2 ?req.query.price2:100000 
    const status=req.query.status 
    const search=req.query.search 
    const pageNum=req.query.pageNum 
    const perPage=3;
    // const count=await productdb.find().count()
   

const wishlist=await wishlistdb.findOne({userId:userId})
let sort
if(status==="descending"){
  sort=-1
}else{
  sort=1
} 
  
let filterOptions ={
  category: category, 
  productName: { $regex: search, $options: "i" }, 
  price: { $gte: price1, $lte: price2 } 
};

  const productList=await productdb.find(filterOptions)   
const productData=await productdb.find(filterOptions).sort({ price: sort }).skip((pageNum-1)*perPage).populate('offerId').populate({
      path: 'category',
      populate: {
          path: 'offerId',
          model: 'Offer'  
      }
  })
    .limit(perPage)
const count=productList.length
        const pages=Math.ceil(count/perPage)     
        const id=req.query.id

 res.status(200).json({productData,wishlist,pages,pageNum,id}) 
  }catch(error){
    console.log(error) 
  }  
  
},
loadProduct: async (req, res) => { 
  try {
    const productId=req.params.productId;
        // const userId="65ca2c92dd3a7e82dea485b2"
    const userId=req.session.userId 
    const wishlist=await wishlistdb.findOne({userId:userId})
    const product=await productdb.findOne({_id:productId}).populate('offerId').populate({
      path: 'category',
      populate: {
          path: 'offerId',
          model: 'Offer'  
          }
  })
    // const offer=await offerdb.findOne({_id:product.offerId})
    let offerPrice
    let offer
    if(product.offerId){
    offerPrice= Math.ceil(product.price*(100-product.offerId.discount)/100);
    offer=product.offerId.discount
    }else if(product.category.offerId){
      offerPrice= Math.ceil(product.price*(100-product.category.offerId.discount)/100);
      offer=product.category.offerId.discount
    }else{
      offerPrice=product.price
    }
    // console.log(offerPrice)
    res.render("users/product",{product,userId,wishlist,offerPrice,offer});
  } catch (error) { 
    console.log(error.message);  
  }   
},

// in admin side


productList: async (req, res) => {
  try {
   const productlist=await productdb.find()
   const category=await categorydb.find()
    res.render('admin/productList',{category})  
  } catch (error) { 
    console.log(error.message);
  }
},
productListLoad: async (req, res) => {
  try { 
    const status=req.query.status
    const category=req.query.category
    const pageNum=req.query.pageNum
    let productlist
    const perPage=2
    let productData
    let count
    let pages
    if(!status){
      productData=await productdb.find()
      count=productData.length
      pages=Math.ceil(count/perPage)
      productlist=await productdb.find().skip((pageNum-1)*perPage).limit(perPage);
    }else{
      productData=await productdb.find({status:status})
      count=productData.length
      pages=Math.ceil(count/perPage)
    productlist=await productdb.find({status:status}).skip((pageNum-1)*perPage).limit(perPage);
    }
    res.status(200).json({productlist,category,pages})  
  } catch (error) { 
    console.log(error.message);
  }
},
addProduct: async (req, res) => {
  try {
    const category=await categorydb.find() 
    res.render("admin/addProduct",{category});
  } catch (error) {
    console.log(error.message);
  }
},
addProductDetails: async (req, res) => {
  uploads(req, res, async (err) => {
    var filenames = [];
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Error uploading files.");
    }

    try {
      const { productName, quantity, colour, size, brand, description, category, price, offer } = req.body;
      console.log(productName);
      // Use Sharp to process and save the images
      const sharpPromises = req.files.map(async (file, index) => {
        const filename = `image_${index + 1}_${Date.now()}.jpg`;
        const imagePath = path.join(__dirname, '..', '..','public', 'uploads', filename);
      
        await sharp(file.buffer)
          .resize(800, 800, {
            fit: "contain",
            withoutEnlargement: true,
            background: "white",
          })
          .toFile(imagePath, { quality: 90 });
      filenames.push(filename)
      });

      // Wait for all sharpPromises to resolve before creating the Product
      await Promise.all(sharpPromises);

      // Create the Product instance with the filenames
      const product = new productdb({
        productName,
        quantity,
        colour,
        size,
        brand,
        description,
        category,
        price,
        file: filenames.map((filename) => `/uploads/${filename}`),
        status:"listed"
      });

      

      // Save the product to the database
      await product.save();
      res.status(200).json('hai');
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).send("Error creating product.");
    }
  });
}, 
editProduct: async (req, res) => {
  try {
    const productId=req.params.productId; 
    
    const category=await categorydb.find()
    
   const product=await productdb.findOne({_id:productId}).populate('category')
    
console.log(product);
    res.render("admin/editProduct",{product,category});
  } catch (error) {
    console.log(error.message);
  }
},
updateProduct: async (req, res) => {
  try {
    const productId=req.params.productId; 
    
    const { productName, quantity, colour, size, brand, description, category, price, offer } = req.body;
    console.log(description)
   const productData={
      productName:productName,
      quantity:quantity,
      colour:colour, 
      size:size,
      brand:brand,
      description:description,
      category:category,
      price:price
    } 
    
    const result = await productdb.updateOne(
      { _id:productId }, // Match document with specified _id
      { $set: productData } // Replace the entire document with new values
    );
   const product=await productdb.findOne({_id:productId})  
    

    res.redirect("/admin/productList");
  } catch (error) {
    console.log(error.message);
  }
},
editImage:async (req, res) => {
  upload(req, res, async (err) => {
    
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Error uploading files.");
    }
  try {
    var filenames = [];
    const index=req.query.index; 
    const productId=req.query.productId;
    const imgName=req.file
    
    const filename = `image_${index+1}_${Date.now()}.jpg`;
    const imagePath = path.join(__dirname, '..', '..','public', 'uploads',filename);
    await sharp(imgName.buffer)
    .resize(300, 300, {
      fit: "contain",
      withoutEnlargement: true,
      background: "white",
    })
    .toFile(imagePath, { quality: 90 });  
filenames.push(filename)
    
    const productData=await productdb.findOne({_id:productId})
    productData.file[index]=`/uploads/${filename}`
    const productimage=await productdb.updateOne({_id:productId},{$set:{file:productData.file}})
    const product=await productdb.findOne({_id:productId})
    const category=await categorydb.find()
    res.render("admin/editProduct",{product,category});
    
  } catch (error) {
    console.log(error.message); 
  }
})
},
unlistProduct: async (req, res) => {
  try {
    const productId=req.params.productId;
    await productdb.updateOne(
      { _id:productId},
      { $set: { status:"unlisted" } } 
    );
    res.status(200).json('success')
  } catch (error) {
    console.log(error.message);
  } 
},
listProduct: async (req, res) => {
  try {
    const productId=req.params.productId;
    await productdb.updateOne(
      { _id:productId},
      { $set: { status:"listed" } } 
    );
    res.status(200).json('success')
  } catch (error) {
    console.log(error.message);
  } 
},

// for category
category: async (req, res) => {
  try {
    const category=await categorydb.find()
    res.render("admin/category",{category});
  } catch (error) {
    console.log(error.message);
  }
},
addCategory: async (req, res) => {
  try {
    
    const{categoryName,description}=req.body;
    const slug=createSlug(categoryName)
    const categoryData=await categorydb.findOne({slug:slug})
    console.log(categoryData)
    if (categoryData) {
      res.status(200).json({message:'Category already exist'})
    }else{
    const category = new categorydb({
      name:categoryName,
      description,
      status:"listed",
      slug:slug
    });

    

    // Save the product to the database
    await category.save();

    res.status(200).json({success:true});
  }} catch (error) {
    console.log(error.message);
  }
},
editCategory: async (req, res) => {
  try {
    const categoryId=req.params.categoryId;
    const category=await categorydb.findOne({_id:categoryId})
    res.render("admin/editCategory",{category});
  } catch (error) {
    console.log(error.message);
  }
},
updateCategory: async (req, res) => {
  try {
    const categoryId=req.params.categoryId;
    const slug=createSlug(req.body.categoryName)
    const updatedCategoryData = { 
      name: req.body.categoryName,
      description: req.body.description,
      slug:slug
    }
    
    const result = await categorydb.updateOne(
      { _id:categoryId }, // Match document with specified _id
      { $set: updatedCategoryData } // Replace the entire document with new values
    );
    

    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message); 
  }
},
deleteCategory: async (req, res) => {
  try {
    const categoryId=req.params.categoryId;
    const result=await categorydb.deleteOne({_id:categoryId})
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error.message);
  }
},

}

function createSlug(str) {
  return str.toLowerCase()
            .replace(/[^\w\s-]/g, '')  // Remove non-word characters except spaces and hyphens
            .replace(/\s+/g, '-')       // Replace spaces with hyphens
            .replace(/--+/g, '-')       // Replace consecutive hyphens with a single hyphen
            .trim();                    // Trim leading/trailing spaces
}


    module.exports = productController;
