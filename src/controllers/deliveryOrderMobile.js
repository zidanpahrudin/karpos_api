
const moment = require("moment");
const escapeRegex = require("../utils/escapeRegex");
const connectionManager = require("../middleware/db");
module.exports = {
    getDoMobile: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
            const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
            const MstPartner = require("../models/MstPartner")(connectionManager.getConnection(connectionDB));
            const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const { date } = req.body;
            let doPartner = await TrnDo01.findOne({ partner_id: req.user.id, do_status: "Process", do_date: date }).lean()
    
            let doDetail = await TrnDo02.find({ do_id: doPartner._id }).lean()
    
            let sumTotalDetail = 0;
            let sumQtyDetail = 0;
            let arrDetail = [];
            let doNo = [];
            // let arrDetailInvoice = [];
            let sisa = 0;
            let items_selisih = [];
            for (let i = 0; i < doDetail.length; i++) {
                let sumSisaDetail = 0;
                let objDetail = {};
                let totalInvoice = 0;
                let invHeader = await TrnInvoice01.find({ doc_ref: doPartner.do_no, invoice_status: {$ne: 'Reject'} }).lean();
                let resultInv = [];
                let sisa = doDetail[i].qty;
                for (const inv of invHeader) {
                    let detailInvoice = await TrnInvoice02.findOne({ items_id: doDetail[i].items_id, inv_id: inv._id }).lean();
                    if (detailInvoice) {
                        sisa = sisa - detailInvoice.qty;
                    }
                }
    
                // const groupByCategory = invoice.reduce((group, product) => {
                //     const { invoice_no } = product;
                //     group[invoice_no] = group[invoice_no] ?? [];
                //     group[invoice_no].push(product);
                //     return group;
                // }, {});
    
    
                // for (const detail of detailInvoice) {
                //     // sumSisaDetail += detail.qty
                //     sumSisaDetail += doDetail[i].qty - detail.qty
                // }
                items_selisih.push(doDetail[i].items_id);
    
                    objDetail._id = doDetail[i]._id,
                    objDetail.do_id = doDetail[i].do_id,
                    objDetail.items_id = doDetail[i].items_id,
                    objDetail.items_name = doDetail[i].items_name,
                    objDetail.qty = doDetail[i].qty,
                    objDetail.price = doDetail[i].price,
                    objDetail.total = doDetail[i].total,
                    objDetail.remarks = doDetail[i].remarks,
                    objDetail.createdAt = doDetail[i].createdAt,
                    objDetail.updatedAt = doDetail[i].updatedAt,
                    objDetail.sisa = sisa
                arrDetail.push(objDetail)
    
                sumTotalDetail += doDetail[i].total
                // sumSisaDetail += doDetail[i].qty - detailInvoice.qty
                sumQtyDetail += doDetail[i].qty
            }
    
            let doDetail_sisa = await TrnDo02.aggregate([
                {
                    $match: {
                        do_id: doPartner._id,
                        items_id: {$nin: items_selisih}
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        do_detail_id: {'$first': '$_id'},
                        do_id: {'$first': '$do_id'},
                        do_id: {'$first': '$do_id'},
                        items_id: {'$first': '$items_id'},
                        items_name: {'$first': '$items_name'},
                        price: {'$first': '$price'},
                        total: {'$first': '$total'},
                        remarks: {'$first': '$remarks'},
                        createdAt: {'$first': '$createdAt'},
                        updatedAt: {'$first': '$updatedAt'},
                        warehouse_id: {'$first': '$warehouse_id'},
                        warehouse_name: {'$first': '$warehouse_name'},
    
                        totalInvoiceDetail: {'$sum': '$qty'}
                    }
                },
                {
                    $sort: {
                        'items_id': 1
                    }
                }
    
            ]);
    
    //        if (doDetail_sisa) {
    //            for await (const doDetail of doDetail_sisa) {
    //                const objResult = {};
    //
    ////                objDetail._id = doDetail[i]._id,
    ////                objDetail.do_id = doDetail[i].do_id,
    ////                objDetail.items_id = doDetail[i].items_id,
    ////                objDetail.items_name = doDetail[i].items_name,
    ////                objDetail.qty = doDetail[i].qty,
    ////                objDetail.price = doDetail[i].price,
    ////                objDetail.total = doDetail[i].total,
    ////                objDetail.remarks = doDetail[i].remarks,
    ////                objDetail.createdAt = doDetail[i].createdAt,
    ////                objDetail.updatedAt = doDetail[i].updatedAt,
    ////                objDetail.sisa = sisa
    //
    //                objResult._id = doDetail.do_detail_id,
    //                    objResult.do_id = doDetail.do_id,
    //                    objResult.items_id = doDetail.items_id,
    //                    objResult.items_name = doDetail.items_name,
    //                     objResult.qty = doDetail.qty,
    //                    objResult.price = doDetail.price,
    //                    objResult.total = doDetail.total,
    //                    objResult.remarks = doDetail.remarks,
    //                    objResult.createdAt = doDetail.createdAt,
    //                    objResult.updateddAt = doDetail.updatedAt,
    //                    objResult.sisa = doDetail.totalInvoiceDetail,
    ////                    objResult.warehouse_id = doDetail.warehouse_id,
    ////                    objResult.warehouse_name = doDetail.warehouse_name
    //                arrDetail.push(objResult)
    //
    //                sumTotalDetail += doDetail.total
    //                // sumSisaDetail += doDetail[i].qty - detailInvoice.qty
    //                sumQtyDetail += doDetail.qty
    //            }
    //        }
    
            let partner = await MstPartner.findById(doPartner.partner_id).lean();
    
            const objResult = {};
    
            objResult._id = doPartner._id;
            objResult.do_date = moment(doPartner.do_date).format("YYYY-MM-DD");
            objResult.do_no = doPartner.do_no;
            objResult.warehouse_id = doPartner.warehouse_id;
            objResult.doc_ref = doPartner.doc_ref;
            objResult.vehicle_id = doPartner.vehicle_id;
            objResult.vehicle_no = doPartner.vehicle_no;
            objResult.partner_id = doPartner.partner_id;
            objResult.partner_name = partner.partner_name;
            objResult.do_status = doPartner.do_status;
            objResult.remarks = doPartner.remarks;
            objResult.sum_total_detail = sumTotalDetail;
            objResult.sum_qty_detail = sumQtyDetail;
            // objResult.sum_sisa_detail = sumSisaDetail;
            objResult.is_active = doPartner.is_active;
            objResult.pic_input = doPartner.pic_input;
            objResult.input_time = doPartner.input_time;
            objResult.edit_time = doPartner.edit_time;
            objResult.createdAt = doPartner.createdAt;
            objResult.updatedAt = doPartner.updatedAt;
    
    
    
            res.json({
                status: "success",
                message: "berhasil mendapatkan data do",
                data: {
                    delivery_order: objResult,
                    delivery_order_detail: arrDetail
                }
            })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getDoQtyMobile: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
            const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
            const MstPartner = require("../models/MstPartner")(connectionManager.getConnection(connectionDB));
            const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const TrnRetur = require("../models/TrnRetur")(connectionManager.getConnection(connectionDB));
            const TrnReturIn = require("../models/TrnReturIn")(connectionManager.getConnection(connectionDB));
            const { date } = req.body;
            var utc = new Date();
            var day = moment(utc).format("YYYY-MM-DD");
            let m = moment(utc);
            m.set({hour:0,minute:0,second:0,millisecond:0});
            let doPartner = await TrnDo01.findOne({ partner_id: req.user.id, do_status: "Process", do_date: day, is_active: 1 }).lean()
            
            let invHeader = await TrnInvoice01.find({ doc_ref: doPartner.do_no, invoice_status: {$ne: 'Reject'} }).lean();
            
            let inv_id = [];
            for (const inv_header of invHeader) {
                inv_id.push(inv_header._id)
            }
    
            let invoiceDetail = await TrnInvoice02.aggregate([
                {
                    $match: {
                        inv_id: {$in: inv_id}
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        inv_detail_id: {'$first': '$_id'},
                        totalInvoiceDetail: {'$sum': '$qty'}
                    }
                },
                {
                    $sort: {
                        'items_id': 1
                    }
                }
    
            ]);
    
            let doDetail = await TrnDo02.aggregate([
                {
                    $match: {
                        do_id: doPartner._id
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        do_detail_id: {'$first': '$_id'},
                        do_id: {'$first': '$do_id'},
                        do_id: {'$first': '$do_id'},
                        items_id: {'$first': '$items_id'},
                        items_name: {'$first': '$items_name'},
                        price: {'$first': '$price'},
                        total: {'$first': '$total'},
    
    
    
                        totalInvoiceDetail: {'$sum': '$qty'}
                    }
                },
                {
                    $sort: {
                        'items_id': 1
                    }
                }
                           
            ]);

    
            let arrDetail2 = [];
            let sumSisaDetail = 0;
            let sumTotalDetail = 0;
            let sumQtyDetail = 0;
            let items_selisih = [];
            for (const inv_detail of invoiceDetail) {
                for (const do_detail of doDetail) {
                    if(inv_detail._id.toString() === do_detail._id.toString()) {
    
                        let retur_out_stock = await TrnRetur.findOne({ partner_id: req.user.id, items_id: do_detail.items_id, do_id_ref: doPartner._id }).lean()
                        let retur_in_stock = await TrnReturIn.findOne({ partner_id: req.user.id, items_id: do_detail.items_id, do_id_ref: doPartner._id }).lean()
                        let stock_retur = 0;
                        if (retur_out_stock && retur_out_stock) {
                            stock_retur = retur_in_stock.qty - retur_out_stock.qty;
                        }
                        const objDetail = {};
                        items_selisih.push(do_detail.items_id)
                        objDetail._id = do_detail.do_detail_id,
                        objDetail.do_id = do_detail.do_id,
                        objDetail.items_id = do_detail.items_id,
                        objDetail.items_name = do_detail.items_name,
                        objDetail.qty = do_detail.totalInvoiceDetail + stock_retur,
                        objDetail.price = `${Math.round(do_detail.price)}.0`,
                        objDetail.total = `${do_detail.total}.0`,
                        objDetail.sisa = do_detail.totalInvoiceDetail - inv_detail.totalInvoiceDetail - stock_retur
                        if(do_detail.totalInvoiceDetail - inv_detail.totalInvoiceDetail > 0) {
                            arrDetail2.push(objDetail)
    
                        }
                    sumSisaDetail += do_detail.totalInvoiceDetail - inv_detail.totalInvoiceDetail - stock_retur;
                    sumQtyDetail += do_detail.totalInvoiceDetail
                    sumTotalDetail += do_detail.total
                    }
                }
            }
            let doDetail_sisa = await TrnDo02.aggregate([
                {
                    $match: {
                        do_id: doPartner._id,
                        items_id: {$nin: items_selisih}
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        do_detail_id: {'$first': '$_id'},
                        do_id: {'$first': '$do_id'},
                        do_id: {'$first': '$do_id'},
                        items_id: {'$first': '$items_id'},
                        items_name: {'$first': '$items_name'},
                        price: {'$first': '$price'},
                        total: {'$first': '$total'},
    
    
    
                        totalInvoiceDetail: {'$sum': '$qty'}
                    }
                },
                {
                    $sort: {
                        'items_id': 1
                    }
                }
    
            ]);
          
            if(doDetail_sisa) {
                for await (const doDetail of doDetail_sisa) {
                    const objDetail = {};
                    items_selisih.push(doDetail.items_id)
                    objDetail._id = doDetail.do_detail_id,
                    objDetail.do_id = doDetail.do_id,
                    objDetail.items_id = doDetail.items_id,
                    objDetail.items_name = doDetail.items_name,
                    objDetail.qty = doDetail.totalInvoiceDetail,
                    objDetail.price = `${Math.round(doDetail.price)}.0`,
                    objDetail.total = `${doDetail.total}.0`,
                    objDetail.sisa = doDetail.totalInvoiceDetail;
    
                    sumSisaDetail += doDetail.totalInvoiceDetail;
                    sumQtyDetail += doDetail.totalInvoiceDetail
                    sumTotalDetail += doDetail.total
    
                    arrDetail2.push(objDetail)
                }
            }
    
    
            let partner = await MstPartner.findById(doPartner.partner_id).lean();
    
            const objResult = {};
    
            objResult._id = doPartner._id;
            objResult.do_date = moment(doPartner.do_date).format("YYYY-MM-DD");
            objResult.do_no = doPartner.do_no;
            objResult.vehicle_no = doPartner.vehicle_no;
            objResult.partner_name = partner.partner_name;
            objResult.do_status = doPartner.do_status;
            objResult.sum_total_detail = `${sumTotalDetail}.0`;
            objResult.sum_qty_detail = sumQtyDetail;
            objResult.sum_sisa_detail = sumSisaDetail;
    
            res.json({
                status: "success",
                message: "berhasil mendapatkan data do",
                data: {
                    delivery_order: objResult,
                    delivery_order_detail: arrDetail2
                }
            })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getDoInMobile: async (req, res) => {
        try {
            
            const connectionDB = req.user.database_connection;
            const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
            const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));

            let istrnDo = await TrnDo01.findOne({ partner_id: req.user.id }).lean()
    
            if (!istrnDo) {
                return res
                    .status(400)
                    .json({
                        status: "failed",
                        message: "tidak terdapat do",
                        data: []
                    })
            }
    
            let invoice01 = await TrnInvoice01.aggregate([
                {
                    $match: {
                        doc_ref: istrnDo.do_no,
                        invoice_status: {$ne: 'Reject'}
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            "no_invoice": "$invoice_no",
                            "invoice_status": "$invoice_status",
                            "customer_name": "$customer_name",
                            "remarks": "$remarks",
                            "total": "$total",
                        }
                    }
                },
            ]);
    
            let resultArr = [];
            for (let i = 0; i < invoice01.length; i++) {
                let objResult = {};
                let detail = invoice01[i];
                objResult.no_invoice = detail.invoice_no,
                objResult.invoice_status = detail.invoice_status,
                objResult.customer_name = detail.customer_name,
                objResult.remarks = detail.remarks,
                objResult.total = `${detail.total}.0`,
    
                resultArr.push(objResult)
    
            }
    
            if (!invoice01) {
                return res
                    .status(404)
                    .json({
                        status: "failed",
                        message: "gagal mendapatkan invoice",
                        data: []
                    })
            }
    
            res
                .status(404)
                .json({
                    status: "success",
                    message: "success mendapatkan invoice",
                    data: resultArr
                })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    searchItems: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
            const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
            const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const { search } = req.query;
            const { is_all } = req.body;
    
            var utc = new Date();
            var day = moment(utc);
            var day2 = moment(utc).format("YYYY-MM-DD");
            let m = moment(utc);
            m.set({hour:0,minute:0,second:0,millisecond:0})
            
            const trnDoPipeline = {};
            trnDoPipeline.partner_id = req.user.id;
            if(is_all !== true) {
                trnDoPipeline.do_date = day2;
                trnDoPipeline.do_status = "Process";
            }
            
            const istrnDo = await TrnDo01.findOne(trnDoPipeline).lean();
    
            if (!istrnDo) {
                return res
                    .status(400)
                    .json({
                        status: "failed",
                        message: "tidak terdapat do",
                        data: []
                    })
            }
            
    
            let invoice01 = await TrnInvoice01.find({ doc_ref: istrnDo.do_no, invoice_status: {$ne: 'Reject'} }).lean()
           
            if (!invoice01) {
                return res
                    .status(400)
                    .json({
                        status: "failed",
                        message: "tidak terdapat invoice",
                        data: []
                    })
            }
    
    
            let idInv = [];
            for await (const invoice of invoice01) {
                idInv.push(invoice._id)
            }
    
            let invoiceDetailResult = await TrnInvoice02.find({inv_id: {$in: idInv}}).lean();
            let resultDetailId = [];
            let array_invoice_detail = [];
            for await (const detail of invoiceDetailResult) {
                const invoice_detail = {};
                invoice_detail.items_id = detail.items_id;
                invoice_detail.qty = detail.qty;
                array_invoice_detail.push(invoice_detail);
            }
            
            // api agregate
            const invoice_pipeline = await TrnInvoice02.aggregate([
                {
                    $match: {
                        inv_id: {
                            $in: idInv
                        }
                    }
                },
                {
                    $lookup: {
                        from: "trn_do_02",
                        let: {
                            "inv_items_id": "$items_id",
                            "inv_qty": "$qty",
                        },
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                        {
                                            do_id: istrnDo._id,

                                        },
                                        {
                                            $expr: {
                                                $gte: [
                                                    "$qty",
                                                    "$$inv_qty"
                                                ],

                                            },

                                        },
                                        {
                                            $expr: {
                                                $eq: ["$items_id", "$$inv_items_id"],

                                            }
                                        }
                                    ]

                                }
                            }
                        ],
                        as: "delivery_order_detail"
                    }
                },
                {
                    $project: {
                        _id: "$delivery_order_detail._id",
                        items_id: "$items_id",
                        qty: "$qty",
                    }
                },
            ]);
