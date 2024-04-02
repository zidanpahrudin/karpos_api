const mongoose = require('mongoose');
const { Schema, model, createConnection } = require('mongoose');
require('mongoose-double')(mongoose);
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const SchemaTypes = mongoose.Schema.Types;
const Double = SchemaTypes.Double;

const MstVehicleSchema = new Schema({
    vehicle_no: {
        type: String
    },
    vehicle_merk: {
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
    { collection: 'mst_vehicle', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('mst_vehicle', MstVehicleSchema);
}