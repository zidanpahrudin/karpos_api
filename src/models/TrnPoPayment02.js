const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const TrnPoPayment02Schema = new Schema({
    pp_id: {
        type: ObjectId
    },
    pp_no: {
        type: String
    },
    total: {
        type: Double
    },
    is_active: {
        type: Number
    }

},
    { collection: 'trn_po_payment_02', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('trn_po_payment_02', TrnPoPayment02Schema);
}