//            let deliveryOrderDetail;
            const deliveryOrderPipeline = [];
            if (search) {
                deliveryOrderPipeline.push({ "$match": { "_id": { "$in": invoice_pipeline } } },
                                           {
                                               $graphLookup: {
                                                   from: 'mst_items',
                                                   startWith: '$items_id',
                                                   connectFromField: '_id',
                                                   connectToField: '_id',
                                                   as: 'items'
                                               }
                                           },
                                           {
                                               $unwind: "$items"
                                           },
                                           {
                                               $match: {
                                                   "items.items_name": new RegExp(escapeRegex(search), "gi")
                                               }
                                           },
                                           {
                                               $replaceRoot: {
                                                   newRoot: {
                                                       "items_id": "$items._id",
                                                       "items_code": "$items.items_code",
                                                       "items_name": "$items.items_name",
                                                   }
                                               }
                                           })
//                deliveryOrderDetail = await TrnDo02.aggregate([
//                    { "$match": { "_id": { "$in": invoice_pipeline } } },
//                    {
//                        $graphLookup: {
//                            from: 'mst_items',
//                            startWith: '$items_id',
//                            connectFromField: '_id',
//                            connectToField: '_id',
//                            as: 'items'
//                        }
//                    },
//                    {
//                        $unwind: "$items"
//                    },
//                    {
//                        $match: {
//                            "items.items_name": new RegExp(escapeRegex(search), "gi")
//                        }
//                    },
//                    {
//                        $replaceRoot: {
//                            newRoot: {
//                                "items_id": "$items._id",
//                                "items_code": "$items.items_code",
//                                "items_name": "$items.items_name",
//                            }
//                        }
//                    }
//                ])
            }
            else {
                deliveryOrderPipeline.push({ $match: { "_id": { "$in": invoice_pipeline } } },
                                           {
                                               $graphLookup: {
                                                   from: 'mst_items',
                                                   startWith: '$items_id',
                                                   connectFromField: '_id',
                                                   connectToField: '_id',
                                                   as: 'items'
                                               }
                                           },
                                           {
                                               $unwind: {
                                                   path: "$items",
                                                   preserveNullAndEmptyArrays: true
                                               }
                                           },
                                           {
                                               $group: {
                                                   _id: "$items._id",
                                                   items_id: {"$first": "$items._id"},
                                                   items_code: {"$first": "$items.items_code"},
                                                   items_name: {"$first": "$items.items_name"},
                                                   price: {"$first": "$items.price_sell"},
                                                   replace_id: {"$first": "$items.replace_id"},
                                                   qty: {"$first": "$qty"},
                                               }
                                           },
                                           {
                                               $project: {
                                                   _id: 0,

                                               }
                                           })
//                deliveryOrderDetail = await TrnDo02.aggregate([
//                    { $match: { "_id": { "$in": invoice_pipeline } } },
//                    {
//                        $graphLookup: {
//                            from: 'mst_items',
//                            startWith: '$items_id',
//                            connectFromField: '_id',
//                            connectToField: '_id',
//                            as: 'items'
//                        }
//                    },
//                    {
//                        $unwind: {
//                            path: "$items",
//                            preserveNullAndEmptyArrays: true
//                        }
//                    },
//                    {
//                        $group: {
//                            _id: "$items._id",
//                            items_id: {"$first": "$items._id"},
//                            items_code: {"$first": "$items.items_code"},
//                            items_name: {"$first": "$items.items_name"},
//                            price: {"$first": "$items.price_sell"},
//                            replace_id: {"$first": "$items.replace_id"},
//                            qty: {"$first": "$qty"},
//                        }
//                    },
//                    {
//                        $project: {
//                            _id: 0,
//    
//                        }
//                    }
//                ])
            };
            
            const deliveryOrderDetail = await TrnDo02.aggregate(deliveryOrderPipeline)
            
             const _ = require('lodash');
            let group_invoice_items = _(array_invoice_detail)
            .groupBy('items_id')
            .map((items, id) => ({
              items_id: id,
              qty: _.sumBy(items, 'qty'),
            }))
            .value();
    
    
            let result = [];
            let items_selisih = []
            for await (const do_detail of deliveryOrderDetail) {
                const objectResult = {}
    
                let invoice = group_invoice_items.find((items) => items.items_id=== do_detail.items_id.toString());
    
    
                let sisa_qty = do_detail.qty - invoice.qty;
    
                if(sisa_qty > 0) {
                    items_selisih.push(do_detail.items_id)
                    objectResult.items_id = do_detail.items_id,
                    objectResult.items_code = do_detail.items_code,
                    objectResult.items_name = do_detail.items_name,
                    objectResult.price =  `${Math.round(do_detail.price)}`,
                    objectResult.is_container =  do_detail.replace_id ? true : false,
                    objectResult.qty = sisa_qty;
                    result.push(objectResult)
                }
            }
    
            let doDetail_sisa = await TrnDo02.aggregate([
                {
                    $match: {
                        do_id: istrnDo._id,
                        items_id: {$nin: items_selisih}
                    }
                },
                {
                    $graphLookup: {
                        from: 'mst_items',
                        startWith: '$items_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'items'
                    }
                },
                {
                    $unwind: {
                        path: "$items",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        do_detail_id: {'$first': '$_id'},
                        do_id: {'$first': '$do_id'},
                        items_id: {'$first': '$items_id'},
                        items_name: {'$first': '$items_name'},
                        items_code: {'$first': '$items.items_code'},
                        price: {'$first': '$items.price_sell'},
                        replace_id: {"$first": "$items.replace_id"},
                        total: {'$first': '$total'},
                        qty: {"$first": "$qty"},
    
    
                        totalInvoiceDetail: {'$sum': '$qty'}
                    }
                },
                {
                    $sort: {
                        'items_id': 1
                    }
                }
    
            ]);
    
            if(doDetail_sisa) {
                for await (const doDetail of doDetail_sisa) {
                    const objDetail = {};
                    objDetail.items_id = doDetail.items_id,
                    objDetail.items_code = doDetail.items_code,
                    objDetail.items_name = doDetail.items_name,
                    objDetail.price =  `${Math.round(doDetail.price)}`,
                    objDetail.is_container =  doDetail.replace_id ? true : false,
                    objDetail.qty = doDetail.qty;
    
                    result.push(objDetail)
                }
            }
    
            let sort_result =  _.sortBy(result, ['items_name'],['asc']);
            res.json({
                status: "success",
                message: "berhasil mendapatkan data",
                data: sort_result
            })
    
        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },
    
    listDoMobile: async (req, res) => {
        try {

            const connectionDB = req.user.database_connection;
            const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
    
            var utc = new Date();
            var day = moment(utc);
            let m = moment(utc);
            m.set({hour:0,minute:0,second:0,millisecond:0});
    
            const {is_all} = req.body;
    
            let deliveryorder;
            deliveryorder = await TrnDo01.find(
                { 
                    partner_id: req.user.id,
                    is_active: 1,
                    do_date: {$lte: day, $gte: m}
                },
                {
                    do_date: 1,
                    do_no: 1,
                    vehicle_no: 1,
                    do_status: 1,
                    is_active: 1
                }
            ).lean();
    
            if(is_all === true || is_all === "true") {
                deliveryorder = await TrnDo01.find(
                    { 
                        partner_id: req.user.id,
                        is_active: 1,
                    },
                    {
                        do_date: 1,
                        do_no: 1,
                        vehicle_no: 1,
                        do_status: 1,
                        is_active: 1
                    }
                ).lean();
            }
    
                
                if(!deliveryorder && deliveryorder.length <= 0) {
                    return res.json({
                        status: "failed",
                        message: "tidak terdapat transaksi delivery order",
                        data: []
                    })
                }
                
                let resultarr = []; 
                for (let i = 0; i < deliveryorder.length; i++) {
                    const objResult = {};
                    const items = deliveryorder[i];
                    objResult._id = items._id;
                    objResult.do_date = items.do_date;
                    objResult.do_no = items.do_no;
                    objResult.vehicle_no = items.vehicle_no;
                    objResult.do_status = items.do_status;
                    objResult.is_active = items.is_active === 1 ? true : false;
    
                    resultarr.push(objResult)
                }
    
    
    
            res.json({
                status: "success",
                message: "berhasil mendapatkan transaksi delivery order",
                data: resultarr
            })
    
        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },
    /**
     * controller mobile/return_items/search
     * @return {Object} - searching invoice by nama
     */
    searchDoMobile: async (req, res) => {
        try {

            const connectionDB = req.user.database_connection;
            const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));

            const { nama } = req.body;
    
            let invoice_customer = await TrnInvoice01.aggregate([
                {
                    $match: {
                        "is_active": 1,
                        "invoice_status": { $ne: "Reject" },
                        "customer_name": new RegExp(escapeRegex(nama), "gi")
                    }
                },
                {
                    $graphLookup: {
                        from: 'trn_invoice_02',
                        startWith: '$_id',
                        connectFromField: 'inv_id',
                        connectToField: 'inv_id',
                        as: 'detail_invoice'
                    }
                },
                {
                    $unwind: {
                        path: "$detail_invoice",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $graphLookup: {
                        from: 'mst_items',
                        startWith: '$detail_invoice.items_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'items'
                    }
                },
                {
                    $unwind: {
                        path: "$items",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $graphLookup: {
                        from: 'mst_customer',
                        startWith: '$customer_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'customer'
                    }
                },
                {
                    $unwind: {
                        path: "$customer",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                {
                                    "invoice_no": "$invoice_no",
                                    "customer_name": "$customer_name",
                                    "items_id": "$detail_invoice.items_id",
                                    "items_name": "$items.items_name",
                                    "qty": "$detail_invoice.qty",
                                    "address": { $ifNull: ["$alamat", "$customer.address"] }
                                }
                            ]
                        }
                    }
                }
            ])
    
            if (invoice_customer.length <= 0) {
                return res.json({
                    status: "failed",
                    message: "gagal mendapatkan invoice",
                    data: []
                })
            }
    
            res.json({
                status: "success",
                message: "berhasil mendapatkan invoice",
                data: invoice_customer
            })
    
        } catch (err) {
            return res.json(
                {
                    status: "failed",
                    message: 'server error : ' + err.message,
                    data: []
                }
            )
        }
    },

    /**
     * controller mobile/item/listimg
     * @return {Object} - item do driver
     */
    searchItemsImage: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
            const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
            const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const { search } = req.query;
            const { is_all } = req.body;

            var utc = new Date();
            var day = moment(utc);
            var day2 = moment(utc).format("YYYY-MM-DD");
            let m = moment(utc);
            m.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })

            const trnDoPipeline = {};
            trnDoPipeline.partner_id = req.user.id;
            if (is_all !== true) {
                trnDoPipeline.do_date = day2;
                trnDoPipeline.do_status = "Process";
            }

            const istrnDo = await TrnDo01.findOne(trnDoPipeline).lean();

            if (!istrnDo) {
                return res
                    .status(400)
                    .json({
                        status: "failed",
                        message: "tidak terdapat do",
                        data: []
                    })
            }


            let invoice01 = await TrnInvoice01.find({ doc_ref: istrnDo.do_no, invoice_status: { $ne: 'Reject' } }).lean()

            if (!invoice01) {
                return res
                    .status(400)
                    .json({
                        status: "failed",
                        message: "tidak terdapat invoice",
                        data: []
                    })
            }


            let idInv = [];
            for await (const invoice of invoice01) {
                idInv.push(invoice._id)
            }

            let invoiceDetailResult = await TrnInvoice02.find({ inv_id: { $in: idInv } }).lean();
            let resultDetailId = [];
            let array_invoice_detail = [];
            for await (const detail of invoiceDetailResult) {
                const invoice_detail = {};
                invoice_detail.items_id = detail.items_id;
                invoice_detail.qty = detail.qty;
                array_invoice_detail.push(invoice_detail);
            }

            // api agregate
            const invoice_pipeline = await TrnInvoice02.aggregate([
                {
                    $match: {
                        inv_id: {
                            $in: idInv
                        }
                    }
                },
                {
                    $lookup: {
                        from: "trn_do_02",
                        let: {
                            "inv_items_id": "$items_id",
                            "inv_qty": "$qty",
                        },
                        pipeline: [
                            {
                                $match: {
                                    $and: [
                                        {
                                            do_id: istrnDo._id,

                                        },
                                        {
                                            $expr: {
                                                $gte: [
                                                    "$qty",
                                                    "$$inv_qty"
                                                ],

                                            },

                                        },
                                        {
                                            $expr: {
                                                $eq: ["$items_id", "$$inv_items_id"],

                                            }
                                        }
                                    ]

                                }
                            }
                        ],
                        as: "delivery_order_detail"
                    }
                },
                {
                    $project: {
                        _id: "$delivery_order_detail._id",
                        items_id: "$items_id",
                        qty: "$qty",
                    }
                },
            ]);
            const deliveryOrderPipeline = [];
            if (search) {
                deliveryOrderPipeline.push({ "$match": { "_id": { "$in": invoice_pipeline } } },
                    {
                        $graphLookup: {
                            from: 'mst_items',
                            startWith: '$items_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'items'
                        }
                    },
                    {
                        $unwind: "$items"
                    },
                    {
                        $match: {
                            "items.items_name": new RegExp(escapeRegex(search), "gi")
                        }
                    },
                    {
                        $replaceRoot: {
                            newRoot: {
                                "items_id": "$items._id",
                                "items_code": "$items.items_code",
                                "items_name": "$items.items_name",
                                items_icon: { '$first': { $concat: ['$items.icon_path', '$items.items_icon'] } },
                            }
                        }
                    })
            }
            else {
                deliveryOrderPipeline.push({ $match: { "_id": { "$in": invoice_pipeline } } },
                    {
                        $graphLookup: {
                            from: 'mst_items',
                            startWith: '$items_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'items'
                        }
                    },
                    {
                        $unwind: {
                            path: "$items",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $group: {
                            _id: "$items._id",
                            items_id: { "$first": "$items._id" },
                            items_code: { "$first": "$items.items_code" },
                            items_name: { "$first": "$items.items_name" },
                            items_icon: { '$first': { $concat: ['$items.icon_path', '$items.items_icon'] } },
                            price: { "$first": "$items.price_sell" },
                            replace_id: { "$first": "$items.replace_id" },
                            qty: { "$first": "$qty" },
                        }
                    },
                    {
                        $project: {
                            _id: 0,

                        }
                    })
            };

            const deliveryOrderDetail = await TrnDo02.aggregate(deliveryOrderPipeline)

            const _ = require('lodash');
            let group_invoice_items = _(array_invoice_detail)
                .groupBy('items_id')
                .map((items, id) => ({
                    items_id: id,
                    qty: _.sumBy(items, 'qty'),
                }))
                .value();


            let result = [];
            let items_selisih = []
            for await (const do_detail of deliveryOrderDetail) {
                const objectResult = {}

                let invoice = group_invoice_items.find((items) => items.items_id === do_detail.items_id.toString());


                let sisa_qty = do_detail.qty - invoice.qty;

                if (sisa_qty > 0) {
                    items_selisih.push(do_detail.items_id)
                    objectResult.items_id = do_detail.items_id,
                        objectResult.items_code = do_detail.items_code,
                        objectResult.items_name = do_detail.items_name,
                        objectResult.price = `${Math.round(do_detail.price)}`,
                        objectResult.is_container = do_detail.replace_id ? true : false,
                        objectResult.qty = sisa_qty;
                        objDetail.icon = doDetail.items_icon;
                    result.push(objectResult)
                }
            }

            let doDetail_sisa = await TrnDo02.aggregate([
                {
                    $match: {
                        do_id: istrnDo._id,
                        items_id: { $nin: items_selisih }
                    }
                },
                {
                    $graphLookup: {
                        from: 'mst_items',
                        startWith: '$items_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'items'
                    }
                },
                {
                    $unwind: {
                        path: "$items",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        do_detail_id: { '$first': '$_id' },
                        do_id: { '$first': '$do_id' },
                        items_id: { '$first': '$items_id' },
                        items_name: { '$first': '$items_name' },
                        items_code: { '$first': '$items.items_code' },
                        items_icon: { '$first': { $concat: ['$items.icon_path', '$items.items_icon'] } },
                        price: { '$first': '$items.price_sell' },
                        replace_id: { "$first": "$items.replace_id" },
                        total: { '$first': '$total' },
                        qty: { "$first": "$qty" },
                        totalInvoiceDetail: { '$sum': '$qty' }
                    }
                },
                {
                    $sort: {
                        'items_id': 1
                    }
                }

            ]);

            if (doDetail_sisa) {
                for await (const doDetail of doDetail_sisa) {
                    const objDetail = {};
                    objDetail.items_id = doDetail.items_id,
                        objDetail.items_code = doDetail.items_code,
                        objDetail.items_name = doDetail.items_name,
                        objDetail.price = `${Math.round(doDetail.price)}`,
                        objDetail.is_container = doDetail.replace_id ? true : false,
                        objDetail.qty = doDetail.qty;
                        objDetail.icon = doDetail.items_icon;

                    result.push(objDetail)
                }
            }

            let sort_result = _.sortBy(result, ['items_name'], ['asc']);
            res.json({
                status: "success",
                message: "berhasil mendapatkan data",
                data: sort_result
            });
        } catch (err) {
            return res.json(
                {
                    status: "failed",
                    message: 'server error : ' + err.message,
                    data: []
                }
            )
        }
    }

}


