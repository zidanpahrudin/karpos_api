const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnSales02Schema = new Schema({
    sales_id: {
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
    disc_value: {
        type: Double
    },
    disc_percent: {
        type: Double
    },
    subtotal: {
        type: Double
    },
    remarks: {
        type: String
    }

},
    { collection: 'trn_sales_02', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('trn_sales_02', TrnSales02Schema);
}
