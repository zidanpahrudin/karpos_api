// package
const express = require('express');
const router = express.Router();

// controller
const { 
  getItems, 
  addItems, 
  updateItems, 
  deleteItems 
} = require('../../controllers/items');
const { 
  getItemsKind, 
  addItemsKind, 
  updateItemsKind, 
  deleteItemsKind 
} = require('../../controllers/items_kind');
const { 
  getItemsCategory, 
  addItemsCategory, 
  updateItemsCategory, 
  deleteItemsCategory 
} = require('../../controllers/items_category');
const { 
  getItemsUnit, 
  addItemsUnit, 
  updateItemsUnit, 
  deleteItemsUnit 
} = require('../../controllers/items_unit');

/* 
  @route GET /items
  @desc Get all items
  @access public

*/
router.get('/',
  getItems
);


/**
 * api create items.
 *
 * @route   - items/
 * @method  - POST
 * @access public
 */
router.post('/',
  addItems
);

/* 
  @route PUT api/items/id
  @desc Update items
  @access public

*/
router.put('/:id',
  updateItems
);

/* 
  @route PUT delete_items/id
  @desc Delete items
  @access public

*/
router.delete('/:id',
  deleteItems
);

/* 
  @route GET items/kind
  @desc Get all items
  @access public

*/
router.get('/kind',
  getItemsKind
);

/* 
  @route POST items/kind
  @desc post items
  @access public

*/
router.post('/kind',
  addItemsKind
);

/* 
  @route PUT items/kind/id
  @desc Update items
  @access public

*/
router.put('/kind/:id',
  updateItemsKind
);

/* 
  @route PUT items/kind/id
  @desc Delete items
  @access public

*/
router.delete('/kind/:id',
  deleteItemsKind
);


/* 
  @route GET items/category
  @desc Get all items
  @access public

*/
router.get('/category',
  getItemsCategory
);

/* 
  @route POST items/category
  @desc post items
  @access public

*/
router.post('/category',
addItemsCategory
);

/* 
  @route PUT items/category/:id
  @desc Update items
  @access public

*/
router.put('/category/:id',
updateItemsCategory
);

/* 
  @route PUT items/category/:id
  @desc Delete items
  @access public

*/
router.delete('/category/:id',
  deleteItemsCategory
);


/* 
  @route GET items/unit
  @desc Get all items
  @access public

*/
router.get('/unit',
  getItemsUnit
);

/* 
  @route POST items/unit
  @desc post items
  @access public

*/
router.post('/unit',
addItemsUnit
);

/* 
  @route PUT items/unit/:id
  @desc Update items
  @access public

*/
router.put('/unit/:id',
updateItemsUnit
);

/* 
  @route PUT items/category/:id
  @desc Delete items
  @access public

*/
router.delete('/unit/:id',
  deleteItemsUnit
);





module.exports = router;