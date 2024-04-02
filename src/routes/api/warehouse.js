// package
const express = require('express');
const router = express.Router();

// middleware
const validates = require("../../middleware/validates/index");
const {
  warehouseId
} = require("../../middleware/validates/schema/warehouse.schema");

// constroller
const {
  getWarehouse,
  addWarehouse,
  updateWarehouse,
  deleteWarehouse 
} = require('../../controllers/warehouse');
const { 
  getStockByWarehouse
} = require('../../controllers/trn_stock');




/**
 * api mendapatkan semua warehouse dan warehouse by id.
 *
 * @route   - /warehouse
 * @method  - GET
 * @access public
 */
router.get(
    '/',
    validates(warehouseId),
    getWarehouse
);

/* 
  @route POST api/warehouse
  @desc post warehouse
  @access public

*/
router.post(
    '/',
    addWarehouse
);

/* 
  @route PUT api/warehouse/id
  @desc Update warehouse
  @access public

*/
router.put(
  '/:id',
  updateWarehouse
);

/* 
  @route DELETE api/warehouse/:id
  @desc Delete warehouse
  @access public

*/
router.delete(
  '/:id',
  validates(warehouseId),
  deleteWarehouse
);


router.get(
  "/stock_warehouse/:id", 
  getStockByWarehouse
)


module.exports = router;