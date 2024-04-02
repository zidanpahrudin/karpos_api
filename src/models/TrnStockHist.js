const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnStockHistSchema = new Schema({
    items_id: {
        type: ObjectId,
    },
    doc_no: {
        type: String
    },
    warehouse_id: {
        type: ObjectId,
    },
    trn_date: {
        type: String
    },
    trn_month: {
        type: String
    },
    trn_year: {
        type: String
    },   
    activity: {
        type: String
    },
    qty: {
        type: Number
    },
    old_stock: {
        type: Number
    },
    current_stock: {
        type: Number
    },

},
    { collection: 'trn_stock_hist', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('trn_stock_hist', TrnStockHistSchema);
}
