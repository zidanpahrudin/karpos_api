const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const moment = require("moment-timezone");
const TrnDo01Schema = new Schema({
    do_date: {
        type: Date,
        default: localDate
    },
    do_no: {
        type: String
    },
    warehouse_id: {},
    doc_ref: {
        type: String
    },
    assistant: {
        type: String
    },
    vehicle_id: {
        type: ObjectId
    },
    vehicle_no: {
        type: String
    },
    partner_id: {
        type: ObjectId
    },
    do_status: {
        type: String,
        enum: ["New","Reject", "Closed", "Process"]
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
    count: {
        type: Number,
        default: 1
    },
    pic_edit: {
        type: String
    },
    edit_time: {
        type: Date,
        default: localDate
    }
},
    { collection: 'trn_do_01', timestamps: true }
);

TrnDo01Schema.index({partner_id: 1});
TrnDo01Schema.index({do_date: 1});
TrnDo01Schema.index({do_status: 1});

TrnDo01Schema.pre("save", async function(next) {
    const deliveryOrder = this;
    const inputTime = moment(deliveryOrder.input_time).format("YYYYMM");
    const day = moment(deliveryOrder.input_time).date();
    const inputMonth = moment(deliveryOrder.input_time).month();
    const inputYear = moment(deliveryOrder.input_time).year();

    let count = 1;
    let code = "DOS";
    const previousDocument = await deliveryOrder.constructor.findOne({
        createdAt: { $lt: deliveryOrder.createdAt },
    }).sort({ createdAt: -1 });
    
    if(previousDocument) {
        const previousMonth = moment(previousDocument.input_time).month();
        const previousYear = moment(previousDocument.input_time).year();
        if(inputMonth > previousMonth || inputYear > previousYear) {
            count = 1;
            deliveryOrder.count = count;
        }
        else {
            count = previousDocument.count + 1;
            deliveryOrder.count = count;
        }
    } else {
        deliveryOrder.count = count;
    }
    let nomor = "0000";
    if(count>=10 && count <= 99) nomor = "000";
    if(count >= 100 && count <= 999) nomor = "00";
    if(count >= 1000 && count <= 9999) nomor = "0";
    if(count >= 10000 && count <= 99999) nomor = "";
    deliveryOrder.do_no = `${code}${inputTime}${nomor}${count}`
    next();
})


module.exports = (conn) => {
    return conn.model('trn_do_01', TrnDo01Schema);
}
