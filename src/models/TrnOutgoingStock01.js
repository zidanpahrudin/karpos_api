const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const moment = require("moment-timezone");
const TrnOutgoingStock01Schema = new Schema({
    os_date: {
        type: Date,
        default: localDate,
    },
    os_no: {
        type: String
    },
    warehouse_id: {
        type: ObjectId,
    },
    dest_warehouse_id: {
        type: ObjectId
    },
    requester: {
        type: String
    },
    os_kind: {
        type: String,
        enum: ["Transfer", "Others", "Adjustment"]
    },
    os_status: {
        type: String,
        enum: ["Reject", "Closed"]
    },
    count: {
        type: Number
    },
    remarks: {
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
    { collection: 'trn_outgoing_stock_01', timestamps: true }
);

TrnOutgoingStock01Schema.pre("save", async function(next) {
    const trnOutgoing = this;
    const targetKind = trnOutgoing.os_kind;
    const inputTime = moment(trnOutgoing.input_time).format("YYYYMM");
    const day = moment(trnOutgoing.input_time).date();
    const inputMonth = moment(trnOutgoing.input_time).month();
    const inputYear = moment(trnOutgoing.input_time).year();

    let count = 1;
    let code = "";
    const previousDocument = await trnOutgoing.constructor.findOne({
        createdAt: { $lt: trnOutgoing.createdAt },
    }).sort({ createdAt: -1 });
    
    if(previousDocument && previousDocument.count) {
        const previousMonth = moment(previousDocument.input_time).month();
        const previousYear = moment(previousDocument.input_time).year();
        if(inputMonth > previousMonth || inputYear > previousYear) {
            count = 1;
            trnOutgoing.count = count;
        } else {
            count = previousDocument.count + 1;
            trnOutgoing.count = count;
        }
    } else {
        trnOutgoing.count = count;
    }

    switch(targetKind) {
        case "Transfer":
            code = "OST"
        break;
        case "Others":
            code = "OSS"
        break;
        case "Adjustment":
            code = "OSD"
        break;
    }
    let nomor = "0000";
    if(count>=10 && count <= 99) nomor = "000";
    if(count >= 100 && count <= 999) nomor = "00";
    if(count >= 1000 && count <= 9999) nomor = "0";
    if(count >= 10000 && count <= 99999) nomor = "";
    trnOutgoing.os_no = `${code}${inputTime}${nomor}${count}`
    next();
});

module.exports = (conn) => {
   
    return conn.model('trn_outgoing_stock_01', TrnOutgoingStock01Schema);
}
