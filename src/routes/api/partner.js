// package
const express = require('express');
const router = express.Router();

// controller
const { 
  getPartner, 
  addPartner, 
  updatePartner, 
  deletePartner 
} = require('../../controllers/partner');


/* 
  @route GET partner
  @desc Get all partner
  @access public

*/
router.get('/',
    getPartner
);


/* 
  @route GET partner/detail
  @desc mendapatkan detail partner
  @access public

*/
router.get('/detail/:id',
    getPartner
);

/* 
  @route POST partner/addPartner
  @desc menambahkan partner
  @access public

*/
router.post(
    '/addPartner',
    addPartner
);

/* 
  @route PUT partner/update/:id
  @desc mengupdate partner
  @access public

*/
router.put('/update/:id',
    updatePartner
);

/* 
  @route PUT partner/delete/:id
  @desc Get all supplier
  @access public

*/
router.put('/delete/:id',
    deletePartner
);



module.exports = router;