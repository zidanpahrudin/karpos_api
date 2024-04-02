const moment = require("moment");
const connectionManager = require("../middleware/db");
module.exports = {
    addIncomingStock01: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const IncomingStock01 = require('../models/TrnIncomingStock01')(connectionManager.getConnection(connectionDB));
        try {
            let att_file_image = "";
            let att_file_tautan = "";
            
            const {
                is_date,
                supp_no,
                warehouse_id,
                is_status,
                doc_ref,
                sender_pic,
                receiver_pic,
                remarks,
                is_kind,
                is_active,
                pic_input,
                input_time,
                pic_edit,
                edit_time
            } = req.body;
            
            if(req.file) {
                att_file_image = req.file.filename
                att_file_tautan = "https://karboe.tech/images/incomingstock01/"
            }
    
            let newIncomingStock = new IncomingStock01({
                is_date: is_date,
                supp_no,
                att_file: att_file_image,
                tautan: att_file_tautan,
                warehouse_id,
                is_status,
                doc_ref,
                sender_pic,
                receiver_pic,
                remarks,
                is_kind,
                is_active,
                pic_input,
                input_time,
                pic_edit,
                edit_time
            });

    
            await newIncomingStock.save((err, data) => {
               
                if (err) return res.json({ status: 'Failed', message: 'gagal menambahkan data incoming stock' + err.message, data: [] });
    
                return res.json({ status: 'Success', message: 'Berhasil menambahkan data incoming stock', data: data })
            })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getIncomingStock01: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const IncomingStock01 = require('../models/TrnIncomingStock01')(connectionManager.getConnection(connectionDB));
        const { id } = req.params;
        if(id){
            await IncomingStock01.aggregate([
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
                }
            },
            {
                $unwind: '$warehouse'
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            {
                                "_id": "$_id",
                                "is_date": "$is_date",
                                "is_no": "$is_no",
                                "warehouse_id": "$warehouse_id",
                                "is_status": "$is_status",
                                "do_supplier": "$do_supplier",
                                "sender_pic": "$sender_pic",
                                "receiver_pic": "$receiver_pic",
                                "remarks": "$remarks",
                                "is_kind": "$is_kind",
                                "is_active": "$is_active",
                                "pic_input": "$pic_input",
                                "input_time": "$input_time",
                                "edit_time": "$edit_time",
                                "createdAt": "$createdAt",
                                "updatedAt": "$updatedAt",
                                "doc_ref": "$doc_ref",
                            },
                            {'warehouse_name': '$warehouse.warehouse_name'},
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
                if (err) return res.json({ status: 'Failed', message: 'gagal medapatkan data incoming stock', data: [] })
    
                if (data === null) {
                    return res.json({ status: 'Failed', message: 'tidak terdapat data incoming stock', data: [] })
                }
    
                return res.json({ status: 'Success', message: 'success mendapatkan data incoming stock', data: data })
    
            });
        }
        else{
            await IncomingStock01.aggregate([
                {
                    $match: {is_active: 1}
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
                    $unwind: '$warehouse'
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                {
                                    "_id": "$_id",
                                    "image_url": {$cond: [
                                        { $eq: [{ $type: "$att_file" }, "string"] },
                                        { $ifNull: [{$concat: ["$tautan", "$att_file"]}, ""] },
                                        ""
                                    ]},
//                                    {$ifNull: [{$concat: ["https://karboe.tech", "$tautan", "$att_file"]}, ""]},
                                    "is_date": "$is_date",
                                    "is_no": "$is_no",
                                    "warehouse_id": "$warehouse_id",
                                    "is_status": "$is_status",
                                    "do_supplier": "$do_supplier",
                                    "sender_pic": "$sender_pic",
                                    "receiver_pic": "$receiver_pic",
                                    "remarks": "$remarks",
                                    "is_kind": "$is_kind",
                                    "is_active": "$is_active",
                                    "pic_input": "$pic_input",
                                    "input_time": "$input_time",
                                    "edit_time": "$edit_time",
                                    "createdAt": "$createdAt",
                                    "updatedAt": "$updatedAt",
                                    "doc_ref": "$doc_ref",
                                    "tautan": "$tautan",
                                    "att_file": "$att_file",
                                },
                                {'warehouse_name': '$warehouse.warehouse_name'},
                            ]
                        }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
            ])
            .exec((err, data) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal medapatkan data incoming stock', data: [] })
        
                if (data === null) {
                    return res.json({ status: 'Failed', message: 'tidak terdapat data incoming stock', data: [] })
                }

    
                return res.json({ status: 'Success', message: 'success mendapatkan data incoming stock', data: data })
    
            });
        }
            
    },
    
    deleteIncomingStock01: async (req, res) => {
        const { id } = req.params
        const connectionDB = req.user.database_connection;
        const IncomingStock01 = require('../models/TrnIncomingStock01')(connectionManager.getConnection(connectionDB));
        await IncomingStock01.findOneAndUpdate(
            { _id: id },
            {
                $set: {
                    is_active: 0
                }
            }
        ).exec((err, data) => {
            if (err) return res.json({ status: 'Failed', message: 'gagal menghapus data incoming stock', data: [] })
        
            return res.json({
                status: 'Success',
                message: 'Berhasil menghapus data incoming stock',
                data: []
            })
        })
    },
    
    rejectIncomingStock01: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const IncomingStock01 = require('../models/TrnIncomingStock01')(connectionManager.getConnection(connectionDB));
            const IncomingStock02 = require('../models/TrnIncomingStock02')(connectionManager.getConnection(connectionDB));
            const Stock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
            const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
            const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
            const { id } = req.params;
            let tgl_skrng       = Date.now()
            let rejectIncomingStock = await IncomingStock01.findById(id);

                if(rejectIncomingStock) {
                        
                
                    let IncomingStockDetail = await IncomingStock02.find({is_id: rejectIncomingStock._id})
    
                    // let old_stock = 0;
                    for await (const detail of IncomingStockDetail) {
                        let isStockAvaliable = await Stock.findOne({warehouse_id: rejectIncomingStock.warehouse_id, items_id: detail.items_id, current_stock: { $gte: detail.qty}}).lean();
                        if(!isStockAvaliable) {
                            return res
                                .json({
                                    status: "failed",
                                    message: "stock tidak mencukupi",
                                    data: []
                                })
                        }
                        
                        const DocStock = await stockByDoc.find({
                            warehouse_id: rejectIncomingStock.warehouse_id, 
                            items_id: detail.items_id
                        }).sort({createdAt: -1}).limit(1).lean();
                        

                        if(DocStock) {
                            await stockByDoc.findByIdAndUpdate(
                                DocStock[0]._id,
                                {
                                    items_id: DocStock[0].items_id,
                                    doc_no: DocStock[0].doc_no,
                                    warehouse_id: DocStock[0].warehouse_id,
                                    trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                    trn_month: moment(tgl_skrng).format("MM"),
                                    trn_year: moment(tgl_skrng).format("YYYY"),
                                    activity: "IN_RJ",
                                    items_in: 0,
                                    items_out: detail.qty,
                                    items_price: detail.price,
                                    items_remaining: DocStock[0].current_stock - detail.qty,
                                    old_stock: DocStock[0].current_stock,
                                    current_stock: DocStock[0].current_stock - detail.qty,
                                    createdAt: moment().startOf('month').format('YYYY-MM-DD hh:mm'),
                                }
                            )
                        }
                        // update stock history
                        const historyStock = await StockHistory.find({
                            items_id: detail.items_id, 
                            warehouse_id: rejectIncomingStock.warehouse_id
                        }).sort({createdAt: -1}).limit(1).lean();

                        if(historyStock) {
                            
                            let newHistoryStock = new StockHistory({
                                items_id: historyStock[0].items_id,
                                doc_no: historyStock[0].doc_no,
                                warehouse_id: historyStock[0].warehouse_id,
                                trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                trn_month: moment(tgl_skrng).format("MM"),
                                trn_year: moment(tgl_skrng).format("YYYY"),
                                activity: "IN_RJ",
                                qty: detail.qty,
                                old_stock: historyStock[0].current_stock,
                                current_stock: historyStock[0].current_stock - detail.qty,
                                createdAt: moment().startOf('month').format('YYYY-MM-DD hh:mm'),
                            })
        
                            await newHistoryStock.save();
                        }

                        const stockItems = await Stock.findOne(
                            {
                                items_id: detail.items_id,
                                warehouse_id: rejectIncomingStock.warehouse_id
                            }).lean();

                        if(stockItems) {
                            await Stock.findOneAndUpdate(
                            {
                                items_id: detail.items_id,
                                warehouse_id: rejectIncomingStock.warehouse_id
                            },
                            {
                                items_in: 0,
                                items_out: detail.qty,
                                old_stock: stockItems.current_stock,
                                current_stock: stockItems.current_stock - detail.qty,
                                activity: "IN_RJ",
                                trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                trn_month: moment(tgl_skrng).format("MM"),
                                trn_year: moment(tgl_skrng).format("YYYY"),
                            },
                        )
                            } 
                            
                    }
    
    
                    await IncomingStock01.findOneAndUpdate(
                        {_id: id},
                        {
                            is_status: 'Reject'
                        }
                    )

                    return res
                        .status(200)
                        .json({
                            status: 'success',
                            message: 'berhasil update data',
                            data: []
                        })
                }
    
                return res.json({
                    status: "failed",
                    message: "incoming stock gagal di update",
                    data: []
                })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    }
}


