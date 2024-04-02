const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const MstWarehouseSchema = new Schema({
    warehouse_name: {
        type: String
    },
    warehouse_code: {
        type: String
    },
    address: {
        type: String
    },
    telp: {
        type: String
    },
    city: {
        type: String
    },
    remarks: {
        type: String
    },
    is_active: {
        type: Number,
        default: 1
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
    { collection: 'mst_warehouse', timestamps: true }
);


module.exports = (conn) => {
   
    return conn.model('mst_warehouse', MstWarehouseSchema);
}
