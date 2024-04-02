// package
const express = require('express');
const router = express.Router();
const cache = require("../../middleware/cache");

// middleware
const { 
  validate, 
  userValidation, 
  loginValidation, 
  addCustomerValidation 
} = require('../../middleware/validate');

// controller
const {
  getUsers, 
  addCustomer,
  UpdateCustomer, 
  DeleteCustomer, 
  changePassword 
} = require('../../controllers/user');
const auth = require('../../controllers/auth');


/* 
  @route GET api/users?type&id
  @desc Get all users
  @access public

*/
router.get('/',
  // cache(3600),
  getUsers
);

/* 
  @route POST api/users
  @desc Post add customer 
  @access public

*/
router.post('/',
  addCustomerValidation(),
  validate,
  addCustomer
);

/* 
  @route PUT api/users/?type/:id
  @desc Put edit customer 
  @access public

*/
router.put('/:id',
  // authenticate,
  UpdateCustomer
);


/* 
  @route DELETE api/users/customer/:id
  @desc Delete customer 
  @access public

*/
router.delete('/customer/:id',
  //  authenticate,
  DeleteCustomer
);


/* 
  @route POST api/users/register
  @desc register users
  @access public

*/
router.post('/register',
  userValidation(),
  validate,
  auth.register
);

/* 
  @route POST api/users/login
  @desc register users
  @access public

*/
router.post('/login',
  loginValidation(),
  validate,
  auth.login
);


router.post('/login/v2',
  loginValidation(),
  validate,
  auth.loginv2
);

/* 
  @route POST api/users/login/mobile
  @desc register users mobile
  @access public

*/
router.post('/login/mobile',
  loginValidation(),
  validate,
  auth.loginMobile
);


/* 
  @route POST api/users/change_password
  @desc register users
  @access public

*/
router.put("/change_password", 
  changePassword
)


module.exports = router;

