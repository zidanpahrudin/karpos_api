// package
const express = require('express');
const router = express.Router();

// controller
const {
  reportInvoice, 
  reportInvoiceDetail, 
  reportReturStock, 
  reportGallon,
  reportStock,
  reportInvoiceHeaderDetail,
  summaryAmountInvoice,
  summaryAmountInvoiceByStatus,
  summaryTotalInvoice,
  summaryInvoiceNetProfit,
  summaryAmountInvoiceByCompanyId
} = require("../../controllers/report");
const { 
  getHistoryStock 
} = require("../../controllers/trn_stock");




/* 
  @route POST report/invoice
  @desc mendapatkan invoice
  @access public
*/

router.post("/invoice",
    reportInvoice
);

/* 
  @route POST report/galon/kosong
  @desc mendapatkan report galon kosong
  @access public
*/

router.post("/invoice/summary",
  summaryAmountInvoice
);

/* 
  @route POST report/galon/kosong
  @desc mendapatkan report galon kosong
  @access public
*/

router.post("/invoice/summary/total",
  summaryTotalInvoice
);



/* 
  @route POST report/galon/kosong
  @desc mendapatkan report galon kosong
  @access public
*/

router.post("/invoice/summary/status",
  summaryAmountInvoiceByStatus
);

/* 
  @route POST report/galon/kosong
  @desc mendapatkan report galon kosong
  @access public
*/

router.post("/invoice/summary/profit",
  summaryInvoiceNetProfit
);


/* 
  @route POST report/invoice/detail
  @desc mendapatkan invoice
  @access public
*/

router.post("/invoice/detail",
    reportInvoiceDetail
)

/* 
  @route POST report/invoice
  @desc mendapatkan invoice
  @access public
*/

router.post("/invoice/header/detail",
reportInvoiceHeaderDetail
)


/* 
  @route POST report/invoice/detail
  @desc mendapatkan invoice
  @access public
*/

router.post("/stock/history", 
getHistoryStock
)

/* 
  @route POST report/stock/retur
  @desc mendapatkan report retur stock
  @access public
*/

router.post("/stock/retur", 
reportReturStock
)

/* 
  @route POST report/galon/kosong
  @desc mendapatkan report galon kosong
  @access public
*/

router.post("/stock/galon/kosong",
  reportGallon
)

/* 
  @route POST report/galon/kosong
  @desc mendapatkan report galon kosong
  @access public
*/

router.post("/stock/dashboard",
  reportStock
);






module.exports = router;