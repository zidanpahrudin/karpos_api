const moment = require("moment");
const connectionManager = require("../middleware/db");


module.exports = {
    OutgoingStock01: async (req, res) => {
    const connectionDB = req.user.database_connection;
    const TrnOutgoingStock01 = require("../models/TrnOutgoingStock01")(connectionManager.getConnection(connectionDB));
    const generateIsNo = require("../utils/generateIsNo")(connectionManager.getConnection(connectionDB));

    try {
        const {
            os_date,
            os_kind,
            warehouse_id,
            dest_warehouse_id,
            requester,
            os_status,
            remarks,
            is_active,
            pic_input,
            input_time
        } = req.body;

        let newTrnOutgoingStock01;

        if(os_kind=='Transfer') {
            newTrnOutgoingStock01 = new TrnOutgoingStock01({
                os_date,
                os_kind,
                warehouse_id,
                dest_warehouse_id,
                requester,
                os_status,
                remarks,
                is_active,
                pic_input,
                input_time
            });
        } else {
            newTrnOutgoingStock01 = new TrnOutgoingStock01({
                os_date,
                os_kind,
                warehouse_id,
                requester,
                os_status,
                remarks,
                is_active,
                pic_input,
                input_time
            });
        }


        newTrnOutgoingStock01.save((err, outGoingStockData) => {
            if (err) return res.json({ status: 'Failed', message: 'gagal menambahkan data outgoing stock ' + err.message, data: [] });

            return res.json({ status: 'Success', message: 'Berhasil menambahkan data outgoing stock', data: outGoingStockData })
        })

    } catch (err) {
        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
},

getOutgoingStock01: async (req, res) => {
    const connectionDB = req.user.database_connection;
    const TrnOutgoingStock01 = require("../models/TrnOutgoingStock01")(connectionManager.getConnection(connectionDB));
    let nomor = 0;
    try {
        await TrnOutgoingStock01.aggregate([
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $graphLookup: {
                    from: 'mst_warehouse',
                    startWith: '$warehouse_id',
                    connectFromField: '_id',
                    connectToField: '_id',
                    as: 'warehouse'
                },
            },
            {
                $graphLookup: {
                    from: 'mst_warehouse',
                    startWith: '$dest_warehouse_id',
                    connectFromField: '_id',
                    connectToField: '_id',
                    as: 'dest_warehouse'
                },
            },

            {
                $unwind: '$warehouse'
            },
            {
                $unwind: {
                    path: '$dest_warehouse',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [

                            {
                                "warehouse_name": '$warehouse.warehouse_name',
                                "dest_warehouse_name": '$dest_warehouse.warehouse_name',
                                "_id": "$_id",
                                "os_date": "$os_date",
                                "os_no": "$os_no",
                                "warehouse_id": "$warehouse_id",
                                "requester": "$requester",
                                "os_kind": "$os_kind",
                                "os_status": "$os_status",
                                "remarks": "$remarks",
                            }
                        ]
                    }
                }
            },


        ]).exec(async (err, outgoingStockData) => {
            if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data outgoing stock ' + err.message, data: [] });

            return res.json({
                status: 'Success',
                message: 'Success mendapatkan detail outgoing stock',
                data: outgoingStockData
            })
        })
    } catch (err) {
        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
},

getDetailOutgoingStock01: async (req, res) => {
    const connectionDB = req.user.database_connection;
    const TrnOutgoingStock01 = require("../models/TrnOutgoingStock01")(connectionManager.getConnection(connectionDB));
    await TrnOutgoingStock01.aggregate([
        {
            $match: { $expr: { $eq: ['$_id', { $toObjectId: req.params.id }] } },
        },
        {
            $graphLookup: {
                from: 'mst_warehouse',
                startWith: '$warehouse_id',
                connectFromField: '_id',
                connectToField: '_id',
                as: 'warehouse'
            },

        },
        {
            $graphLookup: {
                from: 'mst_warehouse',
                startWith: '$dest_warehouse_id',
                connectFromField: '_id',
                connectToField: '_id',
                as: 'dest_warehouse'
            },
        },
        {
            $unwind: '$warehouse'
        },
        {
            $unwind: {
                path: '$dest_warehouse',
                preserveNullAndEmptyArrays: true
            } 
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [

                        {
                            "warehouse_name": '$warehouse.warehouse_name',
                            "dest_warehouse_name": '$dest_warehouse.warehouse_name',
                            "_id": "$_id",
                            "os_date": "$os_date",
                            "os_no": "$os_no",
                            "warehouse_id": "$warehouse_id",
                            "requester": "$requester",
                            "os_kind": "$os_kind",
                            "os_status": "$os_status",
                            "remarks": "$remarks",
                        }
                    ]
                }
            }
        }
    ]).exec((err, data) => {
        if (err) return res.json({ status: 'Failed', message: 'gagal medapatkan data incoming stock', data: [] })

        if (data === null) {
            return res.json({ status: 'Failed', message: 'tidak terdapat data incoming stock', data: [] })
        }

        return res.json({ status: 'Success', message: 'success mendapatkan data incoming stock', data: data })

    });
},

