const router = require("express").Router();
const {
    listCompany
} = require("../../controllers/company");


router.get("/list", listCompany);



module.exports = router;