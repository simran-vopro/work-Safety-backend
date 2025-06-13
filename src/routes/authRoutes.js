const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { signupValidation, loginValidation } = require("../utils/validators/authValidator");

router.post("/signup",  signupValidation, authController.signUp);
router.post("/login", loginValidation, authController.login);

module.exports = router;