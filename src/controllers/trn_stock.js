const moment = require("moment")
const connectionManager = require("../middleware/db");
exports.addStock = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Stock = require('../models/TrnStock')(connectionManager.getConnection(connectionDB));
    const TrnStockHist = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
    const Warehouse = require("../models/MstWarehouse")(connectionManager.getConnection(connectionDB));
    try {
        const { warehouseId, isNo } = req.query;

        await IncomingStock01.find({ warehouse_id: warehouseId, is_no: isNo }).lean();

        if (IncomingStock01.length > 0) {
            await IncomingStock01.findOneAndUpdate(
                {
                    warehouse_id: warehouseId, is_no: isNo
                },
                {
                    $set: {
                        items_in,
                        items_out,
                        old_stock,
                        current_stock
                    }
                }
            )
        } else {
            let newStock = new Stock({
                items_id,
                doc_no,
                warehouse_id,
                trn_date,
                trn_month,
                trn_year,
                activity,
                items_in,
                items_out,
                old_stock,
                current_stock
            });
            await newStock.save()
        }

    } catch (err) {
        res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}

exports.getStockByWarehouse = async (req, res) => {

    try {
        const connectionDB = req.user.database_connection;
    const Stock = require('../models/TrnStock')(connectionManager.getConnection(connectionDB));
    const TrnStockHist = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
    const Warehouse = require("../models/MstWarehouse")(connectionManager.getConnection(connectionDB));
        if (req.params.id === 'all') {
            Stock.aggregate([
                {
                    $graphLookup: {
                        from: 'mst_items',
                        startWith: '$items_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'item'
                    }
                },
                {
                    $graphLookup: {
                        from: 'mst_warehouse',
                        startWith: '$warehouse_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'warehouse'
                    }
                },
                {
                    $unwind: {
                        path: '$item',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $unwind: {
                        path: '$warehouse',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        items_id: { $first: "$items_id" },
                        items_name: { $first: "$item.items_name" },
                        items_code: { $first: "$item.items_code" },
                        price_buy: { $first: "$item.price_buy" },
                        price_sell: { $first: "$item.price_sell" },
                    }
                },
                {
                    $sort: {
                        "items_name": 1
                    }
                }
            ]).exec((err, data) => {
                res.status(200).json({ status: "success", message: "success mendapatkan data", data: data })
            })
        } else {
            await Warehouse.findById(req.params.id).exec(async (err, dataWarehouse) => {

                //    let stocks = await Stock.find({ warehouse_id: dataWarehouse._id, current_stock: { $gt: 0 } }).lean()
                Stock.aggregate([
                    {
                        $match: {
                            warehouse_id: dataWarehouse._id, current_stock: { $gt: 0 }
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'mst_items',
                            startWith: '$items_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'item'
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'mst_warehouse',
                            startWith: '$warehouse_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'warehouse'
                        }
                    },
                    {
                        $unwind: {
                            path: '$item',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $unwind: {
                            path: '$warehouse',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: "$_id",
                            items_id: "$items_id",
                            items_name: "$item.items_name",
                            items_code: "$item.items_code",
                            price_buy: "$item.price_buy",
                            price_sell: "$item.price_sell",
                            warehouse_id: "$warehouse_id",
                            trn_date: "$trn_date",
                            trn_month: "$trn_month",
                            trn_year: "$trn_year",
                            items_in: "$items_in",
                            items_out: "$items_out",
                            old_stock: "$old_stock",
                            current_stock: "$current_stock",
                            createdAt: "$createdAt",
                            updatedAt: "$updatedAt",
                            warehouse_name: "$warehouse.warehouse_name"
                        }
                    },
                    {
                        $sort: {
                            "items_name": 1
                        }
                    }
                ]).exec((err, data) => {

                    res.status(200).json({ status: "success", message: "success mendapatkan data", data: data })
                })


            })
        }

    } catch (err) {
        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}

exports.getStock = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
    const Stock = require('../models/TrnStock')(connectionManager.getConnection(connectionDB));
    const TrnStockHist = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
    const Warehouse = require("../models/MstWarehouse")(connectionManager.getConnection(connectionDB));
        const { warehouse_id, items_id, qty } = req.body;
        let stock = await Stock.findOne({ warehouse_id, items_id }).lean();

        if (stock['current_stock'] < qty) {
            return res.json({
                status: "failed",
                message: "tidak terdapat stock",
                data: stock
            })
        }

        res.json({
            status: "success",
            message: "stock di temukan",
            data: stock
        })

    } catch (err) {
        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}

exports.getHistoryStock = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
    const Stock = require('../models/TrnStock')(connectionManager.getConnection(connectionDB));
    const TrnStockHist = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
    const Warehouse = require("../models/MstWarehouse")(connectionManager.getConnection(connectionDB));
        const { start_date, end_date, warehouse_id } = req.body;
        let historyStock;
        if (warehouse_id) {
            historyStock = await TrnStockHist.aggregate([
                {
                    $match: {
                        trn_date: {
                            $gte: moment(start_date).format("YYYY-MM-DD"),
                            $lte: moment(end_date).format("YYYY-MM-DD"),
                        },
                        $expr: { $eq: ['$warehouse_id', { $toObjectId: warehouse_id }] }
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
                        path: '$items',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $graphLookup: {
                        from: 'mst_warehouse',
                        startWith: '$warehouse_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'warehouse'
                    }
                },
                {
                    $unwind: {
                        path: '$warehouse',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [

                                {
                                    "_id": "$_id",
                                    "items_id": "$items_id",
                                    "doc_no": "$doc_no",
                                    "warehouse_id": "$warehouse_id",
                                    "trn_date": "$trn_date",
                                    "trn_month": "$trn_month",
                                    "trn_year": "$trn_year",
                                    "activity": "$activity",
                                    "qty": "$qty",
                                    "old_stock": "$old_stock",
                                    "current_stock": "$current_stock",
                                    "createdAt": "$createdAt",
                                    "updatedAt": "$updatedAt",
                                    "items_code": "$items.items_code",
                                    "items_name": "$items.items_name",
                                    "items_info": "$items.items_info",
                                    "items_unit_id": "$items.items_unit_id",
                                    "items_category": "$items.items_category",
                                    "price_buy": "$items.price_buy",
                                    "price_sell": "$items.price_sell",
                                    "warehouse_name": "$warehouse.warehouse_name",
                                    "warehouse_code": "$warehouse.warehouse_code",
                                    "address": "$warehouse.address",
                                    "telp": "$warehouse.telp",
                                    "city": "$warehouse.city"
                                },
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        "_id": 1,
                        "createdAt": 1
                    }
                }
            ]);
        } else {
            historyStock = await TrnStockHist.aggregate([
                {
                    $match: {
                        trn_date: {
                            $gte: moment(start_date).format("YYYY-MM-DD"),
                            $lte: moment(end_date).format("YYYY-MM-DD")
                        }
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
                        path: '$items',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $graphLookup: {
                        from: 'mst_warehouse',
                        startWith: '$warehouse_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'warehouse'
                    }
                },
                {
                    $unwind: {
                        path: '$warehouse',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                "$items",
                                "$warehouse",
                                {
                                    "_id": "$_id",
                                    "items_id": "$items_id",
                                    "doc_no": "$doc_no",
                                    "warehouse_id": "$warehouse_id",
                                    "trn_date": "$trn_date",
                                    "trn_month": "$trn_month",
                                    "trn_year": "$trn_year",
                                    "activity": "$activity",
                                    "qty": "$qty",
                                    "old_stock": "$old_stock",
                                    "current_stock": "$current_stock",
                                    "createdAt": "$createdAt",
                                    "updatedAt": "$updatedAt",
                                    "__v": "$__v",
                                }
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        "_id": 1,
                        "createdAt": 1
                    }
                }

            ]);
        }
        res.json({
            status: "success",
            message: "history stock di temukan",
            data: historyStock
        })
    } catch (err) {
        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}