const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const upload = require("../utils/uploadBanner");

router.post("/add", upload.single("banner"), bannerController.addBanner);
router.get("/", bannerController.getBanners);
router.put("/:id", bannerController.updateBanner);
router.delete("/:id", bannerController.deleteBanner);


router.get('/getFloatingBanner', bannerController.getBanner);
router.post('/addFloatingBanner', upload.single("banner"), bannerController.createBanner);
router.put('/updateFloatingBanner/:id', upload.single("banner"), bannerController.updateFloatingBanner);

module.exports = router;

