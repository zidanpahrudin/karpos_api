const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const moment = require("moment-timezone");
const TrnReturSchema = new Schema({
    do_id: {
        type: ObjectId
    },
    do_id_ref: {
        type: ObjectId
    },
    invoice_no: {
        type: String
    },
    partner_id: {
        type: ObjectId
    },
    retur_no: {
        type: String
    },
    retur_kind: {
        type: String
    },
    customer_name: {
        type: String
    },
    items_id: {
        type: ObjectId
    },
    qty: {
        type: String
    },
    qty_payment: {
        type: Number
    },
    count: {
        type: Number,
        default: 1
    },
    input_time: {
        type: Date,
        default: localDate
    },
    remarks: {
        type: String,
    }
},
    { collection: 'trn_retur', timestamps: true }
);

TrnReturSchema.pre("save", async function(next) {
    const TrnRetur = this;
    const targetKind = TrnRetur.retur_kind;
    const inputTime = moment(TrnRetur.input_time).format("YYYYMM");
    const day = moment(TrnRetur.input_time).date();
    const inputMonth = moment(TrnRetur.input_time).month();
    const inputYear = moment(TrnRetur.input_time).year();

    let count = 1;
    let code = "";
    const previousDocument = await TrnRetur.constructor.findOne({
        createdAt: { $lt: TrnRetur.createdAt },
    }).sort({ createdAt: -1 });
    
    if(previousDocument) {
        const previousMonth = moment(previousDocument.input_time).month();
        const previousYear = moment(previousDocument.input_time).year();
        if(inputMonth > previousMonth || inputYear > previousYear) {
            count = 1;
            TrnRetur.count = count;
        } else {
            count = previousDocument.count + 1;
            TrnRetur.count = count;
        }
    } else {
        TrnRetur.count = count;
    }

    switch(targetKind) {
        case "retur_in":
            code = "RTN"
        break;
        case "retur_out":
            code = "RTO"
        break;
    }
    let nomor = "0000";
    if(count>=10 && count <= 99) nomor = "000";
    if(count >= 100 && count <= 999) nomor = "00";
    if(count >= 1000 && count <= 9999) nomor = "0";
    if(count >= 10000 && count <= 99999) nomor = "";
    TrnRetur.retur_no = `${code}${inputTime}${nomor}${count}`
    next();
})


module.exports = (conn) => {
   
    return conn.model('trn_retur', TrnReturSchema);
}
