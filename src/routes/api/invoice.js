// package
const express = require('express');
const router = express.Router();


const { 
  addInvoice, 
  updateInvoice, 
  updateInvoiceV2, 
  updateUrutInvoice, 
  deleteInvoice, 
  GetInvoicev2, 
  GetInvoiceDo, 
  rejectInvoice, 
  getInvoiceDate, 
  getOutstandingInvoice,
  invoicePayment,
  invoicePaymentBulk
} = require('../../controllers/invoice');
const { 
  addInvoicetwo, 
  deleteInvoicetwo, 
  getInvoiceTwo 
} = require('../../controllers/invoice02');


/* 
  @route GET /invoice
  @desc Get data invoice
  @access public

*/
router.get('/',
GetInvoicev2
)


/* 
  @route GET /invoice/v2
  @desc Get data invoice
  @access public

*/
router.get('/v2',
  GetInvoicev2
)

/* 
  @route POST /invoice/create_invoice/
  @desc Post create invoice
  @access public

*/
router.post('/create_invoice',
  addInvoice
)

/* 
  @route POST /invoice/reject/:id
  @desc Post reject invoice
  @access public

*/
router.post("/reject/:id", 
  rejectInvoice
)


/* 
  @route PUT /invoice/update_invoice
  @desc Put update invoice
  @access public

*/
router.put('/update_invoice/:id',
  updateInvoice
)

/* 
  @route PUT /invoice/update_invoice/v2
  @desc Put update invoice
  @access public

*/
router.put('/update_invoice/v2/:id',
  updateInvoiceV2
)

/* 
  @route PUT /invoice/update_status_invoice
  @desc Put rubah no urut invoice
  @access public

*/
router.put('/update_status_invoice',
  updateUrutInvoice
)

/* 
  @route PUT /invoice/update_invoice
  @desc Put update invoice
  @access public

*/
router.delete('/delete_invoice/:id',
  deleteInvoice
)

/* 
  @route PUT /invoice/update_invoice
  @desc Put update invoice
  @access public

*/
router.put('/payment/bulk',
  invoicePaymentBulk
)


/* 
  @route POST /invoice/invoice_two
  @desc create invoice two
  @access public

*/
router.get("/invoice_two",
  getInvoiceTwo
)


/* 
  @route POST /invoice/create_invoice_two
  @desc create invoice two
  @access public

*/

router.post('/create_invoice_two',
  addInvoicetwo
)



/* 
  @route DELETE /invoice/delete_invoice_two/:id
  @desc hapus data invoice two
  @access public

*/

router.delete('/delete_invoice_two/:id',
  deleteInvoicetwo
)

/* 
  @route GET /invoice/outstanding
  @desc Get data invoice outstanding
  @access public

*/
router.get('/outstanding', 
  getOutstandingInvoice
)

/* 
  @route GET /invoice/outstanding
  @desc Get data invoice outstanding
  @access public

*/
router.put('/outstanding/payment/:id', 
invoicePayment
)


/* 
  @route GET /invoice/status_do
  @desc Get data invoice
  @access public

*/
router.get('/status_do',
  GetInvoiceDo
)

router.get('show_invoice/:date_from/:date_to',
    getInvoiceDate
);




module.exports = router;


