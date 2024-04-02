const moment = require("moment");
const connectionManager = require("../middleware/db");
exports.OutgoingStock02 = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Stock = require('../models/TrnStock')(connectionManager.getConnection(connectionDB));
    const stockByDoc = require('../models/TrnStockByDoc')(connectionManager.getConnection(connectionDB));
    const TrnOutgoingStock02 = require('../models/TrnOutgoingStock02')(connectionManager.getConnection(connectionDB));
    const StockHistory = require('../models/TrnStockHist')(connectionManager.getConnection(connectionDB));
    try {
        const {
            os_id,
            items_id,
            items_name,
            qty,
            // price,
            // disc_percent,
            // total,
            remarks
        } = req.body;


        let newOutgoingStock02 = new TrnOutgoingStock02({
            os_id,
            items_id,
            items_name,
            qty,
            // price,
            // disc_percent,
            // total,
            remarks
        });

        newOutgoingStock02.save(async (err, data) => {
            if (err) return res.json({ status: 'Failed', message: 'gagal menambah data outgoing stock 2 ' + err.message, data: [] });

            if (data) {

                await TrnOutgoingStock02.aggregate([
                    {
                        $match: {
                            _id: data._id
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'trn_outgoing_stock_01',
                            startWith: '$os_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'outgoingStock01'
                        },
                    },
                    {
                        $unwind: {
                            path: '$outgoingStock01',
                            preserveNullAndEmptyArrays: true

                        },

                    },
                    {
                        $replaceRoot: {
                            newRoot: {
                                $mergeObjects: [
                                    {
                                        _id: "$_id",
                                        os_id: "$os_id",
                                        items_id: "$items_id",
                                        // doc_no: "$doc_no",
                                        items_name: "$items_name",
                                        qty: "$qty",
                                        price: "$price",
                                        total: "$total",
                                        remarks: "$remarks",
                                        createdAt: "$createdAt",
                                        updatedAt: "$updatedAt",
                                    },
                                    {
                                        'warehouse_id': '$outgoingStock01.warehouse_id',
                                        'dest_warehouse_id': '$outgoingStock01.dest_warehouse_id',
                                        'os_date': '$outgoingStock01.os_date',
                                        'doc_no': '$outgoingStock01.os_no',
                                        'os_status': '$outgoingStock01.os_status',
                                        'os_kind': '$outgoingStock01.os_kind'
                                    }
                                ]
                            }
                        }
                    }
                ]).exec(async (err, dataOutgoingstock02) => {

                    if (dataOutgoingstock02) {

                        // if (dataOutgoingstock02.os_status === "Reject") {
                        //     let old_stock = 0;

                        //     await Stock.findOne({
                        //         items_id: data.items_id,
                        //         warehouse_id: dataOutgoingstock02[0].warehouse_id,

                        //     }).lean().exec(async (err, oldtrstock) => {

                        //         await Stock.findOneAndUpdate(
                        //             {
                        //                 items_id: data.items_id,
                        //                 warehouse_id: dataOutgoingstock02[0].warehouse_id
                        //             },
                        //             {
                        //                 items_in: data.qty,
                        //                 items_out: 0,
                        //                 old_stock: oldtrstock.current_stock,
                        //                 current_stock: oldtrstock.current_stock + data.qty,
                        //                 activity: "IN_TR",
                        //                 trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                        //                 trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                        //                 trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                        //             },

                        //             { new: true },
                        //         ).exec(async (err, dataStock) => {


                        //             // ", "Others", "Adjustment"
                        //             // if (dataOutgoingstock02.doc_no === "Transfer") {
                        //             //     await Stock.findOne(
                        //             //         {
                        //             //             items_id: data.items_id,
                        //             //             warehouse_id: dataOutgoingstock02[0].dest_warehouse_id
                        //             //         }
                        //             //     ).exec(async (err, dataStock) => {

                        //             //         if (!dataStock) {

                        //             //             let newStock = await Stock({
                        //             //                 items_id: data.items_id,
                        //             //                 doc_no: dataOutgoingstock02[0].doc_no,
                        //             //                 warehouse_id: dataOutgoingstock02[0].dest_warehouse_id,
                        //             //                 trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                        //             //                 trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                        //             //                 trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                        //             //                 activity: "IN_TR",
                        //             //                 items_in: data.qty,
                        //             //                 items_out: 0,
                        //             //                 old_stock: 0,
                        //             //                 current_stock: data.qty + old_stock
                        //             //             })
                        //             //             await newStock.save()

                        //             //         } else {
                        //             //             await Stock.findOne(
                        //             //                 {
                        //             //                     items_id: data.items_id,
                        //             //                     warehouse_id: dataOutgoingstock02[0].dest_warehouse_id,

                        //             //                 }).lean().exec(async (err, stock) => {

                        //             //                     await Stock.findOneAndUpdate(
                        //             //                         {
                        //             //                             items_id: data.items_id,
                        //             //                             warehouse_id: dataOutgoingstock02[0].dest_warehouse_id
                        //             //                         },
                        //             //                         {
                        //             //                             items_in: data.qty,
                        //             //                             items_out: 0,
                        //             //                             old_stock: stock.current_stock,
                        //             //                             current_stock: stock.current_stock + data.qty,
                        //             //                             activity: "IN_TR",
                        //             //                             trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                        //             //                             trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                        //             //                             trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                        //             //                         },
                        //             //                     )
                        //             //                 }
                        //             //                 )
                        //             //         }

                        //             //     })

                        //             //     // Incoming untuk Menambah ke gudang tujuan

                        //             //     // Outgoing untuk Motong gudang dari Gudang Awal
                        //             //     await StockHistory.find({ warehouse_id: dataOutgoingstock02[0].warehouse_id, items_id: data.items_id }).sort({ _id: -1 }).limit(1).exec(async (err, oldStockByDoc) => {

                        //             //         if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });
                        //             //         let old_stock = 0;
                        //             //         if (oldStockByDoc) {
                        //             //             if (oldStockByDoc[0]) {
                        //             //                 old_stock = oldStockByDoc[0].current_stock
                        //             //             } else {
                        //             //                 old_stock = 0
                        //             //             }
                        //             //         } else {
                        //             //             old_stock = 0
                        //             //         }

                        //             //         let newHistoryStock = await StockHistory({
                        //             //             items_id: data.items_id,
                        //             //             doc_no: dataOutgoingstock02[0].doc_no,
                        //             //             warehouse_id: dataOutgoingstock02[0].warehouse_id,
                        //             //             trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                        //             //             trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                        //             //             trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                        //             //             activity: "OUT_TR",
                        //             //             qty: data.qty,
                        //             //             old_stock: old_stock,
                        //             //             current_stock: old_stock - data.qty
                        //             //         })
                        //             //         await newHistoryStock.save();

                        //             //     })

                        //             //     // Incoming untuk Menambah ke gudang tujuan
                        //             //     await StockHistory.find({ warehouse_id: dataOutgoingstock02[0].dest_warehouse_id, items_id: data.items_id }).sort({ _id: -1 }).limit(1).exec(async (err, oldStockByDoc) => {

                        //             //         if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });

                        //             //         let old_stock = 0;
                        //             //         if (oldStockByDoc) {
                        //             //             if (oldStockByDoc[0]) {
                        //             //                 old_stock = oldStockByDoc[0].current_stock
                        //             //             } else {
                        //             //                 old_stock = 0
                        //             //             }
                        //             //         } else {
                        //             //             old_stock = 0
                        //             //         }

                        //             //         let newHistoryStock = await StockHistory({
                        //             //             items_id: data.items_id,
                        //             //             doc_no: dataOutgoingstock02[0].doc_no,
                        //             //             warehouse_id: dataOutgoingstock02[0].dest_warehouse_id,
                        //             //             trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                        //             //             trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                        //             //             trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                        //             //             activity: "IN_TR",
                        //             //             qty: data.qty,
                        //             //             old_stock: old_stock,
                        //             //             current_stock: old_stock + data.qty
                        //             //         })
                        //             //         await newHistoryStock.save();

                        //             //     })

                        //             // }


                        //             var price_out = 0
                        //             var total = 0

                        //             await stockByDoc.find({ warehouse_id: dataOutgoingstock02[0].warehouse_id, items_id: data.items_id, items_remaining: { $gte: 1 } }).lean().exec(async (err, dataByDoc) => {

                        //                 if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] })

                        //                 let total_barang = 0
                        //                 let sisa = 0
                        //                 let kurang_qty = data.qty
                        //                 let is_stop = 0

                        //                 for (var i = 0; i < dataByDoc.length; i++) {

                        //                     let id_by_doc = dataByDoc[i]._id
                        //                     if (dataByDoc[i].items_remaining >= kurang_qty) {
                        //                         total_barang = total_barang + (kurang_qty * dataByDoc[i].items_price)
                        //                         sisa = dataByDoc[i].items_remaining - kurang_qty
                        //                         kurang_qty = dataByDoc[i].items_remaining - kurang_qty

                        //                         is_stop = 1
                        //                     } else {
                        //                         total_barang = total_barang + (data.qty * dataByDoc[i].items_price)
                        //                         sisa = 0
                        //                         kurang_qty = kurang_qty - dataByDoc[i].items_remaining

                        //                         is_stop = 0
                        //                     }

                        //                     await stockByDoc.findOneAndUpdate({ _id: id_by_doc }, { items_remaining: sisa })

                        //                     if (is_stop == 1) {
                        //                         return false
                        //                     }

                        //                 }

                        //                 price_out = total_barang / data.qty
                        //                 total = price_out * data.qty

                        //                 let newStockByDoc = await stockByDoc({
                        //                     items_id: data.items_id,
                        //                     doc_no: dataOutgoingstock02[0].doc_no,
                        //                     warehouse_id: dataOutgoingstock02[0].dest_warehouse_id,
                        //                     trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                        //                     trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                        //                     trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                        //                     activity: "IN_TR",
                        //                     items_in: data.qty,
                        //                     items_out: 0,
                        //                     items_price: price_out,
                        //                     items_remaining: data.qty,
                        //                     old_stock: dataByDoc.current_stock,
                        //                     current_stock: dataByDoc.current_stock + data.qty
                        //                 })
                        //                 await newStockByDoc.save()
                        //             })
                        //         })
                        //     })
                        // } else {
                            let old_stock = 0;

                            await Stock.findOne({
                                items_id: data.items_id,
                                warehouse_id: dataOutgoingstock02[0].warehouse_id,

                            }).lean().exec(async (err, oldtrstock) => {

                                await Stock.findOneAndUpdate(
                                    {
                                        items_id: data.items_id,
                                        warehouse_id: dataOutgoingstock02[0].warehouse_id
                                    },
                                    {
                                        items_in: 0,
                                        items_out: data.qty,
                                        old_stock: oldtrstock.current_stock,
                                        current_stock: oldtrstock.current_stock - data.qty,
                                        activity: "OUT_TR",
                                        trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                                        trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                                        trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                                    },

                                    { new: true },
                                ).exec(async (err, dataStock) => {
                                        
                                    await Stock.findOne(
                                        {
                                            items_id: data.items_id,
                                            warehouse_id: dataOutgoingstock02[0].dest_warehouse_id
                                        }
                                    ).exec(async (err, dataStock) => {

                                        if (dataOutgoingstock02[0].os_kind === "Transfer") {

                                            if (!dataStock) {

                                                let newStock = await Stock({
                                                    items_id: data.items_id,
                                                    doc_no: dataOutgoingstock02[0].doc_no,
                                                    warehouse_id: dataOutgoingstock02[0].dest_warehouse_id,
                                                    trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                                                    trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                                                    trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                                                    activity: "IN_TR",
                                                    items_in: data.qty,
                                                    items_out: 0,
                                                    old_stock: 0,
                                                    current_stock: data.qty + old_stock
                                                })
                                                await newStock.save()

                                            } else {
                                                await Stock.findOne(
                                                    {
                                                        items_id: data.items_id,
                                                        warehouse_id: dataOutgoingstock02[0].dest_warehouse_id,

                                                    }).lean().exec(async (err, stock) => {

                                                        await Stock.findOneAndUpdate(
                                                            {
                                                                items_id: data.items_id,
                                                                warehouse_id: dataOutgoingstock02[0].dest_warehouse_id
                                                            },
                                                            {
                                                                items_in: data.qty,
                                                                items_out: 0,
                                                                old_stock: stock.current_stock,
                                                                current_stock: stock.current_stock + data.qty,
                                                                activity: "IN_TR",
                                                                trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                                                                trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                                                                trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                                                            },
                                                        )
                                                    }
                                                    )
                                            }
                                        }

                                    })
                                        
                                    // Outgoing untuk Motong gudang dari Gudang Awal
                                    await StockHistory.find({ warehouse_id: dataOutgoingstock02[0].warehouse_id, items_id: data.items_id }).sort({ _id: -1 }).limit(1).exec(async (err, oldStockByDoc) => {

                                        if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });
                                        let old_stock = 0;
                                        if (oldStockByDoc) {
                                            if (oldStockByDoc[0]) {
                                                old_stock = oldStockByDoc[0].current_stock
                                            } else {
                                                old_stock = 0
                                            }
                                        } else {
                                            old_stock = 0
                                        }

                                        let newHistoryStock = await StockHistory({
                                            items_id: data.items_id,
                                            doc_no: dataOutgoingstock02[0].doc_no,
                                            warehouse_id: dataOutgoingstock02[0].warehouse_id,
                                            trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                                            trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                                            trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                                            activity: "OUT_TR",
                                            qty: data.qty,
                                            old_stock: old_stock,
                                            current_stock: old_stock - data.qty
                                        })
                                        await newHistoryStock.save();

                                    })

                                    if (dataOutgoingstock02[0].os_kind === "Transfer") {

                                        // Incoming untuk Menambah ke gudang tujuan
                                        await StockHistory.find({ warehouse_id: dataOutgoingstock02[0].dest_warehouse_id, items_id: data.items_id }).sort({ _id: -1 }).limit(1).exec(async (err, oldStockByDoc) => {

                                            if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });

                                            let old_stock = 0;
                                            if (oldStockByDoc) {
                                                if (oldStockByDoc[0]) {
                                                    old_stock = oldStockByDoc[0].current_stock
                                                } else {
                                                    old_stock = 0
                                                }
                                            } else {
                                                old_stock = 0
                                            }

                                            let newHistoryStock = StockHistory({
                                                items_id: data.items_id,
                                                doc_no: dataOutgoingstock02[0].doc_no,
                                                warehouse_id: dataOutgoingstock02[0].dest_warehouse_id,
                                                trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                                                trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                                                trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                                                activity: "IN_TR",
                                                qty: data.qty,
                                                old_stock: old_stock,
                                                current_stock: old_stock + data.qty
                                            })
                                            await newHistoryStock.save();

                                        })

                                    }


                                    var price_out = 0
                                    var total = 0

                                    await stockByDoc.find({warehouse_id: dataOutgoingstock02[0].warehouse_id,items_id: data.items_id, 
                                        items_remaining: { $gte: 1 } }).lean().exec(async (err, dataByDoc) => {
                                        if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] })

                                        let total_barang = 0
                                        let sisa = 0
                                        let kurang_qty = data.qty
                                        let is_stop = 0

                                        for (var i = 0; i < dataByDoc.length; i++) {

                                            let id_by_doc = dataByDoc[i]._id
                                            if (dataByDoc[i].items_remaining >= kurang_qty) {
                                                total_barang = total_barang + (kurang_qty * dataByDoc[i].items_price)
                                                sisa = dataByDoc[i].items_remaining - kurang_qty
                                                kurang_qty = dataByDoc[i].items_remaining - kurang_qty

                                                is_stop = 1
                                            } else {
                                                total_barang = total_barang + (data.qty * dataByDoc[i].items_price)
                                                sisa = 0
                                                kurang_qty = kurang_qty - dataByDoc[i].items_remaining

                                                is_stop = 0
                                            }

                                            await stockByDoc.findOneAndUpdate({ _id: id_by_doc }, { items_remaining: sisa })

                                            if (is_stop == 1) {
                                                break
                                            }

                                        }
                                        
                                        price_out           = total_barang / data.qty
                                        total               = price_out*data.qty
                                        if (dataOutgoingstock02[0].os_kind === "Transfer") {
                                            await stockByDoc.findOne({ 
                                                warehouse_id: dataOutgoingstock02[0].dest_warehouse_id, 
                                                items_id: data.items_id}).sort({_id: -1}).lean().exec(async (err, dataByDocDetail) => {
                                                    
                                                if(dataByDocDetail){
                                                    var current_stock_by_doc       = dataByDocDetail.current_stock
                                                }else{
                                                    var current_stock_by_doc       = 0
                                                }
                                                
                                                let newStockByDoc = stockByDoc({
                                                    items_id: data.items_id,
                                                    doc_no: dataOutgoingstock02[0].doc_no,
                                                    warehouse_id: dataOutgoingstock02[0].dest_warehouse_id,
                                                    trn_date: moment(dataOutgoingstock02[0].os_date).format("YYYY-MM-DD"),
                                                    trn_month: moment(dataOutgoingstock02[0].os_date).format("MM"),
                                                    trn_year: moment(dataOutgoingstock02[0].os_date).format("YYYY"),
                                                    activity: "IN_TR",
                                                    items_in: data.qty,
                                                    items_out: 0,
                                                    items_price: price_out,
                                                    items_remaining: data.qty,
                                                    old_stock: current_stock_by_doc,
                                                    current_stock: data.qty + current_stock_by_doc
                                                })
                                                await newStockByDoc.save()
        
                                            })  
                                        }       

                                    })                                                               

                                })
                            })
                        // }
                    }

                })
            }

            return res.json({ status: 'Success', message: 'data berhasil di simpan', data: data })
        })

    } catch (err) {
        return res.status(500).json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })

    }
}

