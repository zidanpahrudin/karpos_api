const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnInvoicePayment02Schema = new Schema({
    ip_id: {
        type: ObjectId
    },
    invoice_id: {
        type: ObjectId
    },
    invoice_no: {
        type: String
    },
    amount: {
        type: Double
    },
    disc_percent: {
        type: Double
    },
    disc_value: {
        type: Double
    },
    total: {
        type: Double
    },
    is_active: {
        type: Number
    }
},
    { collection: 'trn_invoice_payment_02', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('trn_invoice_payment_02', TrnInvoicePayment02Schema);
}