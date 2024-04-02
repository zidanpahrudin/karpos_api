const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnInvoicePayment01Schema = new Schema({
    ip_id: {
        type: ObjectId
    },
    ip_no: {
        type: String
    },
    ip_date: {
        type: Date
    },
    customer_id: {
        type: ObjectId
    },
    customer_name: {
        type: String
    },
    payment_type: {
        type: String
    },
    grand_total: {
        type: Double
    },
    is_active: {
        type: Number
    },
    pic_input: {
        type: String
    },
    input_time: {
        type: Date,
        default: localDate
    },
    pic_edit: {
        type: String
    },
    edit_time: {
        type: Date,
        default: localDate
    }
},
    { collection: 'trn_invoice_payment_01', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('trn_invoice_payment_01', TrnInvoicePayment01Schema);
}
