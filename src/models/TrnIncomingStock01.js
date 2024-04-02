const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const moment = require("moment-timezone");
const TrnIncoming01StockSchema = new Schema({
    is_date: {
        type: Date,
        default: localDate
    },
    is_no: {
        type: String
    },
    supp_no: {
        type: String
    },
    warehouse_id: {
        type: ObjectId,
        requireq: true,
    },
    is_status: {
        type: String,
        enum: ["Reject", "Closed"]
    },
    doc_ref: {
        type: String,
    },
    sender_pic: {
        type: String
    },
    receiver_pic: {
        type: String
    },
    remarks: {
        type: String
    },
    att_file: {
        type: String
    },
    tautan: {
        type: String
    },
    is_kind: {
        type: String,
        enum: ["Transfer", "Others", "DO Supplier", "Adjustment"]
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
    count: {
        type: Number
    },
    pic_edit: {
        type: String
    },
    edit_time: {
        type: Date,
        default: localDate
    }

},
    { collection: 'trn_incoming_stock_01', timestamps: true }
);

TrnIncoming01StockSchema.pre("save", async function(next) {
    const trnIncoming = this;
    const targetKind = trnIncoming.is_kind;
    const inputTime = moment(trnIncoming.input_time).format("YYYYMM");
    const day = moment(trnIncoming.input_time).date();
    const inputMonth = moment(trnIncoming.input_time).month();
    const inputYear = moment(trnIncoming.input_time).year();

    let count = 1;
    let code = "";
    const previousDocument = await trnIncoming.constructor.findOne({
        createdAt: { $lt: trnIncoming.createdAt },
    }).sort({ createdAt: -1 });
    
    if(previousDocument && previousDocument.count) {
        const previousMonth = moment(previousDocument.input_time).month();
        const previousYear = moment(previousDocument.input_time).year();
        if(inputMonth > previousMonth || inputYear > previousYear) {
            count = 1;
            trnIncoming.count = count;
        } else {
            count = previousDocument.count + 1;
            trnIncoming.count = count;
        }
    } else {
        trnIncoming.count = count;
    }
    switch(targetKind) {
        case "Transfer":
            code = "IST"
        break;
        case "DO Supplier":
            code = "ISS"
        break;
        case "Adjustment":
            code = "ISD"
        break;
    }
    let nomor = "0000";
    if(count>=10 && count <= 99) nomor = "000";
    if(count >= 100 && count <= 999) nomor = "00";
    if(count >= 1000 && count <= 9999) nomor = "0";
    if(count >= 10000 && count <= 99999) nomor = "";
    trnIncoming.is_no = `${code}${inputTime}${nomor}${count}`
    next();
});

module.exports = (conn) => {
   
    return conn.model('trn_incoming_stock_01', TrnIncoming01StockSchema);
}
