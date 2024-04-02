const mongoose = require('mongoose');
const { Schema, model, createConnection } = require('mongoose');
require('mongoose-double')(mongoose);
const AutoIncrement = require('mongoose-sequence')(mongoose);
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const SchemaTypes = mongoose.Schema.Types;
const Double = SchemaTypes.Double;
const moment = require("moment");

const utc = new Date();
const day = moment(utc).format("YYYYMM");

const MstItemsSchema = new Schema({
    items_code: {
        type: String,
    },
    items_icon: {
        type: String
    },
    icon_path: {
        type: String
    },
    replace_id: {
        type: String,
        default: ""
    },
    items_name: {
        type: String
    },
    items_info: {
        type: String
    },
    items_unit_id: {
        type: ObjectId
    },
    items_category: {
        type: ObjectId
    },
    items_merk: {
        type: String
    },
    price_buy: {
        type: Double
    },
    price_sell: {
        type: Double
    },
    is_active: {
        type: Number
    },
    is_bundling: {
        type: Number,
        default: 0,
        enum: [0, 1]
    },
    bundle_items: [
        {
            items_id: {
                type: ObjectId
            },
            items_name: {
                type: String
            },
            items_unit_id: {
                type: ObjectId
            },
            // items_unit_name: {
            //     type: String
            // },
            qty: {
                type: String
            },
            price_buy: {
                type: Double
            },
            price_sell: {
                type: Double
            },
        }
    ],
    count: {
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
    { collection: 'mst_items', timestamps: true }
);

MstItemsSchema.pre("save", async function (next) {
    const items = this;
    const inputTime = moment(items.input_time).format("YYYYMM");
    const inputMonth = moment(items.input_time).month();
    const inputYear = moment(items.input_time).year();
    let count = 1;
    let code = "";
    let nomor = "000";
    const previousDocument = await items.constructor.findOne({
        createdAt: { $lt: items.createdAt },
    }).sort({ createdAt: -1 });

    if (previousDocument) {
        const previousMonth = moment(previousDocument.input_time).month();
        const previousYear = moment(previousDocument.input_time).year();
        if (inputMonth > previousMonth || inputYear > previousYear) {
            count = 1;
            items.count = count;
        } else {
            count = previousDocument.count + 1;
            items.count = count;
        }
    } else {
        items.count = count;
    }
    switch (count) {
        case count >= 10 && count <= 99:
            nomor = "00"
            break;
        case count >= 100 && count <= 999:
            nomor = "0"
            break;
        case count >= 1000 && count <= 9999:
            nomor = ""
            break;
    }

    items.items_code = inputTime + nomor + count;
    next();
});


MstItemsSchema.index({
    items_name: 'text',
});

module.exports = (conn) => {
    return conn.model('mst_items', MstItemsSchema);
};