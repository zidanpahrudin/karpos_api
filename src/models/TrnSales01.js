const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnSales01Schema = new Schema({
    sales_date: {
        type: Date
    },
    sales_no: {
        type: String
    },
    customers_id: {
        type: ObjectId
    },
    customer_name: {
        type: String
    },
    delivery_address: {
        type: String
    },
    remarks: {
        type: String
    },
    disc_percent: {
        type: Double
    },
    disc_value: {
        type: Double
    },
    total: {
        type: Double
    },
    so_status: {
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
        type: String
    },
    edit_time: {
        type: Date,
        default: localDate
    }

},
    { collection: 'trn_sales_01', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('trn_sales_01', TrnSales01Schema);
}
