// package
const express = require('express');
const router = express.Router();

// controller
const { 
  getSupplier,
  addSupplier,
  updateSupplier,
  deleteSupplier 
} = require('../../controllers/supplier');


/* 
  @route GET api/supplier
  @desc Get all supplier
  @access public

*/
router.get('/',
  getSupplier
);

/* 
  @route POST api/supplier
  @desc post supplier
  @access public

*/
router.post('/',
  addSupplier
);

/* 
  @route PUT api/supplier/id
  @desc Update supplier
  @access public

*/
router.put('/:id',
  updateSupplier
);

/* 
  @route GET api/supplier
  @desc Get all supplier
  @access public

*/
router.put('/delete_supplier/:id',
deleteSupplier
);



module.exports = router;