const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnIncomingStock02Schema = new Schema({
    is_id: {
        type: ObjectId
    },
    items_id: {
        type: ObjectId
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
    total: {
        type: Double
    },
    remarks: {
        type: String
    }

},
    { collection: 'trn_incoming_stock_02', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('trn_incoming_stock_02', TrnIncomingStock02Schema);
}
