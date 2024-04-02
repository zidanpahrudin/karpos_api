// package
const express = require('express');
const router = express.Router();

// middleware
const authenticateMobile = require('../../middleware/authenticateMobile');

// controller
const {
  getdo02,
  createDeliveryOrderv2 
} = require("../../controllers/deliveryOrder02");
const { 
  addTrnDo01,
  getTrnDo01,
  getTrnDo01v2,
  deleteTrnDo01,
  getDoInMobile,
  rejectDo, 
  returnStockDov2, 
  updateTrnDo01, 
  getReturnStockDo, 
  updateDoHeader 
} = require("../../controllers/deliveryOrder");


/* 
  @route POST delivery_order/
  @desc mendapatkan semua data delivery order
  @access public

*/
router.get(
  "/",
  getTrnDo01
)

/* 
  @route POST delivery_order/v2
  @desc mendapatkan semua data delivery order
  @access public

*/
router.get(
  "/v2",
  getTrnDo01v2
)

/* 
  @route  PUT delivery_order/update/:id
  @desc   update delivery order header
  @access public
*/
router.put(
  "/update/:id",
  updateDoHeader
)

/* 
  @route GET delivery_order/stock_return/:id
  @desc update sisa stock delivery order
  @access public

*/
router.get(
  "/stock_return/:id",
  returnStockDov2
)

/* 
  @route  GET delivery_order/stock_return_v2/:id
  @desc   update sisa stock delivery order
  @access public
*/
router.get(
  "/stock_return_v2/:id",
  returnStockDov2
)

router.get(
  "/mobile/detail",
  authenticateMobile,
  getDoInMobile
)

router.get(
  "/detailDo/:id",
  getTrnDo01
)

router.delete(
  "/deleteDo/:id",
  deleteTrnDo01
)

router.post(
  "/createDo",
  addTrnDo01
)

router.post(
  "/reject/:id",
  rejectDo
)

router.post(
  "/createDoTwo",
  createDeliveryOrderv2
)

router.get(
  "/delivery_order_two",
  getdo02
)

/* 
  @route  PUT delivery_order/partner?is_deliver
  @desc   update order agar di antar oleh partner
  @access public
*/
router.put(
  "/partner",
  updateTrnDo01
)

/* 
  @route POST delivery_order/sisa_stock/detail
  @desc mendapatkan invoice
  @access public
*/

router.get(
  "/sisa_stock/:id",
  getReturnStockDo
)

router.post(
  "/delivery_order_v2",
  createDeliveryOrderv2
)



module.exports = router;