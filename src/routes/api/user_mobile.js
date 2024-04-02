// package
const express = require('express');
const router = express.Router();
const forms = require("multer");

// middleware
const authenticateMobile = require('../../middleware/authenticateMobile');
const { 
    validate
} = require('../../middleware/validate');
const validates = require("../../middleware/validates/index");
const {
    user_login
} = require("../../middleware/validates/schema/auth.schema")
const { 
    partnerPict 
} = require("../../middleware/upload");

// controller
const auth = require('../../controllers/auth');
const { 
    getDoInMobile, 
    getDoQtyMobile, 
    searchItems, 
    listDoMobile, 
    searchDoMobile, 
    searchItemsImage
} = require("../../controllers/deliveryOrderMobile");
const { 
    updateInvoiceTwo 
} = require("../../controllers/invoice02Mobile");
const { 
    addInvoiceMobileOfflineV4,
    getInvoiceMobilev2, 
    addInvoiceMobile, 
    PaymentInvoice, 
    rejectInvoiceMobile 
} = require("../../controllers/invoiceMobile");
const {
    mobileGetProfile, 
    changePassword, 
    mobilePartnerUpdatev2 
} = require("../../controllers/partner");
const { 
    addReturStock, 
    outgoingReturStock, 
    getListReturStock 
} = require("../../controllers/returMobile");
const { 
    getItemDebtMobile, 
    updateDebtMobile 
} = require("../../controllers/items_debt");

const connectionManager = require("../../middleware/db");

/**
 * api login driver.
 *
 * @route   - mobile/login
 * @method  - POST
 * @access public
 */
router.post(
    "/login",
//    validates(user_login),
//    validate,
    forms().array(),
    auth.loginMobileV2
)

router.post(
    "/delivery_order",
    authenticateMobile,
    getDoQtyMobile
)

router.post(
    "/return_items",
    authenticateMobile,
    forms().array(),
    addReturStock
)

/**
 * api search return items dengan nama customer.
 *
 * @route   - mobile/return_items/search
 * @method  - POST
 * @access private
 */
router.post(
    "/return_items/search",
    authenticateMobile,
    forms().array(),
    searchDoMobile
)

router.post(
    "/return_out_items",
    authenticateMobile,
    forms().array(),
    outgoingReturStock
)

router.get(
    "/return_out_items/list", 
    authenticateMobile, 
    async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        // models
        const TrnReturIn = require('../../models/TrnReturIn')(connectionManager.getConnection(connectionDB));
        const MstItems = require('../../models/MstItems')(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require('../../models/TrnInvoice01')(connectionManager.getConnection(connectionDB));
        const MstCustomer = require('../../models/MstCustomer')(connectionManager.getConnection(connectionDB));
        let trn_retur_out = await TrnReturIn.find({partner_id: req.user.id, status: "Process"}).lean();
        let result = []
        for await (const retur_out of trn_retur_out) {
            const objResult = {}
            const item = await MstItems.findById(retur_out.items_id).lean()
            const trn_invoice_01 = await TrnInvoice01.findOne({invoice_no: retur_out.invoice_no}).lean()
            const customer = await MstCustomer.findById(trn_invoice_01.customer_id).lean()
            objResult.invoice_no = retur_out.invoice_no
            objResult.return_no = retur_out.retur_no
            objResult.customer_name =  retur_out.customer_name
            objResult.address =  trn_invoice_01.alamat ? trn_invoice_01.alamat : customer.address
            objResult.items_id = retur_out.items_id
            objResult.items_name = item.items_name
            objResult.retur_qty = retur_out.qty
            objResult.invoice_qty =  retur_out.qty_payment.toString()
            
            result.push(objResult)
        }

        return res.json({
            status: "success",
            message: "return items berhasil di dapat",
            data: result
        })
    } catch (err) {
        return res.json({ status: 'failed', message: 'server error : ' + err.message, data: [] })
    }
})

