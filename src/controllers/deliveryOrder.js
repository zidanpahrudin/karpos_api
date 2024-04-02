
const generateIsNo = require("../utils/generateIsNo");
const moment = require("moment");
const {ObjectId} = require("mongodb");
const connectionManager = require("../middleware/db");

module.exports = {
    addTrnDo01: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const MstVehicle = require("../models/MstVehicle")(connectionManager.getConnection(connectionDB));
        const MstWarehouse = require("../models/MstWarehouse")(connectionManager.getConnection(connectionDB));
        const MstPartner = require("../models/MstPartner")(connectionManager.getConnection(connectionDB));
        try {
            const {
                do_date,
                partner_id,
                warehouse_id,
                assistant,
                doc_ref,
                vehicle_id,
                do_status,
                remarks,
                is_active,
                pic_input,
                input_time,
            } = req.body;
            // check mobil
            let vehicle = await MstVehicle.findById(vehicle_id).lean();
            if(!vehicle) {
                return res.json({
                    status: 'failed',
                    message: 'gagal tidak terdapat mobil',
                    data: []
                })
            }
    
            // check warehouse
            let warehouse;
            if(warehouse_id) {
               warehouse = await MstWarehouse.findById(warehouse_id).lean();
            }
    
            // check partner
            let partner = await MstPartner.findById(partner_id).lean()
    
            // doc_ref dari mana untuk apas
            let newTrnDo01 = new TrnDo01({
                do_date,
                // do_no: await generateIsNo("deliveryOrder", "deliveryOrder", do_date ),
                warehouse_id: warehouse ? warehouse._id : "",
                doc_ref,
                vehicle_id: vehicle._id,
                vehicle_no: vehicle.vehicle_no,
                partner_id: partner._id,
                do_status: "New",
                remarks,
                assistant: assistant,
                is_active,
                pic_input,
                input_time,
            });
    
            let isTrnDo01Save = await newTrnDo01.save();
    
            res.json({
                status: "success",
                message: "data success di simpan",
                data: isTrnDo01Save
            })


    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getTrnDo01: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        try {
            let dataTrnDo01
            if(req.params.id) {
                dataTrnDo01 = await TrnDo01.aggregate([
                    { $match: 
                        { 
                            $expr: { $eq: ['$_id', { $toObjectId: req.params.id }] },
                            is_active: 1
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
                        $graphLookup: {
                            from: 'mst_partner',
                            startWith: '$partner_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'partner'
                        }
                    },
                    {
                        $unwind: {
                            path: '$partner',
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
                        $graphLookup: {
                            from: 'mst_vehicle',
                            startWith: '$vehicle_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'vehicle'
                        }
                    },
                    {
                        $unwind: {
                            path: '$vehicle',
                            preserveNullAndEmptyArrays: true
                        }
                    }
                ]);
            } else {
                dataTrnDo01 = await TrnDo01.aggregate([
                    {
                        $match: {
                            is_active: 1
                        }
                    },
                    {
                        $sort: {
                            createdAt: -1
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'mst_partner',
                            startWith: '$partner_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'partner'
                        }
                    },
                    {
                        $unwind: {
                            path: '$partner',
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
                        $graphLookup: {
                            from: 'mst_vehicle',
                            startWith: '$vehicle_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'vehicle'
                        }
                    },
                    {
                        $unwind: {
                            path: '$vehicle',
                            preserveNullAndEmptyArrays: true
                        }
                    }
                ]);
            }
    
            if(!dataTrnDo01) {
                return res.json({
                    status: "failed",
                    message: "gagal mendapatkan data do01",
                    data: []
                })
            }
    
            if(dataTrnDo01.length <= 0) {
                return res.json({
                    status: "success",
                    message: "tidak terdapat data do01",
                    data: []
                })
            }

            
            res.json({
                status: "success",
                message: "berhasil mendapatkan data do01",
                data: dataTrnDo01
            })

            
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getTrnDo01v2: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const connectionManager = require("../middleware/db");
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        try {
            // query params
            const limit = parseInt(req.query.limit);
            const page = parseInt(req.query.page);
            const search = req.query.search;
            const start_range = parseInt(req.query.start_range);
            const end_range = parseInt(req.query.end_range);
            let skip;
            let start_data;
            let total_page;
            let total_count_do = 10;
    
            // params id
            const id = req.params.id;
            const delivery_order_pipeline = [];
            if (id) delivery_order_pipeline.push({ $match: { $expr: { $eq: ['$_id', { $toObjectId: req.params.id }] } } });
            
            
             // sorting
             delivery_order_pipeline.push({
                $sort: {
                    createdAt: -1
                }
            });
            // if id not exist
            delivery_order_pipeline.push(
                {
                    $match: {
                        is_active: 1
                    }
                },
            )
            // default pipeline
            delivery_order_pipeline.push({
                $graphLookup: {
                    from: 'mst_warehouse',
                    startWith: '$warehouse_id',
                    connectFromField: '_id',
                    connectToField: '_id',
                    as: 'warehouse'
                }
            },
            {
                $graphLookup: {
                    from: 'mst_partner',
                    startWith: '$partner_id',
                    connectFromField: '_id',
                    connectToField: '_id',
                    as: 'partner'
                }
            },
            {
                $unwind: {
                    path: '$partner',
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
                $graphLookup: {
                    from: 'mst_vehicle',
                    startWith: '$vehicle_id',
                    connectFromField: '_id',
                    connectToField: '_id',
                    as: 'vehicle'
                }
            },
            {
                $unwind: {
                    path: '$vehicle',
                    preserveNullAndEmptyArrays: true
                }
            });
    
            // search query
            if (search) {
                delivery_order_pipeline.push({
                    $match:
                    {
                        $or: [
                            {'do_no': { $regex: search, $options: 'i' }},
                            {'partner.partner_name': { $regex: search, $options: 'i' }},
                            {'vehicle_no': { $regex: search, $options: 'i' }},
                            
                        ]
                    },
                });
                delivery_order_pipeline.push({
                    $facet: {
                        totalCount: [ { $count: "count" } ],
                        originalData: [ { $addFields: { count: 1 } } ]
                      }
                });
                delivery_order_pipeline.push({
                        $project: {
                          count: { $arrayElemAt: [ "$totalCount.count", 0 ] },
                          data: "$originalData"
                        }
                });
                let count_trn_do_01 = await TrnDo01.aggregate(delivery_order_pipeline);
                if(count_trn_do_01[0].data > 0) {
                    delivery_order_pipeline.push({"$limit" : count_trn_do_01[0].count});
                } 
    
        
            }else {
                total_count_do = await TrnDo01.countDocuments({is_active: 1})
            }
           
            const limit_result = end_range - start_range;
            
            // delivery_order_pipeline.push({ $group: {
            //     _id: "$_id",
                
            //     rootData: { $first: "$$ROOT" },
            //     count_total: {
            //         $push: {
            //             count: { $sum: 1 },
            //         }
            //     }
            //   } });
            //   delivery_order_pipeline.push({$replaceRoot: { newRoot: "$rootData" }});
            // delivery_order_pipeline.push({"$limit" : 100});
            
            if (typeof start_range === "number")  delivery_order_pipeline.push({"$skip" : start_range});
            if (end_range) delivery_order_pipeline.push({"$limit" : limit_result});
           
            let dataTrnDo01 = await TrnDo01.aggregate(delivery_order_pipeline)
            

            if (!dataTrnDo01) {
                return res.json({
                    status: "failed",
                    message: "gagal mendapatkan data do01",
                    data: []
                })
            }
    
            if (dataTrnDo01.length <= 0) {
                return res.json({
                    status: "success",
                    message: "tidak terdapat data do01",
                    data: []
                })
            }
            if(search && search !== '') {
                if(dataTrnDo01[0].count > 0) {
                    return res.json({
                        status: "success",
                        message: "berhasil mendapatkan data do01",
                        start_data: start_data,
                        end_data: skip,
                        total_count: dataTrnDo01[0].count,
                        count: dataTrnDo01.length,
                        data: dataTrnDo01[0].data
                    });
                } else {
                    return res.json({
                        status: "success",
                        message: "berhasil mendapatkan data do01",
                        start_data: start_data,
                        end_data: skip,
                        total_count: 0,
                        count: 0,
                        data: []
                    });
                }
            } else {
                return res.json({
                    status: "success",
                    message: "berhasil mendapatkan data do01",
                    start_data: limit_result,
                    end_data: skip,
                    total_count: total_count_do,
                    count: dataTrnDo01.length,
                    data: dataTrnDo01
                })
            }
            
    
        } catch (err) {
            return res.json({status: 'Failed', message: 'server error : ' + err.message, data: []})
        }
    },
    
    
    deleteTrnDo01: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        try {
    
            await TrnDo01.findByIdAndUpdate(
                req.params.id,
                {
                    is_active: 0
                }
            ).exec(async (err, trnDoUpdate) => {
    
                if(err) return res.json({status: "failed", message: "error update data " + err.message, data: []})
                if(!trnDoUpdate) {
                    return res.json({
                        status: "failed",
                        message: "gagal menghapus do01",
                        data: []
                    })
                }

                res.json({
                    status: "success",
                    message: "berhasil mengahpus do01",
                    data: []
                })
            })
    
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    updateDoHeader: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        try {
            const {id} = req.params;
            const {status} = req.query;
    
            let updatePipeline = {
                do_status: status
            }
            let updateHeader = await TrnDo01.findByIdAndUpdate(id, updatePipeline);
    
            if (!updateHeader) {
                return res.json(
                    {
                        status: "failed",
                        message: "delivery order gagal di update",
                        data: []
                    }
                )
            }

    
            res.json(
                {
                    status: "success",
                    message: "berhasil update delivery order",
                    data: []
                }
            )
    
        } catch (err) {
            return res.json(
                {
                    status: 'Failed',
                    message: 'server error : ' + err.message,
                    data: []
                }
            )
        }
    },
    
    
    updateTrnDo01: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        try {
            const {
                do_date,
                warehouse_id,
                doc_ref,
                partner_id,
                vehicle_id,
                vehicle_no,
                do_status,
                remarks,
                is_active,
            } = req.body;
    
    
            let delivery_order = await TrnDo01.find({vehicle_id: vehicle_id, partner_id: partner_id, do_status: "Process"}).lean()
            const {is_deliver, do_id} = req.query;
            if(is_deliver === "1") {
    
                // check apakah masih ada antrian do yang belum selesai di kembalikan
               if(delivery_order.length > 0) {
                return res.json({
                    status: "failed",
                    message: "partner belum menyelesaikan order",
                    data: []
                })
               }
    
               await TrnDo01.findByIdAndUpdate(do_id, 
                {
                    do_status: "Process"
                }
               )
    
    
                return res.json({
                    status: "success",
                    message: "berhasil merubah status delivery order",
                    data: []
                })
            }
            else {
                await TrnDo01.findByIdAndUpdate(
                    req.params.id,
                    {
                        $set: {
                            do_date,
                            warehouse_id,
                            doc_ref,
                            vehicle_id,
                            vehicle_no,
                            do_status,
                            remarks,
                            is_active,
                        }
                    }
                ).exec((err, trnDoUpdate) => {
        
                    if(err) return res.json({status: "failed", message: "error update data " + err.message, data: []})
        
                    res.json({
                        status: "success",
                        message: "data success di simpan",
                        data: trnDoUpdate
                    })
                })
            }

    
    
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getDoMobile: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
        const MstPartner = require("../models/MstPartner")(connectionManager.getConnection(connectionDB));
        try {
            const { date } = req.body;
            let doPartner = await TrnDo01.findOne({partner_id: req.user.id, do_status: "Process", do_date: date}).lean()
    
            let doDetail = await TrnDo02.find({do_id: doPartner._id}).lean()
    
            let sumTotalDetail = 0;
            let sumQtyDetail = 0;
    
            for (let i = 0; i < doDetail.length; i++) {
                sumTotalDetail += doDetail[i].total
                sumQtyDetail += doDetail[i].qty
            }
    
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
                    delivery_order_detail: doDetail
                }
            })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getDoInMobile: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        try {
    
            let istrnDo = await TrnDo01.findOne({partner_id: req.user.id}).lean()
    
            if(!istrnDo) {
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
                        doc_ref: istrnDo.do_no
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
                    data: invoice01
                })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getStockSale: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        try {
            const {date} = req.params;
            let deliveryOrder = await TrnDo01.find({do_date: date, do_status: "Closed"}).lean();
    
            if(!deliveryOrder) {
                return res.json({
                    status: "failed",
                    message: "tidak terdapat penjualan",
                    data : []
                })
            }

    
            res.json({
                status: "success",
                message: "data penjualan di temukan",
                data: deliveryOrder
            })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getDetailStockSale: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
        try {
            const {date} = req.params;
            let deliveryOrder = await TrnDo01.find({do_date: date, do_status: "Closed"}).lean();
    
            if(!deliveryOrder) {
                return res.json({
                    status: "failed",
                    message: "tidak terdapat penjualan",
                    data : []
                })
            }
    
            let resultArr = [];
            for (const order of deliveryOrder) {
                let deliveryOrderDetail = await TrnDo02.findOne({
                    do_id: order._id,
                }).lean();
    
                if(deliveryOrderDetail) {
                    resultArr.push(deliveryOrderDetail)
                }
            }

    
            res.json({
                status: "success",
                message: "data penjualan di temukan",
                data: resultArr
            })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    rejectDo: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
        const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
        const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
        const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
        try {
            let deliveryOrder = await TrnDo01.findById(req.params.id).lean();
    
            if(!deliveryOrder) {
                return res.json({
                    status: "failed",
                    message: "delivery order tidak di temukan",
                    data: []
                })            
            }
    
            let deliveryOrderDetail = await TrnDo02.find({do_id: deliveryOrder._id}).lean()
    
            if(!deliveryOrderDetail && deliveryOrderDetail.length < 0) {
                return res.json({
                    status: "failed",
                    message: "delivery order detail tidak ditemukan",
                    data: []
                })
            }
    
            let tgl_skrng       = Date.now()
    
            for (let i = 0; i < deliveryOrderDetail.length; i++) {
                let detail = deliveryOrderDetail[i];
    
                let stock = await TrnStock.findOne({ items_id: detail.items_id, warehouse_id: detail.warehouse_id }).lean()
    
                await TrnStock.findOneAndUpdate(
                    { items_id: detail.items_id, warehouse_id: detail.warehouse_id },
                    {
                        items_in: detail.qty,
                        items_out: 0,
                        old_stock: stock.current_stock,
                        current_stock: stock.current_stock + detail.qty,
                        activity: "DO_RJ",
                        trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                        trn_month: moment(tgl_skrng).format("MM"),
                        trn_year: moment(tgl_skrng).format("YYYY"),
                    }
                )
    
                let newHistoryStock = new StockHistory({
                    items_id:  detail.items_id, 
                    doc_no: deliveryOrder.do_no,
                    warehouse_id: detail.warehouse_id,
                    trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                    trn_month: moment(tgl_skrng).format("MM"),
                    trn_year: moment(tgl_skrng).format("YYYY"),
                    activity: "DO_RJ",
                    qty: detail.qty,
                    old_stock: stock.current_stock,
                    current_stock: stock.current_stock + detail.qty
                });
    
                await newHistoryStock.save();
                let qty_value       = detail.qty
    
                await stockByDoc.find(
                    {
                        warehouse_id: detail.warehouse_id,
                        items_id: detail.items_id, 
                        items_remaining: { $gte: 1 } 
                    }
                ).lean()
                .exec(async (err, dataByDoc) => {
                    
                    if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });
    
                    let total_barang = 0
                    let sisa = 0
                    let kurang_qty = qty_value
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
                
            }
    
            await TrnDo01.findByIdAndUpdate(req.params.id, 
                {
                    do_status: 'Reject'
                }
            )
            
    
            res.json({
                 status: "success",
                 message: "berhasil reject delivery order",
                 data: []
             })
    
    
    
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    returnStockDo: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
        const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
        const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
        const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        try {
            let deliveryOrder = await TrnDo01.findById(req.params.id).lean();
            let detail = 0;
            if(!deliveryOrder) {
                return res.json({
                    status: "failed",
                    message: "delivery order tidak di temukan",
                    data: []
                })            
            }
    
            let invoice = await TrnInvoice01.find({doc_ref: deliveryOrder.do_no}).lean();
    
            if(!invoice && invoice.length < 0) {
                return res.json({
                    status: "failed",
                    message: "tidak terdapat invoice",
                    data: []
                })
            }
    
            let deliveryOrderDetail = await TrnDo02.find({do_id: deliveryOrder._id}).lean()
    
            if(!deliveryOrderDetail && deliveryOrderDetail.length < 0) {
                return res.json({
                    status: "failed",
                    message: "delivery order detail tidak ditemukan",
                    data: []
                })
            }
    
            let tgl_skrng       = Date.now()
    
            
            for (let i = 0; i < deliveryOrderDetail.length; i++) {
                let doDetail = deliveryOrderDetail[i];
                for (let j = 0; j < invoice.length; j++) {
                    let stockInvoice = invoice[j];
                    let invoiceDetail = await TrnInvoice02.findOne({inv_id: stockInvoice._id, items_id: doDetail.items_id}).lean();
                    if(invoiceDetail && doDetail) {
                        if(invoiceDetail.qty && doDetail.qty) {
                            detail = doDetail.qty - invoiceDetail.qty
                        }
                    }
                }
    
    
    
    
                let stock = await TrnStock.findOne({ items_id: doDetail.items_id, warehouse_id: deliveryOrder.warehouse_id }).lean()
                await TrnStock.findOneAndUpdate(
                    { items_id: doDetail.items_id, warehouse_id: deliveryOrder.warehouse_id },
                    {
                        items_in: detail,
                        items_out: 0,
                        old_stock: stock.current_stock,
                        current_stock: stock.current_stock + detail,
                        activity: "RN_DO",
                        trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                        trn_month: moment(tgl_skrng).format("MM"),
                        trn_year: moment(tgl_skrng).format("YYYY"),
                    }
                )
    
                let trn_stock_hist = await TrnStockHist.findOne({warehouse_id: deliveryOrder.warehouse_id, items_id: doDetail.items_id}).sort({createdAt: -1, _id: -1}).lean()
                let newHistoryStock = new StockHistory({
                    items_id:  doDetail.items_id, 
                    doc_no: deliveryOrder.do_no,
                    warehouse_id: deliveryOrder.warehouse_id,
                    trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                    trn_month: moment(tgl_skrng).format("MM"),
                    trn_year: moment(tgl_skrng).format("YYYY"),
                    activity: "RN_DO",
                    qty: detail,
                    old_stock: trn_stock_hist.current_stock,
                    current_stock: trn_stock_hist.current_stock + detail
                });
    
                await newHistoryStock.save();
                let qty_value       = detail
    
                await stockByDoc.find(
                    {
                        warehouse_id: deliveryOrder.warehouse_id,
                        items_id: doDetail.items_id, 
                        items_remaining: { $gte: 1 } 
                    }
                ).lean()
                .exec(async (err, dataByDoc) => {
                    
                    if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });
                    
    
                    let total_barang = 0
                    let sisa = 0
                    let kurang_qty = qty_value
                    let is_stop = 0
                    for (var i = 0; i < dataByDoc.length; i++) {
                        let id_by_doc = dataByDoc[i]._id
                        if (dataByDoc[i].items_remaining >= kurang_qty) {
                            total_barang = total_barang + (kurang_qty * dataByDoc[i].items_price)
                            sisa = dataByDoc[i].items_remaining + kurang_qty
                            kurang_qty = dataByDoc[i].items_remaining + kurang_qty
                            is_stop = 1
    
                        } else {
                            total_barang = total_barang + (detail * dataByDoc[i].items_price)
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
                
            }
    
            await TrnDo01.findByIdAndUpdate(req.params.id, {
                do_status: 'Closed'
            })
    
            res.json({
                 status: "success",
                 message: "berhasil mengembalikan sisa stock delivery order",
                 data: []
             })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    returnStockDov2: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
        const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
        const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
        const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
        const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
        try {
            const { warehouse_id, detail, items_id, qty } = req.body;
            
            const {id} = req.params;
            let qty_kirim = parseInt(qty)
            let tgl_skrng       = Date.now();
            
            let convert_to_array = detail.replace(/\[|\]/g, '')
            let result_id = detail;
            if(convert_to_array.match(/\,/g)) {
                result_id =  convert_to_array.split(',')
            }
    
            let is_array = Array.isArray(result_id);
            if(is_array) {
                for (const detail_id of result_id) {
                    let Trn_debt = await TrnDebtItems.findById(detail_id).lean();
                    
                    if(Trn_debt) {
                        
                        let Trn_debt_items = await TrnDebtItems.findByIdAndUpdate(Trn_debt._id,
                            {
                                status: "Closed"
                            }
                        )
                        if(Trn_debt_items) {
                            let tgl_skrng       = Date.now()
                            let mst_items = await MstItems.findOne({replace_id: Trn_debt_items.items_id}).lean()
                            if(mst_items) {
                
                                let invoice_header = await TrnInvoice01.findOne({invoice_no: Trn_debt_items.inv_no}).lean()
                                let deliveryOrder = await TrnDo01.findOne({do_no: invoice_header.doc_ref}).lean();
                
                                let stock = await TrnStock.findOne({ items_id: Trn_debt_items.items_id, warehouse_id: warehouse_id }).lean()
                                
                                if (!stock) {
                                    
                                    let newStock = new TrnStock({
                                        items_id: Trn_debt_items.items_id,
                                        doc_no: deliveryOrder.do_no,
                                        warehouse_id: ObjectId(warehouse_id),
                                        trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                        trn_month: moment(tgl_skrng).format("MM"),
                                        trn_year: moment(tgl_skrng).format("YYYY"),
                                        activity: "RN_DO",
                                        items_in: qty_kirim,
                                        items_out: 0,
                                        old_stock: 0,
                                        current_stock: qty_kirim,
                                    })
                                    
                                    await newStock.save()
                                } else {
            
                                    const updatePipeline = {
                                        items_in: qty_kirim,
                                        items_out: 0,
                                        old_stock: stock.current_stock,
                                        current_stock: stock.current_stock + qty_kirim,
                                        activity: "RN_DO",
                                        trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                        trn_month: moment(tgl_skrng).format("MM"),
                                        trn_year: moment(tgl_skrng).format("YYYY"),
                                    }
                                    if(updatePipeline) {
                                        let updateTrnStock = await TrnStock.findOneAndUpdate(
                                            { items_id: Trn_debt_items.items_id, warehouse_id: warehouse_id },
                                            {
                                                $set: 
                                                updatePipeline,
                                            }
                                        )
                                    }
                                }
                    
                                let newHistoryStock = new StockHistory({
                                    items_id:  Trn_debt_items.items_id, 
                                    doc_no: deliveryOrder.do_no,
                                    warehouse_id: stock.warehouse_id,
                                    trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                    trn_month: moment(tgl_skrng).format("MM"),
                                    trn_year: moment(tgl_skrng).format("YYYY"),
                                    activity: "RN_DO",
                                    qty: qty_kirim,
                                    old_stock: stock.current_stock,
                                    current_stock: stock.current_stock + qty_kirim
                                });
                    
                                await newHistoryStock.save();
                                
                                let invoice_header_debt_items = await TrnInvoice01.findOne({invoice_no: Trn_debt_items.inv_no}).lean()
                                
                                // stock by doc belum
            
            
            
                                if (Trn_debt_items.qty_barang_terima < Trn_debt_items.qty_barang_invoice) {
                                    
                                    await TrnInvoice02.findOneAndUpdate(
                                        { inv_id: invoice_header_debt_items._id, items_id: mst_items._id },
                                        {
                                            $set: {
                                                qty_item_given: qty_kirim,
                                                status_item_debt: "Outstanding"
                                            }
                                        }
                                    )
                                } else {
                                    await TrnInvoice02.findOneAndUpdate(
                                        { inv_id: invoice_header_debt_items._id, items_id: mst_items._id },
                                        {
                                            $set: {
                                                qty_item_given: qty_kirim,
                                                status_item_debt: "Closed"
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            } 
            else {
                let Trn_debt = await TrnDebtItems.findById(detail).lean();
                
                if(Trn_debt && qty_kirim > 0) {
                    
                    let Trn_debt_items = await TrnDebtItems.findByIdAndUpdate(Trn_debt._id,
                        {
                            status: "Closed"
                        }
                    )
                    if(Trn_debt_items) {
                        let tgl_skrng       = Date.now()
                        let mst_items = await MstItems.findOne({replace_id: Trn_debt_items.items_id}).lean()
                        if(mst_items) {
            
                            let invoice_header = await TrnInvoice01.findOne({invoice_no: Trn_debt_items.inv_no}).lean()
                            let deliveryOrder = await TrnDo01.findOne({do_no: invoice_header.doc_ref}).lean();
            
                            let stock = await TrnStock.findOne({ items_id: Trn_debt_items.items_id, warehouse_id: warehouse_id }).lean()
                            if (!stock) {
                                let newStock = new TrnStock({
                                    items_id: Trn_debt_items.items_id,
                                    doc_no: deliveryOrder.do_no,
                                    warehouse_id: ObjectId(warehouse_id),
                                    trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                    trn_month: moment(tgl_skrng).format("MM"),
                                    trn_year: moment(tgl_skrng).format("YYYY"),
                                    activity: "RN_DO",
                                    items_in: qty_kirim,
                                    items_out: 0,
                                    old_stock: 0,
                                    current_stock: qty_kirim,
                                })
                                await newStock.save()
                            } else {
        
                                const updatePipeline = {
                                    items_in: qty_kirim,
                                    items_out: 0,
                                    old_stock: stock.current_stock,
                                    current_stock: stock.current_stock + qty_kirim,
                                    activity: "RN_DO",
                                    trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                    trn_month: moment(tgl_skrng).format("MM"),
                                    trn_year: moment(tgl_skrng).format("YYYY"),
                                }
                                if(updatePipeline) {
                                    let updateTrnStock = await TrnStock.findOneAndUpdate(
                                        { items_id: Trn_debt_items.items_id, warehouse_id: warehouse_id },
                                        {
                                            $set: 
                                            updatePipeline,
                                        }
                                    )
                                }
                            }
                
                            let newHistoryStock = new StockHistory({
                                items_id:  Trn_debt_items.items_id, 
                                doc_no: deliveryOrder.do_no,
                                warehouse_id: stock.warehouse_id,
                                trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                trn_month: moment(tgl_skrng).format("MM"),
                                trn_year: moment(tgl_skrng).format("YYYY"),
                                activity: "RN_DO",
                                qty: qty_kirim,
                                old_stock: stock.current_stock,
                                current_stock: stock.current_stock + qty_kirim
                            });
                
                            await newHistoryStock.save();
                            
                            let invoice_header_debt_items = await TrnInvoice01.findOne({invoice_no: Trn_debt_items.inv_no}).lean()
                            
                            // stock by doc belum
        
        
        
                            if (qty_kirim < Trn_debt_items.qty_barang_invoice) {
                                
                                await TrnInvoice02.findOneAndUpdate(
                                    { inv_id: invoice_header_debt_items._id, items_id: mst_items._id },
                                    {
                                        $set: {
                                            qty_item_given: qty_kirim,
                                            status_item_debt: "Outstanding"
                                        }
                                    }
                                )
                            } else {
                                await TrnInvoice02.findOneAndUpdate(
                                    { inv_id: invoice_header_debt_items._id, items_id: mst_items._id },
                                    {
                                        $set: {
                                            qty_item_given: qty_kirim,
                                            status_item_debt: "Closed"
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
            }
    
            
            let deliveryOrderDetail = await TrnDo02.findById(detail).lean();
            if(deliveryOrderDetail && qty_kirim > 0) {
                
        
                
                let deliveryOrder = await TrnDo01.findById(deliveryOrderDetail.do_id).lean();
                
                let invoice = await TrnInvoice01.find({doc_ref: deliveryOrder.do_no}).lean();
                
                
                let inv_id = [];
                let resultItemsKosong = [];
        
        
                for await (const inv_header of invoice) {
                    inv_id.push(inv_header._id)
                }
        
        
                if(!invoice && invoice.length < 0) {
                    return res.json({
                        status: "failed",
                        message: "tidak terdapat invoice",
                        data: []
                    })
                }       
    
                let totalSisaStock = 0;
    
                for (let j = 0; j < invoice.length; j++) {
                    let stockInvoice = invoice[j];
        
                    let invoiceDetail = await TrnInvoice02.findOne({inv_id: stockInvoice._id, items_id: deliveryOrderDetail.items_id}).lean();
                    if(invoiceDetail) {
                        if(invoiceDetail.qty) {
                            totalSisaStock += invoiceDetail.qty
                        }
                    }
                }
    
                let stock = await TrnStock.findOne({ items_id: items_id, warehouse_id: warehouse_id }).lean();
        
                if (!stock) {
                    newStock = new TrnStock({
                        items_id: deliveryOrderDetail.items_id,
                        doc_no: deliveryOrder.do_no,
                        warehouse_id: warehouse_id,
                        trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                        trn_month: moment(tgl_skrng).format("MM"),
                        trn_year: moment(tgl_skrng).format("YYYY"),
                        activity: "RN_DO",
                        items_in: qty_kirim,
                        items_out: 0,
                        old_stock: 0,
                        current_stock: 0,
                    })
                    stock = await newStock.save()
                }
        
        
                await TrnStock.findOneAndUpdate(
                    { items_id: items_id, warehouse_id: warehouse_id },
                    {
                        items_in: qty_kirim,
                        items_out: 0,
                        old_stock: stock.current_stock,
                        current_stock: stock.current_stock + qty_kirim,
                        activity: "RN_DO",
                        trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                        trn_month: moment(tgl_skrng).format("MM"),
                        trn_year: moment(tgl_skrng).format("YYYY"),
                    }
                )
        
                let history_stock = await StockHistory.findOne({ items_id: items_id, warehouse_id: warehouse_id }).sort({ _id: -1 }).lean()
                
                const historyStockSave = {};
    
                if(history_stock) {
                    historyStockSave.items_id = history_stock.items_id,
                    historyStockSave.doc_no = deliveryOrder.do_no,
                    historyStockSave.warehouse_id = history_stock.warehouse_id,
                    historyStockSave.trn_date = moment(tgl_skrng).format("YYYY-MM-DD"),
                    historyStockSave.trn_month = moment(tgl_skrng).format("MM"),
                    historyStockSave.trn_year = moment(tgl_skrng).format("YYYY"),
                    historyStockSave.activity = "RN_DO",
                    historyStockSave.qty = qty_kirim,
                    historyStockSave.old_stock = history_stock.current_stock,
                    historyStockSave.current_stock = history_stock.current_stock + qty_kirim
                } else {
                    historyStockSave.items_id = ObjectId(items_id),
                    historyStockSave.doc_no = deliveryOrder.do_no,
                    historyStockSave.warehouse_id = warehouse_id,
                    historyStockSave.trn_date = moment(tgl_skrng).format("YYYY-MM-DD"),
                    historyStockSave.trn_month = moment(tgl_skrng).format("MM"),
                    historyStockSave.trn_year = moment(tgl_skrng).format("YYYY"),
                    historyStockSave.activity = "RN_DO",
                    historyStockSave.qty = qty_kirim,
                    historyStockSave.old_stock = 0,
                    historyStockSave.current_stock = qty_kirim
                }
                
                let newHistoryStock = new StockHistory(historyStockSave);
        
                await newHistoryStock.save();
                let qty_value       = qty_kirim
                
                let stock_by_dock = await stockByDoc.find(
                    {
                        warehouse_id: warehouse_id,
                        items_id: deliveryOrderDetail.items_id, 
                        items_remaining: { $gte: 1 } 
                    }
                ).lean();
    
                if(stock_by_dock) {
                    await stockByDoc.find(
                        {
                            warehouse_id: warehouse_id,
                            items_id: deliveryOrderDetail.items_id, 
                            items_remaining: { $gte: 1 } 
                        }
                    ).lean()
                    .exec(async (err, dataByDoc) => {
                        
                        if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] });
            
                        let total_barang = 0
                        let sisa = 0
                        let kurang_qty = qty_value
                        let is_stop = 0
                        for (var i = 0; i < dataByDoc.length; i++) {
                            let id_by_doc = dataByDoc[i]._id
                            if (dataByDoc[i].items_remaining >= kurang_qty) {
                                total_barang = total_barang + (kurang_qty * dataByDoc[i].items_price)
                                sisa = dataByDoc[i].items_remaining + kurang_qty
                                kurang_qty = dataByDoc[i].items_remaining + kurang_qty
                                is_stop = 1
            
                            } else {
                                total_barang = total_barang + (detail * dataByDoc[i].items_price)
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
                } else {
                    let newStockByDoc = await stockByDoc({
                        items_id: items_id,
                        doc_no: deliveryOrder.do_no,
                        warehouse_id: warehouse_id,
                        trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                        trn_month: moment(tgl_skrng).format("MM"),
                        trn_year: moment(tgl_skrng).format("YYYY"),
                        activity: "RN_DO",
                        items_in: qty_kirim,
                        items_out: 0,
                        items_price: deliveryOrder.price,
                        items_remaining: qty_kirim,
                        old_stock: 0,
                        current_stock: qty_kirim,
                    })
                    await newStockByDoc.save()
                }
    
            }
            return res.json({
                 status: "success",
                 message: "berhasil mengembalikan sisa stock delivery order",
                 data: []
             })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getReturnStockDo: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
        const TrnRetur = require("../models/TrnRetur")(connectionManager.getConnection(connectionDB));
        const TrnReturIn = require("../models/TrnReturIn")(connectionManager.getConnection(connectionDB));
        try {
            let deliveryOrder = await TrnDo01.findById(req.params.id).lean();
    
            if(!deliveryOrder) {
                return res.json({
                    status: "failed",
                    message: "delivery order tidak di temukan",
                    data: []
                })            
            }
    
            let invoice = await TrnInvoice01.find({doc_ref: deliveryOrder.do_no, invoice_status: {$ne: "Reject"}}).lean();
    
            let inv_id = [];
            let resultArr = [];
            let resultItemsKosong = [];
            let invoice_no = [];
            let total_bayar = 0;
            for await (const inv_header of invoice) {
                inv_id.push(inv_header._id)
                invoice_no.push(inv_header.invoice_no)
                total_bayar += inv_header.price;
            }
            let Trn_debt_items = await TrnDebtItems.aggregate([
                {
                    $match: {
                        inv_no: {$in: invoice_no},
                        qty_barang_terima: {
                            $gte: 0
                        },
                        // items_id: 
                        status: "Process"
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
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        // galon_id: {'$first': '$_id'},
                        galon_id: {'$push': {'_id': '$_id'}},
                        debtItems_no: {'$first': '$debtItems_no'},
                        inv_no: {'$first': '$inv_no'},
                        partner_id: {'$first': '$partner_id'},
                        items_id: {'$first': '$items_id'},
                        qty_barang_terima: {'$sum': '$qty_barang_terima'},
                        qty_barang_invoice: {'$sum': '$qty_barang_invoice'},
                        status: {'$first': '$status'},
                        is_active: {'$first': '$is_active'},
                        input_time: {'$first': '$input_time'},
                        edit_time: {'$first': '$edit_time'},
                        createdAt: {'$first': '$createdAt'},
                        updatedAt: {'$first': '$updatedAt'},
                        __v: {'$first': '$__v'},
                        items: {'$first': '$items.items_name'}   
                    }
                },
                {
                    $project: {
                        _id: "$galon_id",
                        galon_id: "$galon_id",
                        debtItems_no: "$debtItems_no",
                        inv_no: "$inv_no",
                        partner_id: "$partner_id",
                        items_id: "$items_id",
                        qty_barang_terima: "$qty_barang_terima",
                        qty_barang_invoice: "$qty_barang_invoice",
                        status: "$status",
                        is_active: 1,
                        input_time: "$input_time",
                        edit_time: "$edit_time",
                        createdAt: "$createdAt",
                        updatedAt: "$updatedAt",
                        __v: "$__v",
                        items: "$items"   
                        }
                    },
            ]
            )
    
            if (Trn_debt_items) {
                resultItemsKosong.push(...Trn_debt_items)
            }
            
            if(!invoice && invoice.length < 0) {
                return res.json({
                    status: "failed",
                    message: "tidak terdapat invoice",
                    data: []
                })
            }
    
            let deliveryOrderDetail = await TrnDo02.find({do_id: deliveryOrder._id}).lean()
    
            if(!deliveryOrderDetail && deliveryOrderDetail.length < 0) {
                return res.json({
                    status: "failed",
                    message: "delivery order detail tidak ditemukan",
                    data: []
                })
            }
    
            let tgl_skrng       = Date.now()
    
            
            let detail = 0;
            
            let doDetail = await TrnDo02.aggregate([
                {
                    $match: {
                        do_id: deliveryOrder._id
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
                           
            ])
    
           
    
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
    
            ])
    
            
            let items_selisih = [];
            for (const inv_detail of invoiceDetail) {           
    
                for (const do_detail of doDetail) {
    
                    if(inv_detail._id.toString() === do_detail._id.toString()) {
    
                        let retur_out_stock = await TrnRetur.findOne({ partner_id: deliveryOrder.partner_id, items_id: do_detail.items_id, do_id_ref:  deliveryOrder._id }).lean()
                        let retur_in_stock = await TrnReturIn.findOne({ partner_id: deliveryOrder.partner_id, items_id: do_detail.items_id, do_id_ref:  deliveryOrder._id }).lean()
                        let stock_retur = 0;
                        if (retur_out_stock && retur_out_stock) {
                            stock_retur = retur_in_stock.qty - retur_out_stock.qty;
                        }
    
                        items_selisih.push(do_detail.items_id)
                        if(do_detail.totalInvoiceDetail - inv_detail.totalInvoiceDetail - stock_retur > 0) {
                            const objResult = {};
                            
                                objResult._id = do_detail.do_detail_id,
                                objResult.do_id = do_detail.do_id,
                                objResult.items_id = do_detail.items_id,
                                objResult.items_name = do_detail.items_name,
                                // objResult.qty = do_detail.qty,
                                objResult.sisa_stock = do_detail.totalInvoiceDetail - inv_detail.totalInvoiceDetail - stock_retur,
                                objResult.price = do_detail.price,
                                objResult.total = do_detail.total,
                                objResult.remarks = do_detail.remarks,
                                objResult.createdAt = do_detail.createdAt,
                                objResult.updateddAt = do_detail.updatedAt,
                                objResult.warehouse_id = do_detail.warehouse_id,
                                objResult.warehouse_name = do_detail.warehouse_name
                                resultArr.push(objResult)
                        }
                        
                    }
                }
            }
    
            let doDetail_sisa = await TrnDo02.aggregate([
                {
                    $match: {
                        do_id: deliveryOrder._id,
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
    
            if(doDetail_sisa) {
                for await (const doDetail of doDetail_sisa) {
                    const objResult = {};
    
                    objResult._id = doDetail.do_detail_id,
                        objResult.do_id = doDetail.do_id,
                        objResult.items_id = doDetail.items_id,
                        objResult.items_name = doDetail.items_name,
                        // objResult.qty = doDetail.qty,
                        objResult.sisa_stock = doDetail.totalInvoiceDetail,
                        objResult.price = doDetail.price,
                        objResult.total = doDetail.total,
                        objResult.remarks = doDetail.remarks,
                        objResult.createdAt = doDetail.createdAt,
                        objResult.updateddAt = doDetail.updatedAt,
                        objResult.warehouse_id = doDetail.warehouse_id,
                        objResult.warehouse_name = doDetail.warehouse_name
                    resultArr.push(objResult)
                }
            }
            
            res.json({
                 status: "success",
                 message: "berhasil mendapatkan sisa stock delivery order",
                 data: resultArr,
                 total_bayar: total_bayar,
                 items_kosong: resultItemsKosong
             })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
}