exports.getOutgoingStock02 = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const TrnOutgoingStock02 = require('../models/TrnOutgoingStock02')(connectionManager.getConnection(connectionDB));
    try {
        await TrnOutgoingStock02.aggregate([
            {
                $graphLookup: {
                    from: 'trn_outgoing_stock_01',
                    startWith: '$os_id',
                    connectFromField: '_id',
                    connectToField: '_id',
                    as: 'trn_outgoing_stock01'
                }
            },
            {
                $unwind: {
                    path: "$trn_outgoing_stock01",
                    preserveNullAndEmptyArrays: true
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
                },
            },
            {
                $project: {
                    os2_id: "$_id",
                    os_id: "$os_id",
                    items_id: "$items_id",
                    items_name: "$items_name",
                    qty: "$qty",
                    remarks: "",
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                    os_date: "$trn_outgoing_stock01.os_date",
                    os_no: "$trn_outgoing_stock01.os_no",
                    warehouse_id: "$trn_outgoing_stock01.warehouse_id",
                    dest_warehouse_id: "$trn_outgoing_stock01.dest_warehouse_id",
                    requester: "$trn_outgoing_stock01.requester",
                    os_kind: "$trn_outgoing_stock01.os_kind",
                    os_status: "$trn_outgoing_stock01.os_status",
                    remarks: "$trn_outgoing_stock01.remarks",
                    is_active: "$trn_outgoing_stock01.is_active",
                    pic_input: "$trn_outgoing_stock01.pic_input",
                    items: { $ifNull: ["$items", ""] }
                }
            }
        ]).exec((err, dataOutgoingStock02) => {

            if (!dataOutgoingStock02 || dataOutgoingStock02.length < 0) {
                return res
                    .json({
                        status: 'success',
                        message: 'no additional content to send',
                        data: dataOutgoingStock02
                    })
            }
            return res
                .status(200)
                .json({
                    status: 'success',
                    message: 'success data found',
                    data: dataOutgoingStock02
                })
        })
    } catch (err) {
        return res
            .status(500)
            .json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}

