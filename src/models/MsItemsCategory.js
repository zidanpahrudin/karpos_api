const mongoose = require('mongoose');
const { Schema, model, createConnection } = require('mongoose');
require('mongoose-double')(mongoose);
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const SchemaTypes = mongoose.Schema.Types;
const Double = SchemaTypes.Double;

const MstItemsCategorySchema = new Schema({
    items_category_name: {
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
    { collection: 'mst_items_category', timestamps: true }
);

module.exports = (conn) => {
    return conn.model('mst_items_category', MstItemsCategorySchema);
}
