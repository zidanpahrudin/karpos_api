// package
const express = require('express');
const router = express.Router();

// middleware
const upload = require('../../middleware/upload');

// controller
const { 
  addIncomingStock01, 
  getIncomingStock01, 
  deleteIncomingStock01, 
  rejectIncomingStock01
} = require('../../controllers/incoming_stock');
const {
  addIncomingStock02, 
  getIncomingStock02, 
  deleteIncomingStock02 
} = require('../../controllers/incoming_stock02');

/* 
  @route POST incoming_stock/
  @desc Post add incoming stock 01
  @access public

*/
router.get('/',
    getIncomingStock01
)

router.post('/',
    upload.send,
    addIncomingStock01
)

router.put("/reject/:id",
  rejectIncomingStock01
)



/* 
  @route GET incoming_stock/:id
  @desc Get get incoming stock 01 by id
  @access public

*/
router.get('/detail_incoming_stock/:id',
    getIncomingStock01
)

/* 
  @route delete incoming_stock/:id
  @desc Delete remove incoming stock 01 by id
  @access public

*/

router.delete('/:id',
    deleteIncomingStock01
)

// reject 

/* 
  @route POST incoming_stock/incoming_stock_two
  @desc Post add incoming stock 02
  @access public

*/
router.post('/incoming_stock_two',
    addIncomingStock02
)

/* 
  @route GET incoming_stock/incoming_stock_two
  @desc Get get incoming stock 02 by id
  @access public

*/
router.get('/incoming_stock_two',
    getIncomingStock02
)


/* 
  @route GET incoming_stock/incoming_stock_two/:id
  @desc Get get incoming stock 02 by id
  @access public

*/
router.get('/detail_incoming_stock_two/:id',
    getIncomingStock02
)


/* 
  @route GET incoming_stock/incoming_stock_two/:id
  @desc Get get incoming stock 02 by id
  @access public

*/
router.delete('/incoming_stock_two/:id',
    deleteIncomingStock02
)

/* 
  @route POST incoming_stock/stock_history
  @desc Post add stock history
  @access public

*/
// router.post('/stock_history',
//     addStockHistory
// )







module.exports = router;

