const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnOutgoingStock02Schema = new Schema({
    os_id: {
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
    disc_percent: {
        type: Double
    },
    total: {
        type: Double
    },
    remarks: {
        type: String
    }
},
    { collection: 'trn_outgoing_stock_02', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('trn_outgoing_stock_02', TrnOutgoingStock02Schema);
}