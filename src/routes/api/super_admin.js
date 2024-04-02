const express = require('express');
const router = express.Router();
const {
    registerAdmin,
    registerPT,
    getList
} = require("../../controllers/super_admin");
const upload = require("../../middleware/upload");



/**
 * api mendapatkan list PT dan admin.
 *
 * @route   - /super_admin
 * @param   {pt, admin, search}
 * @method  - GET
 * @access private
 */
router.get(
    "/",
    getList
)


/**
 * api super admin mendaftarkan admin.
 *
 * @route   - super_admin/register_admin
 * @method  - POST
 * @access private
 */
router.post(
    "/register_admin", 
    registerAdmin
)

/**
 * api super admin mendaftarkan admin.
 *
 * @route   - super_admin/register_pt
 * @method  - POST
 * @access private
 */
router.post(
    "/register_pt",
    upload.logoPict,
    registerPT
)

module.exports = router;