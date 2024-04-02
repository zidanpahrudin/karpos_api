const mongoose = require('mongoose');
const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;

const TrnInvoice02Schema = new Schema({
    inv_id: {
        type: ObjectId
    },
    items_id: {
        type: ObjectId
    },
    price: {
        type: Double
    },
    qty: {
        type: Number
    },
    status_item_debt: {
        type: String
    },
    qty_item_given: {
        type: Number,
    },
    disc_percent: {
        type: Double
    },
    disc_value: {
        type: Double
    },
    subtotal: {
        type: Double
    },
    remarks: {
        type: String
    }

},
    { collection: 'trn_invoice_02', timestamps: true }
);

TrnInvoice02Schema.index({inv_id: 1} );

module.exports = (conn) => {
   
    return conn.model('trn_invoice_02', TrnInvoice02Schema);
}
