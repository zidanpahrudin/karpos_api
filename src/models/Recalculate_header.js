const mongoose = require('mongoose');
const { Schema, model, createConnection } = require('mongoose');
require('mongoose-double')(mongoose);
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const SchemaTypes = mongoose.Schema.Types;
const Double = SchemaTypes.Double;

const RecalculateHeaderSchema = new Schema({
    items_id: ObjectId,
    doc_no: String,
    warehouse_id: ObjectId,
    trn_date: String,
    trn_month: String,
    trn_year: String,
    activity: String,
    qty: Number,
    createdAt: Date,
    updatedAt: Date,
    items_code: String,
    items_name: String,
    items_info: String,
    items_unit_id: ObjectId,
    items_category: ObjectId,
    price_buy: Number,
    price_sell: Number,
    warehouse_name: String,
    warehouse_code: String,
    address: String,
    telp: String,
    city: String
},
    { collection: 'recalculate_header', timestamps: true }
);

module.exports = RecalculateHeader = model('recalculate_header', RecalculateHeaderSchema);