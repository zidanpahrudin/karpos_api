// package
const express = require('express');
const router = express.Router();
const cache = require("../../middleware/cache");

// middleware
const { 
  validate, 
  addMenuValidation 
} = require('../../middleware/validate');

// controller
const { 
  addMenu, 
  getMenu, 
  updateMenu, 
  deleteMenu 
} = require('../../controllers/menu');



/* 
  @route GET menu
  @desc Get menu
  @access public

*/
router.get('/',
    cache(3600),
    // authenticate,
    getMenu
)

/* 
  @route POST menu/addMenu
  @desc adding menu
  @access public

*/
router.post('/addMenu',
    // authenticate,
    addMenuValidation(),
    validate,
    addMenu
);


/* 
  @route POST menu/updateMenu/:id
  @desc update menu
  @access public

*/
router.put('/updateMenu/:id',
    // authenticate,
    updateMenu
);

/* 
  @route POST menu/updateMenu/:id
  @desc update menu
  @access public

*/
router.put('/deleteMenu/:id',
    // authenticate,
    deleteMenu
);




module.exports = router;
