const userdb = require("../model/userModel");
const orderdb = require("../model/orderModel");
const categorydb=require("../model/categoryModel");

const bcrypt = require("bcrypt");
const multer = require("multer");
const storage = multer.memoryStorage();
const sharp = require("sharp");
const { constants } = require("fs");

// const uploadDir = path.join(__dirname, "../../public/uploads");
const uploads = multer({ storage: storage }).array("image", 5);
const upload = multer({ storage: storage }).single("productImage");
const adminControllers = {
  // adminHome: async (req, res) => {
  //   try {
  //     const orderData = await orderdb.find();
  //     const price = orderData.reduce((crr, acc) => crr + acc.totalPrice, 0);

  //     const orders = await orderdb.find({});

  //     const amountData = Array(12).fill(0);
  //     const productCountData = Array(12).fill(0);

  //     orders.forEach((order) => {
  //       const { createdAt, products } = order;
  //       const month = new Date(createdAt).getMonth();

  //       products.forEach((product) => {
  //         const { price, quantity } = product;
  //         const totalPrice = price * quantity;
  //         amountData[month] += totalPrice;
  //         productCountData[month] += quantity;
  //       });
  //     });
  //     console.log(amountData, productCountData);
  //     res.render("admin/adminhome", {
  //       orderData,
  //       price,
  //       amountData,
  //       productCountData,
  //     });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // },
  adminLogin: async (req, res) => {
    try {
      res.render("admin/adminLogin");
    } catch (error) {
      console.log(error);
    }
  },
  adminLoginhome: async (req, res) => {
    try {
      const { email, password } = req.body;

      const userExists = await userdb.findOne({ email });

      if (!userExists) {
        return res.status(500).json({ message: "This user doesnt exist" });
      } else if (
        (await bcrypt.compare(password, userExists.password)) &&
        userExists.isAdmin === true
      ) {
        const userId = userExists._id;
        req.session.isadminLogged = userExists.name;
        res.status(200).json({ success: true });
      } else {
        console.log("wrong password");
        return res
          .status(500)
          .json({ success: false, message: "This user doesnt exist" });
      }
    } catch (err) {
      console.log(err);
    }
  },
  userManage: async (req, res) => {
    try {
      res.render("admin/userManage");
    } catch (error) {
      res.status(500);
    }
  },
  userLoad: async (req, res) => {
    try {
      const status = req.query.status ? req.query.status : "all";
      const search = req.query.search ? req.query.search : "";
      const pageNum = req.query.pageNum;
      const perPage = 10;
      console.log(status, search);
      let filterOptions;
      if (status === "all") {
        filterOptions = {
          name: { $regex: search, $options: "i" },
        };
      } else {
        filterOptions = {
          isBlocked: status,
          name: { $regex: search, $options: "i" },
        };
      }
      const userList = await userdb.find(filterOptions);
      const count = userList.length;
      const pageCount = Math.ceil(count / perPage);
      console.log(count, pageCount);
      const userData = await userdb
        .find(filterOptions)
        .skip((pageNum - 1) * perPage)
        .limit(perPage);

      res.status(200).json({ userData, pageCount });
    } catch (error) {
      console.log(error.message);
    }
  },
  userBlock: async (req, res, next) => {
    try {
      const userId = req.params.userId;
      await userdb.updateOne({ _id: userId }, { $set: { isBlocked: false } });
      res.status(200).json({ success: true });
    } catch (error) {
      console.log(error.message);
    }
  },
  userunBlock: async (req, res, next) => {
    try {
      const userId = req.params.userId;
      await userdb.updateOne({ _id: userId }, { $set: { isBlocked: true } });
      res.status(200).json({ success: true });
    } catch (error) {
      console.log(error.message);
    }
  },


  adminLogout: async (req, res) => {
    try {
      req.session.isadminLogged = null;
      res.render("admin/adminLogin");
    } catch (error) {
      console.log(9999, error);
      res.status(500).send(error);
    }
  },

  salesReport: async (req, res) => {
    try {
      const orderData = await orderdb
        .find()
        .populate("products.productId")
        .populate("userId");
      res.render("admin/salesReport", { orderData });
    } catch (error) {
      console.log(error.message);
    }
  },
  salesReportLoad: async (req, res) => {
    try {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);

      // Check if the parsed dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        // Handle invalid date format
        console.error("Invalid date format");
      } else {
        // Dates are valid, proceed with the query
        const orderData = await orderdb
          .find({
            orderStatus: "Delivered",
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          })
          .populate("products.productId")
          .populate("userId");
        console.log(orderData);
        res.status(200).json({ orderData });
      }
    } catch (error) {
      console.log(error.message);
    }
  },


  adminHome: async (req, res) => {
    try {
      const orderData = await orderdb.find();
      const categoryCount=await categorydb.find().count()
          const price = orderData.reduce((crr, acc) => crr + acc.totalPrice, 0);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
          // Calculate start and end dates of the month
          const startDate = new Date(currentYear, currentMonth - 1, 1);
          const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      
    
              const result = await orderdb.aggregate([
                  // Match orders within the specified month
                  {
                      $match: {
                          createdAt: {
                              $gte: startDate,
                              $lte: endDate,
                          },
                      },
                  },
                  {
                      $group: {
                          _id: { $dayOfMonth: '$createdAt' },
                          day: { $first: { $dayOfMonth: '$createdAt' } }, 
                          totalPriceSum: { $sum: '$totalPrice' },
                      },
                  },
                  { $sort: { day: 1 } },
                  
              ]);
              const amountData = new Array(30).fill(0);
      
              result.forEach(dayTotal => {
                amountData[dayTotal._id - 1] = dayTotal.totalPriceSum;
            });
      
      res.render("admin/adminhome", {
        amountData,
        orderData,
        price,
        categoryCount
      });
    } catch (error) {
      console.log(error);
    }
  },
};





function generateCouponCode(length) {
  const characters =process.env.coupon_code;
  let couponCode = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    couponCode += characters[randomIndex];
  }

  return couponCode;
}


async function getMonthlyData() {
  try {
    const orders = await orderdb.find({});

    const amountData = Array(12).fill(0);
    const productCountData = Array(12).fill(0);

    orders.forEach((order) => {
      const { createdAt, products } = order;
      const month = new Date(createdAt).getMonth();

      products.forEach((product) => {
        const { price, quantity } = product;
        const totalPrice = price * quantity;
        amountData[month] += totalPrice;
        productCountData[month] += quantity;
      });
    });

    // Format the data as required for the chart
    // const monthlyChartData = {
    //   labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    //   datasets: [
    //     {
    //       label: 'Amount',
    //       tension: 0.3,
    //       fill: true,
    //       backgroundColor: 'rgba(44, 120, 220, 0.2)',
    //       borderColor: 'rgba(44, 120, 220)',
    //       data: amountData,
    //     },
    //     {
    //       label: 'Product Count',
    //       tension: 0.3,
    //       fill: true,
    //       backgroundColor: 'rgba(4, 209, 130, 0.2)',
    //       borderColor: 'rgb(4, 209, 130)',
    //       data: productCountData,
    //     },
    //   ],
    // };

    return productCountData, amountData;
  } catch (error) {
    console.error("Error fetching monthly data:", error);
    throw error; // Handle the error as needed
  }
}

// Example usage:

module.exports = adminControllers;