router.get(
    "/return_in_items/list", 
    authenticateMobile, 
    async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        // models
        const TrnReturIn = require('../../models/TrnReturIn')(connectionManager.getConnection(connectionDB));
        const MstItems = require('../../models/MstItems')(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require('../../models/TrnInvoice01')(connectionManager.getConnection(connectionDB));
        const MstCustomer = require('../../models/MstCustomer')(connectionManager.getConnection(connectionDB));
        let trn_retur_in = await TrnReturIn.find({partner_id: req.user.id}).lean();
        let result = []
        for await (const retur_in of trn_retur_in) {
            const objResult = {}
            
            
            const item = await MstItems.findById(retur_in.items_id).lean()
            const trn_invoice_01 = await TrnInvoice01.findOne({invoice_no: retur_in.invoice_no}).lean()
            const customer = await MstCustomer.findById(trn_invoice_01.customer_id).lean()

            objResult.invoice_no = retur_in.invoice_no
            objResult.return_no = retur_in.retur_no
            objResult.customer_name =  retur_in.customer_name
            objResult.address =  trn_invoice_01.alamat ? trn_invoice_01.alamat : customer.address
            objResult.items_id = retur_in.items_id
            objResult.items_name = item.items_name
            objResult.retur_qty = retur_in.qty
            objResult.invoice_qty =  retur_in.qty_payment.toString()

            result.push(objResult)
        }
        return res.json({
            status: "success",
            message: "return items berhasil di dapat",
            data: result
        })
    } catch (err) {
        return res.json({ status: 'failed', message: 'server error : ' + err.message, data: [] })
    }
})

router.post(
    "/return_out_items/search",
    authenticateMobile,
    forms().array(),
    getListReturStock
)

router.post(
    "/delivery_order/list",
    authenticateMobile,
    forms().array(),
    listDoMobile
)

router.post(
    "/qty_do",
    authenticateMobile,
    getDoQtyMobile
)

router.post(
    "/invoice",
    authenticateMobile,
    forms().array(),
    getInvoiceMobilev2
)

router.post(
    "/invoice/create",
    authenticateMobile,
    forms().array(),
    addInvoiceMobile
)

router.post(
    "/invoice/create/offline/v3",
    authenticateMobile,
    forms().array(),
    addInvoiceMobileOfflineV4
)

router.post(
    "/invoice/reject/:id",
    authenticateMobile,
    forms().array(),
    rejectInvoiceMobile
)

router.post(
    "/invoice/edit/invoice_detail_qty",
    authenticateMobile,
    forms().array(),
    updateInvoiceTwo
)

/**
 * api bayar invoice.
 *
 * @route   - mobile/invoice/payment
 * @method  - POST
 * @access private
 */
router.post(
    "/invoice/payment",
    authenticateMobile,
    forms().array(),
    PaymentInvoice
)

router.post(
    "/delivery_order_detail",
    authenticateMobile,
    getDoInMobile
)


router.post(
    "/gallon/min", 
    authenticateMobile,
    forms().array(),
    updateDebtMobile
)

router.get(
    "/gallon/list/min",
    authenticateMobile,
    getItemDebtMobile
)

/* 
  @route GET /items/list
  @desc Get all items
  @access public

*/

router.post(
    "/item/list",
    authenticateMobile,
    forms().array(),
    searchItems
);

/**
 * api bayar invoice.
 *
 * @route   - mobile/item/listimage
 * @method  - GET
 * @access private
 */
router.get(
    "/item/listimage",
    authenticateMobile,
    forms().array(),
    searchItemsImage
);


router.get(
    "/partner/profile/me",
    authenticateMobile,
    mobileGetProfile
)

router.post(
    "/partner/profile",
    authenticateMobile,
    partnerPict,
    mobilePartnerUpdatev2
)

/**
 * api merubah password driver.
 *
 * @route   - mobile/partner/change_password
 * @method  - POST
 * @access private
 */
router.post(
    "/partner/change_password",
    authenticateMobile,
    forms().array(),
    changePassword
)



module.exports = router;