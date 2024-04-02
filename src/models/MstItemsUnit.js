const mongoose = require('mongoose');
const { Schema, model, createConnection } = require('mongoose');
require('mongoose-double')(mongoose);
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const SchemaTypes = mongoose.Schema.Types;
const Double = SchemaTypes.Double;

const MstItemsUnitSchema = new Schema({
    items_unit_name: {
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
    { collection: 'mst_items_unit', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('mst_items_unit', MstItemsUnitSchema);
}