updateOutgoingStock01: async (req, res) => {
    const connectionDB = req.user.database_connection;
    const TrnOutgoingStock01 = require("../models/TrnOutgoingStock01")(connectionManager.getConnection(connectionDB));
    try {
        const {
            os_date,
            warehouse_id,
            dest_warehouse_id,
            requester,
            os_status,
            remarks,
            is_active,
            pic_edit,
            edit_time
        } = req.body;

        await TrnOutgoingStock01.findOneAndUpdate(
            { _id: req.params.id },
            {
                $set: {
                    os_date,
                    warehouse_id,
                    dest_warehouse_id,
                    requester,
                    os_status,
                    remarks,
                    is_active,
                    pic_edit,
                    edit_time
                }
            }
        ).exec((err, outGoingStockUpdate) => {
            if (err) return res.json({ status: 'Failed', message: 'gagal mengupdate data outgoing stock', data: [] });

            return res.json({ status: 'Success', message: 'Berhasil mengupdate data outgoing stock', data: outGoingStockUpdate })
        })

    } catch (err) {
        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
},

deleteOutgoingStock01: async (req, res) => {
    const connectionDB = req.user.database_connection;
    const TrnOutgoingStock01 = require("../models/TrnOutgoingStock01")(connectionManager.getConnection(connectionDB));
    try {
        await TrnOutgoingStock01.findOneAndUpdate(
            { _id: req.params.id },
            {
                $set: {
                    is_active: 0,
                }
            }
        ).exec((err, outGoingStockDelete) => {
            if (err) return res.json({ status: 'Failed', message: 'gagal delete data outgoing stock', data: [] });

            return res.json({ status: 'Success', message: 'Berhasil delete data outgoing stock', data: [] })
        })
    } catch (err) {
        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
},

rejectOutgoingStock01: async (req, res) => {
    const connectionDB = req.user.database_connection;
    const TrnOutgoingStock01 = require("../models/TrnOutgoingStock01")(connectionManager.getConnection(connectionDB));
    const TrnOutgoingStock02 = require("../models/TrnOutgoingStock02")(connectionManager.getConnection(connectionDB));
    const Stock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
    const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
    const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
    try {
        const {status} = req.body;
        let tgl_skrng       = Date.now()

        // START Ditaro dibawah setelah selesai update outgoing02
        let updateTrnDo01 = await TrnOutgoingStock01.findByIdAndUpdate(req.params.id,
            {
                os_status: 'Reject'
            },
        )

    

        if(!updateTrnDo01) {
            return res.json({
                status: "failed",
                message: "gagal reject transaksi outgoing stock 01 order"
            })
        }

        // END
        
        let updateDetailTrnDo = await TrnOutgoingStock02.find({os_id: updateTrnDo01._id}).lean();

        if(updateDetailTrnDo) {
            for await (const detail of updateDetailTrnDo) {
                let old_stock = 0;
                let stockItems = await Stock.findOne(
                    {
                        items_id: detail.items_id,
                        warehouse_id: updateTrnDo01.warehouse_id,
                    }
                ).lean();


               const stockUpdate = await Stock.findByIdAndUpdate(stockItems._id,
                    {
                        items_in: detail.qty,
                        items_out: 0,
                        old_stock: stockItems.current_stock,
                        current_stock: stockItems.current_stock + detail.qty,
                        activity: "OS_RJ",
                        trn_date: moment(updateTrnDo01.os_date).format("YYYY-MM-DD"),
                        trn_month: moment(updateTrnDo01.os_date).format("MM"),
                        trn_year: moment(updateTrnDo01.os_date).format("YYYY"),
                    },
                    { upsert: true }
                );

                let stockHistoryItems = await StockHistory.find({
                    items_id: detail.items_id,
                    warehouse_id: updateTrnDo01.warehouse_id
                  }).sort({createdAt: -1}).limit(1).lean();

                

                let newHistoryStock = new StockHistory({
                    items_id: detail.items_id,
                        doc_no: updateTrnDo01.os_no,
                        warehouse_id: updateTrnDo01.warehouse_id,
                        trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                        trn_month: moment(tgl_skrng).format("MM"),
                        trn_year: moment(tgl_skrng).format("YYYY"),
                        activity: "OS_RJ",
                        qty: detail.qty,
                        old_stock: stockHistoryItems[0].current_stock,
                        current_stock: stockHistoryItems[0].current_stock + detail.qty
                });

                await newHistoryStock.save();

                var price_out = 0
                var total = 0

                await stockByDoc.find(
                    {
                        warehouse_id: updateTrnDo01.warehouse_id,
                        items_id: detail.items_id, 
                        items_remaining: { $gte: 1 } 
                    }
                ).lean()
                .exec(async (err, dataByDoc) => {
                    
                    if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });

                    let total_barang = 0
                    let sisa = 0
                    let kurang_qty = detail.qty
                    let is_stop = 0
                    for (var i = 0; i < dataByDoc.length; i++) {
                        let id_by_doc = dataByDoc[i]._id
                        if (dataByDoc[i].items_remaining >= kurang_qty) {
                            total_barang = total_barang + (kurang_qty * dataByDoc[i].items_price)
                            sisa = dataByDoc[i].items_remaining + kurang_qty
                            kurang_qty = dataByDoc[i].items_remaining + kurang_qty
                            is_stop = 1
                        } else {
                            total_barang = total_barang + (detail.qty * dataByDoc[i].items_price)
                            sisa = 0
                            kurang_qty = kurang_qty + dataByDoc[i].items_remaining
                            is_stop = 0
                        }
                        await stockByDoc.findOneAndUpdate(
                            { _id: id_by_doc }, 
                            { items_remaining: sisa }
                        )
                        if (is_stop == 1) {
                            break
                        }
                    }                    
                            
                })       

                if(updateTrnDo01.os_kind === "Transfer"){

                    let stockDestWarehouse = await Stock.findOne(
                        {
                            items_id: detail.items_id,
                            warehouse_id: updateTrnDo01.dest_warehouse_id
                        }
                    ).lean()
    
                    if(stockDestWarehouse) {
                        // reject stock
                        await Stock.findOneAndUpdate(
                            {
                                items_id: detail.items_id,
                                warehouse_id: updateTrnDo01.dest_warehouse_id
                            },
                            {
                                items_id: detail.items_id,
                                doc_no: updateTrnDo01.os_no,
                                warehouse_id: updateTrnDo01.dest_warehouse_id,
                                trn_date: moment(updateTrnDo01.os_date).format("YYYY-MM-DD"),
                                trn_month: moment(updateTrnDo01.os_date).format("MM"),
                                trn_year: moment(updateTrnDo01.os_date).format("YYYY"),
                                activity: "RJ_InTrans",
                                items_in: 0,
                                items_out: detail.qty,
                                old_stock: stockDestWarehouse.current_stock,
                                current_stock: stockDestWarehouse.current_stock - detail.qty
                            },
                            {
                                upsert: true
                            }
                        )

                        let newHistoryStockDest = new StockHistory(
                            {
                                items_id: detail.items_id,
                                doc_no: updateTrnDo01.os_no,
                                warehouse_id: updateTrnDo01.dest_warehouse_id,
                                trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                trn_month: moment(tgl_skrng).format("MM"),
                                trn_year: moment(tgl_skrng).format("YYYY"),
                                activity: "RJ_InTrans",
                                qty: detail.qty,
                                old_stock: stockDestWarehouse.current_stock,
                                current_stock: stockDestWarehouse.current_stock - detail.qty
                            }
                        )                
                        await newHistoryStockDest.save();
                        
                        // reject transfer ke gudang tujuan 
                        
                            // var price_out           = total_barang / detail.qty
                            // var total               = price_out*detail.qty
                            
                            await stockByDoc.find(
                                {
                                    warehouse_id: updateTrnDo01.dest_warehouse_id,
                                    items_id: detail.items_id, 
                                    items_remaining: { $gte: 1 } 
                                }
                            ).lean()
                            .exec(async (err, dataByDoc) => {
                                
                                if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });
            
                                let total_barang = 0
                                let sisa = 0
                                let kurang_qty = detail.qty
                                let is_stop = 0
                                for (var i = 0; i < dataByDoc.length; i++) {
                                    let id_by_doc = dataByDoc[i]._id
                                    if (dataByDoc[i].items_remaining >= kurang_qty) {
                                        total_barang = total_barang + (kurang_qty * dataByDoc[i].items_price)
                                        sisa = dataByDoc[i].items_remaining - kurang_qty
                                        kurang_qty = dataByDoc[i].items_remaining - kurang_qty
                                        is_stop = 1
                                    } else {
                                        total_barang = total_barang + (detail.qty * dataByDoc[i].items_price)
                                        sisa = 0
                                        kurang_qty = kurang_qty - dataByDoc[i].items_remaining
                                        is_stop = 0
                                    }
                                    await stockByDoc.findOneAndUpdate(
                                        { _id: id_by_doc }, 
                                        { items_remaining: sisa }
                                    )
                                    if (is_stop == 1) {
                                        break
                                    }
                                } 
                                
                                let newStockByDoc = new stockByDoc(
                                    {
                                        items_id: detail.items_id,
                                        doc_no: updateTrnDo01.os_no,
                                        warehouse_id: updateTrnDo01.dest_warehouse_id,
                                        trn_date: moment(updateTrnDo01.os_date).format("YYYY-MM-DD"),
                                        trn_month: moment(updateTrnDo01.os_date).format("MM"),
                                        trn_year: moment(updateTrnDo01.os_date).format("YYYY"),
                                        activity: "RJ_InTrans",
                                        items_in: 0,
                                        items_out: detail.qty,
                                        items_remaining: 0,
                                        old_stock: stockDestWarehouse.current_stock,
                                        current_stock: stockDestWarehouse.current_stock - detail.qty,
                                        items_price: detail.price,
                                        // qty: detail.qty,
                                    }
                                )                
                                await newStockByDoc.save();
                                        
                            })  
    
                    }   

                }
                
            }

            return res.json({
                status: "success",
                message: "berhasil reject outgoing stock",
                data: []
            })
            
        } else {
            return res.json({
                status: "failed",
                message: "gagal reject delivery order"
            })
        }
        
    } catch (err) {
        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}
}