const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const MstCustomerSchema = new Schema({
    customer_name: {
        type: String
    },
    npwp: {
        type: String
    },
    address: {
        type: String
    },
    contact1: {
        type: String
    },
    contact2: {
        type: String
    },
    email: {
        type: String
    },
    pic_sales: {
        type: String
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
        type: String
    },
    edit_time: {
        type: Date,
        default: localDate
    }

},
    { collection: 'mst_customer', timestamps: true }
);

module.exports = (conn) => {
    return conn.model('mst_customer', MstCustomerSchema);
}
