const generateIsNo = require("../utils/generateIsNo")
const { ObjectId } = require("mongodb");

const connectionManager = require("../middleware/db");

exports.getItemDebtMobile = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));

        const invoiceDetail = await TrnInvoice02.aggregate([
            {
                $match: {
                    status_item_debt: "Outstanding"
                }
            },
           
            {
                $graphLookup: {
                    from: 'trn_invoice_01',
                    startWith: '$inv_id',
                    connectFromField: '_id',
                    connectToField: '_id',
                    as: 'invoice_header'
                }
            },
            {
                $graphLookup: {
                    from: 'mst_customer',
                    startWith: '$invoice_header.customer_id',
                    connectFromField: '_id',
                    connectToField: '_id',
                    as: 'customer'
                } 
            },
            {
                $unwind: {
                    path: '$customer',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: '$invoice_header',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $graphLookup: {
                    from: 'trn_do_01',
                    startWith: '$invoice_header.doc_ref',
                    connectFromField: 'do_no',
                    connectToField: 'do_no',
                    as: 'delivery_order_header'
                }
            },
            {
                $unwind: {
                    path: '$delivery_order_header',
                    preserveNullAndEmptyArrays: true
                }
            },
            { 
                $match: { $expr: { $eq: ['$delivery_order_header.partner_id', { $toObjectId: req.user.id }] } } 
            },
            {
                $lookup: {
                    from: "trn_do_02",
                    localField: "delivery_order_header._id",
                    foreignField: "do_id",
                     let: {
                         "inv_items_id": "$items_id",
                     },
                     pipeline: [
                         { $match: { $expr: {
                             // $eq: ['do_id', "$$do_id" ],
                             $eq: ["$items_id", "$$inv_items_id"]
                         } } },
                     ],
                    as: "delivery_order_detail"
                }
            },
            {
                $addFields: {
                    convertedqtyGiven: { $toInt: "$qty_item_given" },
                    firtsItems: { $first: "$delivery_order_detail.items_name"  }
                 }
            },
            {
                $project: {
                    "_id": 0,
                    "invoice_date": { $dateToString: { format: "%Y-%m-%d", date: "$invoice_header.createdAt" } },
                    "invoice_no": {$ifNull: ["$invoice_header.invoice_no", "a"]},
                    "items_id": {$ifNull: ["$items_id", "a"]},
                    "items_name": {$ifNull: ["$firtsItems", "a"]},
                    "qty": {$subtract: ["$qty",  "$convertedqtyGiven"]},
                    "address": {$ifNull: ["$customer.address", "  "]},
                    "customer_name": {$ifNull: ["$invoice_header.customer_name", "a"]},
                }
            }
        ])

        if(invoiceDetail.length < 0) {
            return res.json({
                status: "failed",
                message: "tidak terdapat invoice outstanding untuk partner ini",
                data: invoiceDetail
            })
        } 

        


        return res.json({
            status: "success",
            message: "terdapat invoice outstanding",
            data: invoiceDetail
        })

    } catch (err) {
       return res.json({ status: 'failed', message: 'server error : ' + err.message, data: [] })
    }
}

exports.updateDebtMobile = async (req, res) => {
    try {

const connectionDB = req.user.database_connection;
        const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));

        const {qty_item_given, items_id, inv_no} = req.body;
        const debtItems_date = Date.now()
        let invoiceHeader = await TrnInvoice01.findOne({invoice_no: inv_no}).lean()
        
        const invoiceDetail = await TrnInvoice02.findOne(
            { 
                inv_id: invoiceHeader._id, 
                items_id: ObjectId(items_id),  
                status_item_debt: "Outstanding" 
            }
            ).lean()

        if(parseInt(invoiceDetail.qty) < parseInt(qty_item_given) + parseInt(invoiceDetail.qty_barang_terima)) {
            return res.json({
                status: "failed",
                message: "Quantity item galon melebihi quantity invoice",
                data: []
            })
        }

        if(invoiceDetail) {
            let trn_debt_items = await TrnDebtItems.findOne({inv_no: inv_no, items_id: items_id, status: "Process"})
            if(trn_debt_items) {
                await TrnDebtItems.findOneAndUpdate(
                    {debtItems_no: trn_debt_items.debtItems_no},
                    {
                        qty_barang_terima: qty_item_given,
                        remarks: "",
                    }
                )
                
            } else {
                let newDebtItems = new TrnDebtItems({
                    debtItems_no: await generateIsNo("debtItems", "debtItems", debtItems_date),
                    inv_no: invoiceHeader.invoice_no,
                    partner_id: req.user.id,
                    items_id: items_id,
                    qty_barang_terima: qty_item_given,
                    qty_barang_invoice: invoiceDetail.qty,
                    status: "Process",
                    remarks: "",
                })
    
                await newDebtItems.save()
            }
            
        }

        return res.json({
            status: "success",
            message: "berhasil mengembalikan galon kosong",
            data: []
        })


        
    } catch (err) {
        return res.json({ status: 'failed', message: 'server error : ' + err.message, data: [] })
    }
}