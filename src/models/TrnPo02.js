const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnPo02Schema = new Schema({
    po_id: {
        type: ObjectId,
    },
    items_id: {
        type: ObjectId,
    },
    items_name: {
        type: String
    },
    qty: {
        type: Number
    },
    price: {
        type: Double
    },
    disc_percent: {
        type: String
    },
    disc_value: {
        type: String
    },
    subtotal: {
        type: Double
    },
    remarks: {
        type: String
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
        type: String,
    },
    edit_time: {
        type: Date,
        default: localDate
    }


},
    { collection: 'trn_po_02', timestamps: true }
);

module.exports = (conn) => {
    const conn = createConnection(url,{ maxPoolSize: 10 });
    return conn.model('trn_po_02', TrnPo02Schema);
}
