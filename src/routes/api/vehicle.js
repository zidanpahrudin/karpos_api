// package
const express = require('express');
const router = express.Router();

// controller
const {
  getVehicle,
  addVehicle,
  updateVehicle,
  deleteVehicle 
} = require('../../controllers/vehicle');


/* 
  @route GET /warehouse
  @desc Get all warehouse
  @access public

*/
router.get('/',
    getVehicle
);

/* 
  @route POST api/warehouse
  @desc post warehouse
  @access public

*/
router.post('/',
addVehicle
);

/* 
  @route PUT api/warehouse/id
  @desc Update warehouse
  @access public

*/
router.put('/:id',
updateVehicle
);

/* 
  @route DELETE api/warehouse/:id
  @desc Delete warehouse
  @access public

*/
router.delete('/:id',
deleteVehicle
);



module.exports = router;