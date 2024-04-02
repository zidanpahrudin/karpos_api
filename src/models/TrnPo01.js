const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnPo01Schema = new Schema({
    po_no: {
        type: String,
        required: true
    },
    po_date: {
        type: Date
    },
    requester: {
        type: String
    },
    supplier_id: {
        type: ObjectId,
        required: true,
    },
    supplier_name: {
        type: String
    },
    delivery_addres: {
        type: String
    },
    remarks: {
        type: String
    },
    po_status: {
        type: String
    },
    payment_status: {
        type: String
    },
    disc_percent: {
        type: String
    },
    disc_value: {
        type: String
    },
    total: {
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
    {collection: 'trn_po_01', timestamps: true}
);

module.exports = (conn) => {
   
    return conn.model('trn_po_01', TrnPo01Schema);
}
