const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const Listing = require("./models/listing.js");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const{listingSchema} = require("./schema.js");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const app = express();

const MONGO_URL = "mongodb://127.0.0.1:27017/employeedata";

main()
  .then(()=>{
    console.log("DB is connected");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));  //data parse
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
  secret: "myrandomsecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7*24*60*60*1000,
    maxAge:  7*24*60*60*1000,
    httpOnly:true,
  },
};



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser);
passport.deserializeUser(User.deserializeUser);


app.use((req, res, next) =>{
  res.locals.success = req.flash("success");
  // console.log(res.locals.success);
  res.locals.error = req.flash("error");
  next();
});

app.get("/create-admin", async (req, res) => {
  const adminExists = await User.findOne({ username: "admin" });
  if (!adminExists) {
    const admin = new User({ username: "admin"});
    await User.register(admin, "12345");
    res.send("Admin user created");
  } else {
    res.send("Admin already exists");
  }
});


const userRouter = require("./routes/user.js");

app.use("/", userRouter);

app.get("/", (req, res) => {
  res.send("Hi, I am root!");
});

//----------------------------------------------------------------------------Image Upload-----------------------------------------------
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });

  // Set file type filter to allow only png and jpg
  const fileFilter = (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only .png and .jpg images are allowed!"));
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter
  });

  //Handle file upload and listing creation
  app.post("/add-listing", upload.single("image"), async (req, res) => {
    try {
      const newListing = new Listing({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        designation: req.body.designation,
        gender: req.body.gender,
        course: req.body.course,
        image: req.file.path,
      });

      await newListing.save();
      res.status(201).send("Employee created successfully!");
    } catch (error) {
      res.status(400).send("Error creating listing: " + error.message);
    }
  });

  app.use("/uploads", express.static("uploads"));

//-----------------------------------------------------------------------Image Upload End-------------------------------------------



//Index Route
app.get("/index", (req, res) => {
  res.render("listings/index.ejs");
});

// All employee listings Route with sorting
app.get("/listings", async (req, res) => {
  try {
    const sortField = req.query.sort || "name"; 
    const sortOrder = req.query.order === "desc" ? -1 : 1; 

    // Fetch employees from MongoDB with sorting
    const employees = await Listing.find().sort({ [sortField]: sortOrder });

    // Pass sort information to the template for toggling
    res.render("listings/showlistings", {
      employees,
      sortField,
      sortOrder: sortOrder === 1 ? "asc" : "desc", 
    });
  } catch (error) {
    res.status(500).send("Error fetching employees: " + error.message);
  }
});


//Employee Search Query
app.get("/listings/search", async (req, res) => {
  try {
    const searchQuery = req.query.query;

    // Search for employees where name, email, or mobile number matches the search query
    const employees = await Listing.find({
      $or: [
        { name: { $regex: searchQuery, $options: "i" } }, 
        { email: { $regex: searchQuery, $options: "i" } },
        { mobile: { $regex: searchQuery, $options: "i" } }
      ]
    });

    // Render the search results page with sorted and filtered employees
    res.render("listings/showlistings", { employees, sortField: '', sortOrder: '', query: searchQuery });
  } catch (error) {
    res.status(500).send("Error searching employees: " + error.message);
  }
});

// New Route
app.get("/listings/new", (req, res) => {
  res.render("listings/newlisting.ejs");
});

//Create Route
app.post("/listings", upload.single('image'), wrapAsync(async (req, res, next) => {
  let result = listingSchema.validate(req.body);
  console.log(result);
  if(result.error) {
    throw new ExpressError(400, result.error);
  }
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  req.flash("success", "New Employee Created!");
  res.redirect("/listings");
}));

//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", {listing});
}));

//Update Route
app.put("/listings/:id",upload.single('image'), wrapAsync(async (req, res) => {
  if(!req.body.listing) {
    throw new ExpressError(400, "Send valid data to update listing!")
  }
  let result = listingSchema.validate(req.body);
  console.log(result);
  if(result.error) {
    throw new ExpressError(400, result.error);
  }
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  req.flash("success", "Employee Details Updated Successfully.");
  res.redirect(`/listings`);
}));

//Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Employee Deleted!");
  res.redirect(`/listings`);
}));



app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

