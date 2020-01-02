const express = require("express");
const { check, body } = require("express-validator/check");
//const { check, validationResult, cookie, body, param, query } = require("express-validator/check");
// express-validator/check - it has all validation login could want to add
// and we imported check function. you can import many function like 'validationResult'. and so on.

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      // sanitizing data
      .normalizeEmail(),
    body("password", "Password has to be valid.")
      .isLength({ min: 5 })
      .isAlphanumeric()
      // sanitizing data
      .trim()
  ],
  authController.getLogin
);

router.get("/signup", authController.getSignup);

router.get("/reset", authController.getReset);

router.post("/login", authController.postLogin);

//router.post("/signup", check("email").isEmail(), authController.postSignup); //check has default error message
//router.post("/signup", check("email").isEmail().withMessage('Email address is invalid format').isAlphanumeric(), authController.postSignup);

/* You can use to call check() method many time. you cal also define array inside of check() methods like [check(), check()]. but that's optional you can use to add , septate also.  */

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a value email.")

      // custom() - it means custom validator
      .custom((value, { req }) => {
        /* if (value === "test@test.com") {
          throw new Error("This email address if forbidden.");
        }
        return true; */
        // otherwise true

        // this async validation
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject(
              "E-Mail exists already, please pick a different one."
            );
          }
        });
      })
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password with only numbers and text and at least 5 - 20 characters."
    )
      .isLength({ min: 5, max: 20 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords have to match!");
        }
        return true;
      })
      .trim()
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
