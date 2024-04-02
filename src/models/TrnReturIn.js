const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const moment = require("moment-timezone");
const TrnReturInSchema = new Schema({
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
    count: {
        type: Number,
        default: 1
    },
    qty_payment: {
        type: Number
    },
    input_time: {
        type: Date,
        default: localDate
    },
    remarks: {
        type: String,
    }
},
    { collection: 'trn_in_retur', timestamps: true }
);

TrnReturInSchema.pre("save", async function(next) {
    const TrnReturIn = this;
    const targetKind = TrnReturIn.retur_kind;
    const inputTime = moment(TrnReturIn.input_time).format("YYYYMM");
    const day = moment(TrnReturIn.input_time).date();
    const inputMonth = moment(TrnReturIn.input_time).month();
    const inputYear = moment(TrnReturIn.input_time).year();

    let count = 1;
    let code = "";
    
    const previousDocument = await TrnReturIn.constructor.findOne({
        createdAt: { $lt: TrnReturIn.createdAt },
    }).sort({ createdAt: -1 });
    
    if(previousDocument) {
        const previousMonth = moment(previousDocument.input_time).month();
        const previousYear = moment(previousDocument.input_time).year();
        if(inputMonth > previousMonth || inputYear > previousYear) {
            count = 1;
            TrnReturIn.count = count;
        } else {
            count = previousDocument.count + 1;
            TrnReturIn.count = count;
        }
    } else {
        TrnReturIn.count = count;
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
    TrnReturIn.retur_no = `${code}${inputTime}${nomor}${count}`
    next();
})


module.exports = (conn) => {
   
    return conn.model('trn_in_retur', TrnReturInSchema);
}
