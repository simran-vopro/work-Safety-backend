const express = require("express");
const router = express.Router();
const upload = require("../utils/uploadBanner");
const queryController = require("../controllers/userQueriesController");
const { validateQuery } = require("../utils/validators/queryValidator");

router.post("/send-query", upload.single("document"), validateQuery, queryController.submitQuery);

module.exports = router;