exports.getOutgoingStock02Detail = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const TrnOutgoingStock02 = require('../models/TrnOutgoingStock02')(connectionManager.getConnection(connectionDB));
    try {
        await TrnOutgoingStock02.aggregate([
            { $match: { $expr: { $eq: ['$os_id', { $toObjectId: req.params.id }] } } },
            {
                $graphLookup: {
                    from: 'trn_outgoing_stock_01',
                    startWith: '$os_id',
                    connectFromField: '_id',
                    connectToField: '_id',
                    as: 'trn_outgoing_stock01'
                }
            },
            {
                $unwind: {
                    path: "$trn_outgoing_stock01",
                    preserveNullAndEmptyArrays: true
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
                },
            },
            {
                $project: {
                    os2_id: "$_id",
                    os_id: "$os_id",
                    items_id: "$items_id",
                    items_name: "$items_name",
                    qty: "$qty",
                    remarks: "",
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                    // os_date: "$trn_outgoing_stock01.os_date",
                    // os_no: "$trn_outgoing_stock01.os_no",
                    // warehouse_id: "$trn_outgoing_stock01.warehouse_id",
                    // dest_warehouse_id: "$trn_outgoing_stock01.dest_warehouse_id",
                    // requester: "$trn_outgoing_stock01.requester",
                    // os_kind: "$trn_outgoing_stock01.os_kind",
                    // os_status: "$trn_outgoing_stock01.os_status",
                    // remarks: "$trn_outgoing_stock01.remarks",
                    // is_active: "$trn_outgoing_stock01.is_active",
                    // pic_input: "$trn_outgoing_stock01.pic_input",
                    items: { $ifNull: ["$items", ""] }
                }
            }
        ]).exec((err, dataOutgoingStock02) => {

            if (!dataOutgoingStock02 || dataOutgoingStock02.length < 0) {
                return res
                    .json({
                        status: 'success',
                        message: 'no additional content to send',
                        data: dataOutgoingStock02
                    })
            }
            return res
                .status(200)
                .json({
                    status: 'success',
                    message: 'success data found',
                    data: dataOutgoingStock02
                })
        })
    } catch (err) {
        return res
            .status(500)
            .json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}

exports.deleteOutgoingStock02 = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const TrnOutgoingStock02 = require('../models/TrnOutgoingStock02')(connectionManager.getConnection(connectionDB));
    try {
        await TrnOutgoingStock02.findByIdAndUpdate(
            { _id: req.params.id },
            {
                is_active: 0
            }
        ).exec((err, OutgoingStock02) => {
            return res
                .json({
                    status: "success",
                    message: "success menghapus data",
                    data: []
                })
        })
    } catch (err) {
        return res
            .status(500)
            .json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}