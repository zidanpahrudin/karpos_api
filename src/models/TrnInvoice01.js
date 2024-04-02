const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const moment = require("moment-timezone");
const TrnInvoice01Schema = new Schema({
    invoice_no: {
        type: String
    },
    doc_ref: {
        type: String
    },
    doc_status: {
        type: String,
        enum: ["new", "closed", "reject"]
    },
    urut: {
        type: Number,
        default: 1,
    },
    warehouse_id: {
    },
    warehouse: {
        "warehouse_name": String,
        "warehouse_code": String,
        "address": String,
        "telp": String,
        "city": String,
        "remarks": String,
        "is_active": Number,
        "pic_input": String,
        "input_time": Date,
        "edit_time": Date,
        "createdAt": Date,
        "updatedAt": Date,
    },
    warehouse_name: {
        type: String,
    },
    customer_id: {
        type: ObjectId
    },
    penerima: {
        type: String,
        default: "",
    },
    keterangan: {
        type: String
    },
    customer_name: {
        type: String,
        default: "",
    },
    alamat: {
        type: String,
        default: "",
    },
    disc_percent: {
        type: Double
    },
    disc_value: {
        type: String
    },
    total: {
        type: Double
    },
    sisa_hutang: {
        type: Double,
        default: 0,
    },
    nama_file: {
        type: String,
        default: "",
    },
    // filename: {
    //     type: String,
    // },
    tautan_file: {
        type: String,
        default: '/images/sign/'
    },
    price: {
        type: Double,
        default: 0,
    },
    remarks: {
        type: String
    },
    invoice_status: {
        type: String,
    },
    invoice_type: {
        type: String,
        enum: ["inv_pos", "inv_do", "inv_on_ride"]
    },
    is_active: {
        type: Number,
        default: 1
    },
    count: {
        type: Number,
        default: 1
    },
    pic_input: {
        type: String
    },
    payment_type: {
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
    },

},
    { collection: 'trn_invoice_01', timestamps: true }
);
TrnInvoice01Schema.pre("save", async function(next) {
    const invoice = this;
    const targetKind = invoice.invoice_type;
    const inputTime = moment(invoice.input_time).format("YYYYMM");
    const day = moment(invoice.input_time).date();
    const inputMonth = moment(invoice.input_time).month();
    const inputYear = moment(invoice.input_time).year();
    let count = 1;
    let code = "";
    
    const previousDocument = await invoice.constructor.findOne({
        createdAt: { $lt: invoice.createdAt },
    }).sort({ createdAt: -1 });
    
    if(previousDocument) {
        const previousMonth = moment(previousDocument.input_time).month();
        const previousYear = moment(previousDocument.input_time).year();
        if(inputMonth > previousMonth || inputYear > previousYear) {
            count = 1;
            invoice.count = count;
        } else {
            count = previousDocument.count + 1;
            invoice.count = count;
        }
    } else {
        invoice.count = count;
    }
    switch(targetKind) {
        case "inv_do":
            code = "IND"
        break;
        case "inv_pos":
            code = "INS"
        break;
        case "inv_on_ride":
            code = "INC"
        break;
    }
    let nomor = "0000";
    
    if(count>=10 && count <= 99) nomor = "000";
    if(count >= 100 && count <= 999) nomor = "00";
    if(count >= 1000 && count <= 9999) nomor = "0";
    if(count >= 10000 && count <= 99999) nomor = "";
    
    invoice.invoice_no = `${code}${inputTime}${nomor}${count}`
    next();
})
TrnInvoice01Schema.index({invoice_no: 1}, { unique: true });
TrnInvoice01Schema.index({customer_name: 1} );
TrnInvoice01Schema.index({doc_ref: 1} );
TrnInvoice01Schema.index({invoice_status: 1});

module.exports = (conn) => {
   
    return conn.model('trn_invoice_01', TrnInvoice01Schema);
}
