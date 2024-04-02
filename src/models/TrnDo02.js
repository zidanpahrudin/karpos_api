const mongoose = require('mongoose');
const { Schema, model, createConnection } = require('mongoose');
require('mongoose-double')(mongoose);
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const SchemaTypes = mongoose.Schema.Types;
const Double = SchemaTypes.Double;
 
const TrnDo02Schema = new Schema({
    do_id: {
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
    warehouse_id: {
        type: ObjectId
    },
    warehouse_name: {
        type: String
    },
    price: {
        type: Double
    },
    discount: {
        type: Double
    },
    total: {
        type: Double
    },
    remarks: {
        type: String
    }
},
    { collection: 'trn_do_02', timestamps: true }
);

TrnDo02Schema.index({do_id: 1} );
TrnDo02Schema.index({items_id: 1} );

module.exports = (conn) => {
   
    return conn.model('trn_do_02', TrnDo02Schema);
}
