// build-in packages
const path = require("path");
const fs = require("fs");
const https = require("https");

// third party packages
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session); // need to import the session
const csrf = require("csurf");
const flush = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const errorController = require("./controllers/error");
const shopController = require("./controllers/shop");
const isAuth = require("./middleware/is-auth");

const User = require("./models/user");

//console.log(process.env.NODE_ENV); // NODE_EVN is variable, we don't need to mention in hosting, all hosting providers will be added this variable. but localhost we have to that.

//const MONGODB_URI = "mongodb://localhost:27017/shop";
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-0bot6.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "session"
  // you can use 'expires'. but I don't specify expires. mongodb will expired.
});
const csrfProtection = csrf();

// https certificate
const privateKey = fs.readFileSync("server.key");
const certificate = fs.readFileSync("server.cert");

// multer configuring multer
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, +new Date() + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// template definition
app.set("view engine", "ejs");
app.set("views", "views");

// routes
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

// save as logging file
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
// flags: 'a' - append the element

app.use(helmet()); // securing for  headers
app.use(compression()); // compressing assets
app.use(morgan("combined", { stream: accessLogStream })); // logging request (that is logging bout incoming request )

// middlewares
app.use(bodyParser.urlencoded({ extended: false })); // urlencoded - text format data

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
//app.use(multer({ dest: "images" }).single("image")); // multipart from data
// multer().single('image') - Accept a single file with the name fieldName. The single file will be stored in req.file.
// dest - destination

app.use(express.static(path.join(__dirname, "public")));
//session middleware register
app.use("/images", express.static(path.join(__dirname, "images"))); // node js save as without '/images'
app.use(
  session({
    secret: "My secret", // this will be used for signing the hash which secretly stores our ID in the cookie.
    resave: false, // not be save every request
    saveUninitialized: false,
    //cookie: { maxAge, expires } // you can also set session cookie. (session's cookies belongs to authenticate user)
    store: store // mongodb store
  })
);

// register flush middleware
app.use(flush());

app.use((req, res, next) => {
  // 'res.locals' - this allows us to set local veritable that area passed into the views. local which simply means will only exist in the views which are rendered.
  res.locals.isAuthenticated = req.session.isLoggedIn;
  //res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  //throw new Error("Sync Error");
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      //throw new Error("Dummy Error");
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
      /* without throw for error. you want pass to next request. you can call next() method also.  */
    });
});

// it ignore the csrf token. therefore i have to put it app.js in the route.
app.post("/create-order", isAuth, shopController.postOrder);

app.use(csrfProtection);
app.use((req, res, next) => {
  //res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use("/500", errorController.get500);

app.use(errorController.get404);

// central error handing middleware
app.use((error, req, res, next) => {
  //res.redirect("/500");

  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn
  });
});

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(process.env.PORT || 3000);
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    //   .listen(process.env.PORT || 3000);
  })
  .catch(err => {
    console.log(err);
  });
