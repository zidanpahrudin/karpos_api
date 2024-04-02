const { Schema, model, createConnection } = require('mongoose');

const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnPo01Schema = new Schema({
    pp_no: {
        type: String,
    },
    pp_date: {
        type: Date,
    },
    supplier_id: {
        type: ObjectId,
    },
    supplier_name: {    
        type: String,
    },
    payment_type: {
        type: Number,
    },
    grand_total: {
        type: Double,
    },
    is_active: {
        type: Number,
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
    { collection: 'trn_po_payment_01', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('trn_po_payment_01', TrnPo01Schema);
}
