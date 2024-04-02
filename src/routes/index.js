const express = require('express');
const route = express.Router();
const auth = require('../middleware/authenticate');
const db = require("../middleware/db");

const { 
  invoiceHeaderByCompanyId
} = require('../controllers/invoice');

const { 
  getInvoiceTwoByCompanyId
} = require('../controllers/invoice02');




route.get('/', (req, res) => res.send("API RUNNING"));

// print invoice tempory
// harus di buat api routes sendiri !!
route.get('/invoice/header/print/:company_id/:invoice_id',
  invoiceHeaderByCompanyId
);

route.get('/invoice/detail/print/:company_id/:invoice_id',
  getInvoiceTwoByCompanyId
);

const { 
  summaryAmountInvoiceByCompanyId
} = require('../controllers/report');

route.post("/invoice/summary/total/:company_id",
  summaryAmountInvoiceByCompanyId
);

const mongoose = require('mongoose');

const closeMongoDBConnection = async (req, res, next) => {
  try {
    const connectionDB = req.user.database_connection;

    if (connectionDB) {
      await db(connectionDB).close()
      await mongoose.connection.close();
      console.log('Mongoose default connection closed successfully.');
    }

    next();
  } catch (error) {
    console.error('Error closing MongoDB connections:', error);
    next(error);
  }
};

route.use('/users', auth, require('./api/users'), closeMongoDBConnection);
route.use('/menu', auth, require('./api/menu'), closeMongoDBConnection);
route.use('/admin', auth, require('./api/admin'), closeMongoDBConnection);
route.use('/supplier', auth, require('./api/supplier'), closeMongoDBConnection);
route.use('/warehouse', auth, require('./api/warehouse'), closeMongoDBConnection);
route.use('/items', auth, require('./api/items'), closeMongoDBConnection);
route.use('/vehicle', auth, require('./api/vehicle'), closeMongoDBConnection);
route.use('/incoming_stock', auth, require('./api/incoming_stock'), closeMongoDBConnection);
route.use('/outgoing_stock', auth, require('./api/outgoing_stock'), closeMongoDBConnection);
route.use('/invoice', auth, require('./api/invoice'), closeMongoDBConnection);
route.use('/delivery_order', auth, require('./api/delivery_order'), closeMongoDBConnection);
route.use('/partner', auth, require('./api/partner'), closeMongoDBConnection);
route.use('/mobile', require('./api/user_mobile'));
route.use('/report', auth, require('./api/report'), closeMongoDBConnection);
route.use('/super_admin', auth, require('./api/super_admin'), closeMongoDBConnection);


route.use('/whats_app', require('./api/whats_app'));






module.exports = route;

