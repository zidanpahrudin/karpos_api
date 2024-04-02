const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const MstSupplierSchema = new Schema({
    supplier_name: {
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
        // type: Date
    },
    remaks: {
        type: String
    },
    is_ppn: {
        type: Number
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
    { collection: 'mst_supplier', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('mst_supplier', MstSupplierSchema);
}