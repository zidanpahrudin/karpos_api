const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const moment = require("moment-timezone");
const ListItemsTempSchema = new Schema({
    inv_detail_id: {
        type: ObjectId
    },
    items_id: {
        type: ObjectId
    },
    items_code: {
        type: String
    },
    items_name: {
        type: String
    },
    price: {
        type: Double,
    },
    is_container: {
        type: Boolean    
    },
    qty: {
        tyoe: Number
    }
},{ collection: 'list_items_temp', timestamps: true });

module.exports = (conn) => {
    return conn.model('list_items_temp', ListItemsTempSchema);
}
