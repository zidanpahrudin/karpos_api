const router = require("express").Router();
const {
    loginMobileV2,
    loginv2,
    logout
} = require("../../controllers/auth");

const {
    listCompany
} = require("../../controllers/company");


router.get("/list", listCompany);
router.post("/mobile/login", loginMobileV2);
router.post("/web/login", loginv2);
router.post("/web/logout", logout);



module.exports = router;