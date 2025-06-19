const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { signupValidation, loginValidation } = require("../utils/validators/authValidator");
const auth = require("../middlewares/auth");

router.post("/signup", signupValidation, authController.signUp);
router.post("/login", loginValidation, authController.login);
router.put("/edit", auth, authController.editUser);
router.put("/change-password", auth, authController.changePassword);

module.exports = router;