// package
const express = require('express');
const router = express.Router();

// controller
const { 
  OutgoingStock01, 
  getOutgoingStock01, 
  getDetailOutgoingStock01, 
  updateOutgoingStock01, 
  deleteOutgoingStock01, 
  rejectOutgoingStock01 
} = require("../../controllers/outgoing_stock01");
const { 
  OutgoingStock02, 
  deleteOutgoingStock02, 
  getOutgoingStock02, 
  getOutgoingStock02Detail 
} = require("../../controllers/outgoing_stock02");


/* 
  @route POST outgoing_stock/
  @desc Post add outgoing_stock01
  @access public

*/

router.post("/",
    OutgoingStock01
)


/* 
  @route POST outgoing_stock/reject
  @desc reject outgoing stock
  @access public

*/

router.post("/reject/:id",
    rejectOutgoingStock01
)


/* 
  @route GET outgoing_stock/
  @desc Get get outgoing_stock01
  @access public

*/

router.get("/",
    getOutgoingStock01
)

/* 
  @route GET detail_outgoing_stock/:id
  @desc Get get detail outgoing_stock01
  @access public

*/

router.get("/detail_outgoing_stock/:id",
  getDetailOutgoingStock01
)


/* 
  @route PUT outgoing_stock/
  @desc Put update outgoing_stock01
  @access public

*/

router.put("/:id",
    updateOutgoingStock01
)

/* 
  @route DELETE outgoing_stock/
  @desc delete hapus outgoing_stock01
  @access public

*/

router.delete("/:id",
    deleteOutgoingStock01
)

/* 
  @route POST outgoing_stock_two/outgoing_stock_two
  @desc post add outgoing_stock02
  @access public

*/

router.post("/outgoing_stock_two",
  OutgoingStock02
)

router.get("/outgoing_stock_two",
  getOutgoingStock02
)


router.get("/detail_outgoing_stock_two/:id",
  getOutgoingStock02Detail
)



router.delete("/outgoing_stock_two/:id",
  deleteOutgoingStock02
)



module.exports = router;