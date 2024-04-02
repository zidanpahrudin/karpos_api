const IncomingStock01 = require('../models/TrnIncomingStock01');
const OutgoingStock01 = require("../models/TrnOutgoingStock01");
const DeliveryOrder = require("../models/TrnDo01");
const Invoice = require("../models/TrnInvoice01");
const TrnRetur = require("../models/TrnRetur");
const TrnDebtItems = require("../models/TrnDebtItems");
const moment = require("moment")
async function generateIsNo(target, targetKind,targetDate) {

    let counting = 0;
    let code;
    let periode_input = moment(targetDate).format("YYYYMM")
    let resultData;
    if(target === "incomingStock") {
        resultData = await IncomingStock01.find({ "is_no": { $regex: periode_input } }).sort({_id: -1}).limit(1).lean()
        if(resultData.length > 0) {
            counting = parseInt(resultData[0].is_no.substring(12, 9)) + 1
        } else {
            counting = 1;
        }
    } else if(target === "outgoingStock") {
        resultData = await OutgoingStock01.find({ "os_no": { $regex: periode_input } }).sort({_id: -1}).limit(1).lean()
        if(resultData.length > 0) {
            counting = parseInt(resultData[0].os_no.substring(12, 9)) + 1
        } else {
            counting = 1;
        }
    } else if(target === "invoice") {
        resultData = await Invoice.find({}).sort({_id: -1}).limit(1).lean()
        if(resultData.length > 0) {
            counting = parseInt(resultData[0].count) + 1
        } else {
            counting = 1;
        }
    } else if(target === "deliveryOrder") {
        resultData = await DeliveryOrder.find({}).sort({_id: -1}).limit(1).lean()
        if(resultData.length > 0) {
            counting = parseInt(resultData[0].do_no.substring(12, 9)) + 1
        } else {
            counting = 1;
        }
    } else if(target === "retur") {
        resultData = await TrnRetur.find({}).sort({_id: -1}).limit(1).lean()
        if(resultData.length > 0) {
            counting = parseInt(resultData[0].retur_no.substring(12, 9)) + 1
        } else {
            counting = 1;
        }
    }else if(target === "debtItems") {
        resultData = await TrnDebtItems.find({}).sort({_id: -1}).limit(1).lean()
        if(resultData.length > 0) {
            counting = parseInt(resultData[0].debtItems_no.substring(12, 9)) + 1
        } else {
            counting = 1;
        }
    }

    if(target === "incomingStock") {
        if(targetKind === "Transfer") {
            code = "IST"
        } else if(targetKind === "DO Supplier") {
            code = "ISS"
        } else if(targetKind === "Adjustment") {
            code = "ISD"
        } else {
            return 'tidak terdapat kode'
        }
    }

    if(target === "outgoingStock") {
        if(targetKind === "Transfer") {
            code = "OST"
        } else if(targetKind === "Adjustment") {
            code = "OSD"
        } else if(targetKind === "Others") {
            code = "OSS"
        } else {
            return 'tidak terdapat kode'
        }
    }

    if(target === "invoice") {
        if(targetKind === "inv_do") {
            code = "IND"
        } else if(targetKind === "inv_pos") {
            code = "INS"
        } else if(targetKind === "inv_on_ride") {
            code = "INC"
        } else {
            return 'tidak terdapat kode'
        }
    }

    if(target === "deliveryOrder") {
        code = "DOS"
    }

    if(target === "retur") {
        code = "RTN"
        if(targetKind === "retur_in") {
            code = "RTN"
        } else if (targetKind === "retur_out") {
            code = "RTO"
        } else {
            return 'tidak terdapat kode'
        }
    }
    

    if(target === "debtItems") {
        code = "DIT"
    }

    let nomor = "00"
    if(counting>=10 && counting <= 99){
        nomor = "0"
    }else if(counting>=99){
        nomor = ""
    }
    
    return `${code}${periode_input}${nomor}${counting}`
}

module.exports = generateIsNo;