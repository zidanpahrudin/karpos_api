const moment = require("moment");
const connectionManager = require("../middleware/db");
module.exports = {
    addIncomingStock02: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Stock = require('../models/TrnStock')(connectionManager.getConnection(connectionDB));
        const stockByDoc = require('../models/TrnStockByDoc')(connectionManager.getConnection(connectionDB));
        const IncomingStock02 = require('../models/TrnIncomingStock02')(connectionManager.getConnection(connectionDB));
        const StockHistory = require('../models/TrnStockHist')(connectionManager.getConnection(connectionDB));
        try {
            const {
                is_id,
                items_id,
                items_name,
                qty,
                price,
                total,
                remarks,
            } = req.body;
    
    
            let newIncomingStock02 = new IncomingStock02({
                is_id,
                items_id,
                items_name,
                qty,
                price,
                total,
                remarks,
            });
    
            let tgl_skrng       = Date.now()
    
            newIncomingStock02.save(async (err, data) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal menambah data incoming stock 2', data: [] });
    
                if (data) {
    
                    await IncomingStock02.aggregate([
                        {
                            $match: {
                                _id: data._id
                            }
                        },
                        {
                            $graphLookup: {
                                from: 'trn_incoming_stock_01',
                                startWith: '$is_id',
                                connectFromField: '_id',
                                connectToField: '_id',
                                as: 'incomingStock_01'
                            },
                        },
                        {
                            $unwind: '$incomingStock_01'
                        },
                        {
                            $replaceRoot: {
                                newRoot: {
                                    $mergeObjects: [
                                        {
                                            _id: "$_id",
                                            is_id: "$is_id",
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
                                            'warehouse_id': '$incomingStock_01.warehouse_id',
                                            'is_date': '$incomingStock_01.is_date',
                                            'doc_no': '$incomingStock_01.is_no',
                                            'is_status': '$incomingStock_01.is_status'
                                        }
                                    ]
                                }
                            }
                        }
                    ]).exec(async (err, dataIncomingStock2) => {
                        
                        // jika status reject is01 reject, stock tidak jadi bertambah
                        if (dataIncomingStock2[0].is_status === "Reject") {
                            let old_stock = 0;
    
                            let isStockAvaliable = await Stock.findOne({warehouse_id: dataIncomingStock2[0].warehouse_id, items_id: data.items_id, current_stock: { $gte: data.qty}}).lean();
    
                            if(!isStockAvaliable) {
                                return res
                                    .status(400)
                                    .json({
                                        status: "failed",
                                        message: "stock tidak mencukupi",
                                        data: []
                                    })
                            }
                            await stockByDoc.findOne({ warehouse_id: dataIncomingStock2[0].warehouse_id, items_id: data.items_id }).sort({ _id: -1 }).exec(async (err, oldStockByDoc) => {
    
                                if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });
    
                                old_stock = oldStockByDoc.current_stock ? oldStockByDoc.current_stock : 0;
    
                                let newStockByDoc = await stockByDoc({
                                    items_id: data.items_id,
                                    doc_no: dataIncomingStock2[0].doc_no,
                                    warehouse_id: dataIncomingStock2[0].warehouse_id,
                                    trn_date: moment(dataIncomingStock2[0].is_date).format("YYYY-MM-DD"),
                                    trn_month: moment(dataIncomingStock2[0].is_date).format("MM"),
                                    trn_year: moment(dataIncomingStock2[0].is_date).format("YYYY"),
                                    activity: "IN_DO",
                                    items_in: 0,
                                    items_out: data.qty,
                                    items_price: data.price,
                                    items_remaining: old_stock - data.qty,
                                    old_stock: old_stock,
                                    current_stock: old_stock - data.qty,
                                    createdAt: moment().startOf('month').format('YYYY-MM-DD hh:mm'),
                                })
                                await newStockByDoc.save()
    
                                let newHistoryStock = await StockHistory({
                                    items_id: data.items_id,
                                    doc_no: dataIncomingStock2[0].doc_no,
                                    warehouse_id: dataIncomingStock2[0].warehouse_id,
                                    trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                    trn_month: moment(tgl_skrng).format("MM"),
                                    trn_year: moment(tgl_skrng).format("YYYY"),
                                    activity: "IN_DO",
                                    qty: old_stock - data.qty,
                                    old_stock: old_stock,
                                    current_stock: old_stock - data.qty,
                                    createdAt: moment().startOf('month').format('YYYY-MM-DD hh:mm'),
                                })
    
                                await newHistoryStock.save();
                            })
    
                            await Stock.findOne(
                                {
                                    items_id: data.items_id,
                                    warehouse_id: dataIncomingStock2[0].warehouse_id
                                }
                            ).exec(async (err, dataStock) => {
    
                                if (!dataStock) {
    
                                    let newStock = await Stock({
                                        items_id: data.items_id,
                                        doc_no: dataIncomingStock2[0].doc_no,
                                        warehouse_id: dataIncomingStock2[0].warehouse_id,
                                        trn_date: moment(dataIncomingStock2[0].is_date).format("YYYY-MM-DD"),
                                        trn_month: moment(dataIncomingStock2[0].is_date).format("MM"),
                                        trn_year: moment(dataIncomingStock2[0].is_date).format("YYYY"),
                                        activity: "IN_DO",
                                        items_in: 0,
                                        items_out: old_stock - data.qty,
                                        old_stock: old_stock,
                                        current_stock: old_stock - data.qty,
                                        createdAt: moment().startOf('month').format('YYYY-MM-DD hh:mm'),
                                    })
                                    await newStock.save()
                                } else {
    
                                    await Stock.findOne(
                                        {
                                            items_id: data.items_id,
                                            warehouse_id: dataIncomingStock2[0].warehouse_id,
    
                                        }).lean().exec(async (err, stock) => {
    
                                            await Stock.findOneAndUpdate(
                                                {
                                                    items_id: data.items_id,
                                                    warehouse_id: dataIncomingStock2[0].warehouse_id
                                                },
                                                {
                                                    items_in: 0,
                                                    items_out: stock.current_stock - data.qty,
                                                    old_stock: stock.current_stock,
                                                    current_stock: stock.current_stock - data.qty,
                                                    activity: "IN_DO",
                                                    trn_date: moment(dataIncomingStock2[0].is_date).format("YYYY-MM-DD"),
                                                    trn_month: moment(dataIncomingStock2[0].is_date).format("MM"),
                                                    trn_year: moment(dataIncomingStock2[0].is_date).format("YYYY"),
                                                },
                                            )
                                        })
                                }
    
                            })
    
                            return res
                                .status(200)
                                .json({
                                    status: 'success',
                                    message: 'berhasil update data',
                                    data: data
                                })
                        } else {
                            let old_stock = 0;
                            await stockByDoc.find({ warehouse_id: dataIncomingStock2[0].warehouse_id, items_id: data.items_id }).sort({ _id: -1 }).limit(1).exec(async (err, oldStockByDoc) => {
        
                                if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });
                                // if(oldStockByDoc) {
        
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
        
                                let newStockByDoc = await stockByDoc({
                                    items_id: data.items_id,
                                    doc_no: dataIncomingStock2[0].doc_no,
                                    warehouse_id: dataIncomingStock2[0].warehouse_id,
                                    trn_date: moment(dataIncomingStock2[0].is_date).format("YYYY-MM-DD"),
                                    trn_month: moment(dataIncomingStock2[0].is_date).format("MM"),
                                    trn_year: moment(dataIncomingStock2[0].is_date).format("YYYY"),
                                    activity: "IN_DO",
                                    items_in: data.qty,
                                    items_out: 0,
                                    items_price: data.price,
                                    items_remaining: data.qty,
                                    old_stock: old_stock,
                                    current_stock: data.qty + old_stock
                                })
                                await newStockByDoc.save()
        
                                let newHistoryStock = await StockHistory({
                                    items_id: data.items_id,
                                    doc_no: dataIncomingStock2[0].doc_no,
                                    warehouse_id: dataIncomingStock2[0].warehouse_id,
                                    trn_date: moment(dataIncomingStock2[0].is_date).format("YYYY-MM-DD"),
                                    trn_month: moment(dataIncomingStock2[0].is_date).format("MM"),
                                    trn_year: moment(dataIncomingStock2[0].is_date).format("YYYY"),
                                    activity: "IN_DO",
                                    qty: data.qty,
                                    old_stock: old_stock,
                                    current_stock: data.qty + old_stock
                                })
        
                                await newHistoryStock.save();
                                // }
                            })
        
                            await Stock.findOne(
                                {
                                    items_id: data.items_id,
                                    warehouse_id: dataIncomingStock2[0].warehouse_id
                                }
                            ).exec(async (err, dataStock) => {
        
                                if (!dataStock) {
        
                                    let newStock = await Stock({
                                        items_id: data.items_id,
                                        doc_no: dataIncomingStock2[0].doc_no,
                                        warehouse_id: dataIncomingStock2[0].warehouse_id,
                                        trn_date: moment(dataIncomingStock2[0].is_date).format("YYYY-MM-DD"),
                                        trn_month: moment(dataIncomingStock2[0].is_date).format("MM"),
                                        trn_year: moment(dataIncomingStock2[0].is_date).format("YYYY"),
                                        activity: "IN_DO",
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
                                            warehouse_id: dataIncomingStock2[0].warehouse_id,
        
                                        }).lean().exec(async (err, stock) => {
        
                                            await Stock.findOneAndUpdate(
                                                {
                                                    items_id: data.items_id,
                                                    warehouse_id: dataIncomingStock2[0].warehouse_id
                                                },
                                                {
                                                    items_in: data.qty,
                                                    items_out: 0,
                                                    old_stock: stock.current_stock,
                                                    current_stock: stock.current_stock + data.qty,
                                                    activity: "IN_DO",
                                                    trn_date: moment(dataIncomingStock2[0].is_date).format("YYYY-MM-DD"),
                                                    trn_month: moment(dataIncomingStock2[0].is_date).format("MM"),
                                                    trn_year: moment(dataIncomingStock2[0].is_date).format("YYYY"),
                                                },
                                            )
                                        })
                                }
        
                            })
                            return res.json({ status: 'Success', message: 'data berhasil di simpan', data: data })
    
                        }
                        
    
    
                    })
                }
    
            })
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    
        }
    },
    
    getIncomingStock02: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const IncomingStock02 = require('../models/TrnIncomingStock02')(connectionManager.getConnection(connectionDB));
        try {
            const { isId } = req.query;
            const { id } = req.params;
            if (id) {
                await IncomingStock02.aggregate([
                    {
                        $match: { $expr: { $eq: ['$_id', { $toObjectId: id }] } }
                    },
                    {
                        $graphLookup: {
                            from: 'trn_incoming_stock_01',
                            startWith: '$is_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'incomming_stock01'
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
                            'path': '$incomming_stock01'
                        }
                    },
                    {
                        $unwind: {
                            'path': '$items'
                        }
                    },
                    {
                        $replaceRoot: {
                            newRoot: {
                                $mergeObjects: [
    
                                    {
                                        "_id": "$_id",
                                        "is_id": "$incomming_stock01._id",
                                        "items_id": "$items._id",
                                        "qty": "$qty",
                                        "price": "$price",
                                        "total": "$total",
                                        "remarks": "$remarks",
                                        "createdAt": "$createdAt",
                                        "updatedAt": "$updatedAt",
                                    },
                                    '$incomming_stock01',
                                    '$items'
                                ]
                            }
                        }
                    },
                ]).exec((err, data) => {
                    if (err) return res.json({ status: 'Failed', message: 'gagal medapatkan data incoming stock 02 ' + err.message, data: [] })
    
                    if (data === null) {
                        return res.json({ status: 'Failed', message: 'tidak terdapat data incoming stock 02', data: [] })
                    }
    
                    return res.json({ status: 'Success', message: 'success mendapatkan data incoming stock 02', data: data })
    
                });
            } else if (isId) {
                await IncomingStock02.aggregate([
                    {
                        $match: { $expr: { $eq: ['$is_id', { $toObjectId: isId }] } }
                    }, 
                    {
                        $graphLookup: {
                            from: 'trn_incoming_stock_01',
                            startWith: '$is_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'incomming_stock01'
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
                            'path': '$incomming_stock01'
                        }
                    },
                    {
                        $unwind: {
                            'path': '$items'
                        }
                    },
                    {
                        $replaceRoot: {
                            newRoot: {
                                $mergeObjects: [
    
                                    {
                                        "_id": "$_id",
                                        "is_id": "$incomming_stock01._id",
                                        "items_id": "$items._id",
                                        "qty": "$qty",
                                        "price": "$price",
                                        "total": "$total",
                                        "remarks": "$remarks",
                                        "createdAt": "$createdAt",
                                        "updatedAt": "$updatedAt",
                                    },
                                    '$incomming_stock01',
                                    '$items'
                                ]
                            }
                        }
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    },
                ]).exec((err, data) => {
    
                    if (err) return res.json({ status: 'Failed', message: 'gagal medapatkan data incoming stock 02 ' + err.message, data: [] })
    
                    if (data === null) {
                        return res.json({ status: 'Failed', message: 'tidak terdapat data incoming stock 02', data: [] })
                    }
    
                    return res.json({ status: 'Success', message: 'success mendapatkan data incoming stock 02', data: data })
    
                });
            }
            else {
                await IncomingStock02.aggregate([
                    {
                        $graphLookup: {
                            from: 'trn_incoming_stock_01',
                            startWith: '$is_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'incomming_stock01'
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
                            'path': '$incomming_stock01'
                        }
                    },
                    {
                        $unwind: {
                            'path': '$items'
                        }
                    },
                    {
                        $replaceRoot: {
                            newRoot: {
                                $mergeObjects: [
    
                                    {
                                        "_id": "$_id",
                                        "is_id": "$incomming_stock01._id",
                                        "items_id": "$items._id",
                                        "qty": "$qty",
                                        "price": "$price",
                                        "total": "$total",
                                        "remarks": "$remarks",
                                        "createdAt": "$createdAt",
                                        "updatedAt": "$updatedAt",
                                    },
                                    '$incomming_stock01',
                                    '$items'
                                ]
                            }
                        }
                    },
                ]).exec((err, data) => {
                    if (err) return res.json({ status: 'Failed', message: 'gagal medapatkan data incoming stock 02 ' + err.message, data: [] })
    
                    if (data === null) {
                        return res.json({ status: 'Failed', message: 'tidak terdapat data incoming stock 02', data: [] })
                    }
    
                    return res.json({ status: 'Success', message: 'success mendapatkan data incoming stock 02', data: data })
    
                });
            }
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    
        }
    },
    
    deleteIncomingStock02: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const IncomingStock02 = require('../models/TrnIncomingStock02')(connectionManager.getConnection(connectionDB));
        const { id } = req.params
        await IncomingStock02.findOneAndRemove(
            { _id: id },
        ).exec((err, data) => {
            if (err) return res.json({ status: 'Failed', message: 'gagal menghapus data incoming stock 02', data: [] })
    
            return res.json({
                status: 'Success',
                message: 'Berhasil menghapus data incoming stock 02',
                data: []
            })
        })
    },
    
    addStockHistory: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const StockHistory = require('../models/TrnStockHist')(connectionManager.getConnection(connectionDB));
        try {
            const {
                items_id,
                doc_no,
                warehouse_id,
                trn_date,
                trn_month,
                trn_year,
                activity,
                qty,
                old_stock,
                current_stock
            } = req.body;
    
            let newStockHistoty = new StockHistory({
                items_id,
                doc_no,
                warehouse_id,
                trn_date,
                trn_month,
                trn_year,
                activity,
                qty,
                old_stock,
                current_stock
            });
            await newStockHistoty.save((err, data) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal medapatkan data incoming stock 02', data: [] })
                return res.json({
                    status: 'Success',
                    message: 'berhasil menyimpan stock histor',
                    data: data
                })
            })
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    
    }
}