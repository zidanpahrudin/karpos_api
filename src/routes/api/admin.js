// package
const express = require('express');
const router = express.Router();
const cache = require("../../middleware/cache");

// middleware
const validates = require("../../middleware/validates/index");
const {
  menuPermissionSchema
} = require("../../middleware/validates/schema/auth.schema");
const { 
  validate,
  MenuUserValidation
} = require('../../middleware/validate');
const {
  menuUserSchema
} = require("../../middleware/validates/schema/admin.schema");

// controller
const { 
  AddmenuUser,
  getMenuUser,
  getMenuUserById,
  updateMenu,
  deleteAccessUser
} = require('../../controllers/user');
const { getStock } = require('../../controllers/trn_stock');
const { menuPermission } = require('../../controllers/auth');
const auth = require('../../middleware/authenticate');

/**
 * api mendapatkan akses menu user.
 *
 * @route   - admin/permisson_menu/:user_id
 * @method  - GET
 * @access public
 */
router.get(
  '/permission_menu/:id',
  validates(menuPermissionSchema),
  menuPermission
)

/**
 * api mendapatkan semua user akses.
 *
 * @route   - admin/user_menu
 * @method  - GET
 * @access public
 */
router.get(
  '/user_menu',
  getMenuUser
);

/**
 * api mendapatkan semua user akses.
 *
 * @route   - admin/user_menu
 * @method  - GET
 * @access public
 */

/**
 * api mendapatkan user akses by user id.
 *
 * @route   - admin/user_menu/:id
 * @method  - GET
 * @access public
 */
router.get(
  '/user_menu/:id',
  validates(menuUserSchema),
  // cache(3600),
  getMenuUserById
);


/* 
  @route POST admin/user_menu/:id
  @desc register users
  @access public

*/
router.post(
  '/user_menu/:id',
  // authenticate,
  MenuUserValidation(),
  validate,
  AddmenuUser
);

/* 
  @route PUT admin/user_menu/:id
  @desc Update menu permission
  @access public

*/
router.put('/user_menu/:id',
  updateMenu
);

/* 
  @route PUT admin/user_menu/:id
  @desc delete user permmison
  @access public

*/
router.delete('/user_menu/:id',
  deleteAccessUser
);

/* 
  @route PUT admin/stock
  @desc delete user permmison
  @access public

*/
router.post('/stock',
  getStock
);



module.exports = router;
