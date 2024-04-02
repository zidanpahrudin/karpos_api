const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnDebtItemsSchema = new Schema({
    debtItems_no: {
        type: String
    },
    inv_no: {
        type: String
    },
    partner_id: {
        type: ObjectId
    },
    items_id: {
        type: ObjectId
    },
    qty_barang_terima: {
        type: Number
    },
    qty_barang_invoice: {
        type: Number
    },
    status: {
        type: String,
        enum: ["New", "Process", "Closed"]
    },
    remarks: {
        type: String
    },
    is_active: {
        type: Number,
        default: 1,
    },
    input_time: {
        type: Date,
        default: localDate
    },
    edit_time: {
        type: Date,
        default: localDate
    }
},
    { collection: 'Trn_debt_items', timestamps: true }
);


module.exports = (conn) => {
   
    return conn.model('Trn_debt_items', TrnDebtItemsSchema);
}
