const config = require('config');
const mongoose = require('mongoose');
const {ObjectId} = require("mongodb");
const moment = require("moment");
const connectionManager = require("../middleware/db");

module.exports = {
    
    addTrnDo02: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
        const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
        const TrnStockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
        const TrnStockHist = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
        const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));

        const connectionManager = await mongoose.createConnection(process.env.database_URI).asPromise();
    
        const session = await db.startSession();
    
        session.startTransaction()
    
        const {
            do_id,
            items_id,
            qty,
            discount,
            warehouse_id,
            remarks
        } = req.body;
        try {


            // hapus do header jika transaksi ini juga batal
    
            // check trndo01
            let isTrnDo01 = await TrnDo01.findById(do_id, {session}).lean()
            if(!isTrnDo01) {
                return res.json({
                    status: "failed",
                    message: "trn do01 tidak di temukan",
                    data: []
                })
            }
    
            let tgl_skrng       = Date.now()
    
             // check items
             let isItems = await MstItems.findById(items_id, {session}).lean()
             if(!isItems) {
                 return res.json({
                     status: "failed",
                     message: "items tidak di temukan",
                     data: []
                 })
             }
    
             let warehouse = await MstWarehouse.findById(warehouse_id, {session}).lean();
            
             // check if stock avaliable
             let isStockAvaliable = await TrnStock.findOne({warehouse_id: ObjectId(warehouse_id), items_id: isItems._id, current_stock: { $gte:  qty}}).lean()
             if(!isStockAvaliable) {
                return res.json({
                    status: "failed",
                    message: "stock tidak cukup",
                    data: []
                })
            }
    
            // kondisi reject
            if(isTrnDo01.do_status === "Reject") {
        
                // check stock by doc
                let dataTrnStockByDoc = await TrnStockByDoc.find({warehouse_id: isStockAvaliable.warehouse_id, items_id: isItems._id, items_remaining: { $gte: 1 }}).lean()
                let total_barang = 0
                let sisa = 0
                let kurang_qty = qty
                let is_stop = 0
                let total = 0;
                let price_out = 0;
        
        
                let newStockByDoc = await stockByDoc({
                    items_id: isItems._id,
                    doc_no: isTrnDo01.do_no,
                    warehouse_id: isTrnDo01.warehouse_id,
                    trn_date: moment(isTrnDo01.do_date).format("YYYY-MM-DD"),
                    trn_month: moment(isTrnDo01.do_date).format("MM"),
                    trn_year: moment(isTrnDo01.do_date).format("YYYY"),
                    activity: "DO_RJ",
                    items_in: qty,
                    items_out: 0,
                    items_price: isItems.price_sell,
                    items_remaining: isStockAvaliable.current_stock + qty,
                    old_stock: isStockAvaliable.current_stock,
                    current_stock: isStockAvaliable.current_stock + qty
                })
                await newStockByDoc.save()
        
        
                await TrnStock.findOneAndUpdate(
                    { warehouse_id: isTrnDo01.warehouse_id, items_id: isItems._id },
                    {   
                        items_in: qty,
                        old_stock: isStockAvaliable.current_stock,
                        items_out: 0,
                        current_stock: isStockAvaliable.current_stock + qty
                    }
                )
        
                // history untuk do
                let newHistoryStock = await TrnStockHist({
                    items_id: isItems._id,
                    doc_no: isTrnDo01.do_no,
                    warehouse_id: isTrnDo01.warehouse_id,
                    trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                    trn_month: moment(tgl_skrng).format("MM"),
                    trn_year: moment(tgl_skrng).format("YYYY"),
                    activity: "DO_RJ",
                    qty: qty,
                    old_stock: isStockAvaliable.current_stock,
                    current_stock: isStockAvaliable.current_stock + qty
                })
                await newHistoryStock.save();
        
                    let newTrnDo02 = new TrnDo02({
                        do_id: isTrnDo01._id,
                        items_id: isItems._id,
                        items_name: isItems.items_name,
                        qty,
                        price: isItems.price_sell,
                        discount: totalDiscount,
                        total: total,
                        remarks
                    });
            
                    let isTrnDo02Save = await newTrnDo02.save();
                
                   return res.json({
                        status: "success",
                        message: "data success di simpan",
                        data: isTrnDo02Save
                    })
            }
    
             // check stock by doc
             let dataTrnStockByDoc = await TrnStockByDoc.find({warehouse_id: isStockAvaliable.warehouse_id, items_id: isItems._id, items_remaining: { $gte: 1 }}, {session}).lean();
    
             let total_barang = 0
             let sisa = 0
             let kurang_qty = qty
             let is_stop = 0
             let total = 0;
             let price_out = 0;
     
             for (var i = 0; i < dataTrnStockByDoc.length; i++) {
    
                 if (dataTrnStockByDoc[i].items_remaining >= kurang_qty) {
                     total_barang = total_barang + (kurang_qty * dataTrnStockByDoc[i].items_price)
                     sisa = dataTrnStockByDoc[i].items_remaining - kurang_qty
                     kurang_qty = dataTrnStockByDoc[i].items_remaining - kurang_qty
     
                     is_stop = 1 
                 } else {
                     total_barang = total_barang + (qty * dataTrnStockByDoc[i].items_price)
                     sisa = 0
                     kurang_qty = kurang_qty - dataTrnStockByDoc[i].items_remaining
                     is_stop = 0
                 }
    
                 if (is_stop === 1) {
                     break;
                 }
     
             }
     
             price_out = total_barang / qty
             total = price_out * qty
             let totalDiscount;
    
             const stockByDocInput = {
                items_id: isItems._id,
                doc_no: isTrnDo01.do_no,
                warehouse_id: isStockAvaliable.warehouse_id,
                trn_date: moment(isTrnDo01.do_date).format("YYYY-MM-DD"),
                trn_month: moment(isTrnDo01.do_date).format("MM"),
                trn_year: moment(isTrnDo01.do_date).format("YYYY"),
                activity: "IN_DO",
                items_in: 0,
                items_out: qty,
                items_price: price_out,
                items_remaining: 0,
                old_stock: isStockAvaliable.current_stock,
                current_stock: isStockAvaliable.current_stock - qty
            }
    
             const [insertStockByDoc] = await stockByDoc.create([stockByDocInput], {session})
    
             await TrnStock.findOneAndUpdate(
                 { warehouse_id: isStockAvaliable.warehouse_id, items_id: isItems._id },
                 {   
                     items_in: 0,
                     old_stock: isStockAvaliable.current_stock,
                     items_out: qty,
                     current_stock: isStockAvaliable.current_stock - qty
                 },
                 {session}
             )
             
             let HistoryStockInput = {
                 items_id: isItems._id,
                 doc_no: isTrnDo01.do_no,
                 warehouse_id: isStockAvaliable.warehouse_id,
                 trn_date: moment(isTrnDo01.do_date).format("YYYY-MM-DD"),
                 trn_month: moment(isTrnDo01.do_date).format("MM"),
                 trn_year: moment(isTrnDo01.do_date).format("YYYY"),
                 activity: "IN_DO",
                 qty: qty,
                 old_stock: isStockAvaliable.current_stock,
                 current_stock: isStockAvaliable.current_stock - qty
             }
    
             const [insertHistoryStock]  = await TrnStockHist.create([HistoryStockInput], {session})
             
             let TrnDo02Input = {
                 do_id: isTrnDo01._id,
                 items_id: isItems._id,
                 items_name: isItems.items_name,
                 qty,
                 warehouse_id: isStockAvaliable.warehouse_id,
                 warehouse_name: warehouse.warehouse_name,
                 price: price_out,
                 discount: totalDiscount,
                 total: total,
                 remarks
             };
    
             const [insertTrnDo02] = await TrnDo02.create([TrnDo02Input],{session});

    
            return res.json({
                 status: "success",
                 message: "data success di simpan",
                 data: insertTrnDo02
             })
    
    
        } catch (err) {
            await TrnDo01.findByIdAndRemove(do_id)
            // await TrnInvoice01.findByIdAndRemove(do_id)
            await session.abortTransaction()
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        } finally {
            session.endSession();
        }
    },
    
    getdo02: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        try {
            const {doId} = req.body;
            let delivery_order = await TrnDo01.findById(doId).lean()
    
            let doDetail = await TrnDo02.find({do_id: mongoose.Types.ObjectId(doId)}).sort({items_name: 1}).lean()
            
            
            if(!doDetail || doDetail.length <= 0) {
                return res.json({
                    status: "failed",
                    message: "tidak terdapat delivery order detail",
                    data: []
                })
            }
    
            let resultArr = [];
            for (let i = 0; i < doDetail.length; i++) {
                const resultObject = {};
                    resultObject._id = doDetail[i]._id,
                    resultObject.do_id = doDetail[i].do_id,
                    resultObject.items_id = doDetail[i].items_id,
                    resultObject.items_name = doDetail[i].items_name,
                    resultObject.warehouse_id = doDetail[i].warehouse_id,
                    resultObject.warehouse_name = doDetail[i].warehouse_name,
                    resultObject.qty = doDetail[i].qty,
                    resultObject.price = doDetail[i].price,
                    resultObject.total = doDetail[i].total,
                    resultObject.assistant = delivery_order.assistant ? delivery_order.assistant : '',
                    resultObject.remarks = doDetail[i].remarks,
                    resultObject.createdAt = doDetail[i].createdAt,
                    resultObject.updatedAt = doDetail[i].updatedAt,
                    resultObject.__v = doDetail[i].__v
    
                    resultArr.push(resultObject)
                
            } 

    
            res.json({
                status: "success",
                message: "list delivery order detail",
                data: resultArr
            })
        } catch (err) {
            res.json({
                status: "failed",
                message: "server error cause : " + err.message,
                data: []
            })
        }
    },
    
    createDeliveryOrderv2: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
        const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
        const TrnStockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
        const TrnStockHist = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
        const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
        const MstWarehouse = require("../models/MstWarehouse")(connectionManager.getConnection(connectionDB));
        try {
            const {
                do_id,
                items_id,
                qty,
                discount,
                warehouse_id,
                remarks
            } = req.body;
            // check trndo01
            let isTrnDo01 = await TrnDo01.findById(do_id).lean()
            if(!isTrnDo01) {
                return res.json({
                    status: "failed",
                    message: "trn do01 tidak di temukan",
                    data: []
                })
            }
    
            // check warehouse id
            let warehouse = await MstWarehouse.findById(warehouse_id).lean();
    
            // check items
            let isItems = await MstItems.findById(items_id).lean()
            if(!isItems) {
                return res.json({
                    status: "failed",
                    message: "trn do01 tidak di temukan",
                    data: []
                })
            }
    
            // check if stock avaliable
            let isStockAvaliable = await TrnStock.findOne({warehouse_id: warehouse._id, items_id: isItems._id, current_stock: { $gte:  qty}}).lean()
            if(!isStockAvaliable) {
                return res.json({
                    status: "failed",
                    message: "stock tidak cukup",
                    data: []
                })
            }
    
    
            // kondisi reject
            if(isTrnDo01.do_status === "Reject") {
        
            // check stock by doc
            let dataTrnStockByDoc = await TrnStockByDoc.find({warehouse_id: isStockAvaliable.warehouse_id, items_id: isItems._id, items_remaining: { $gte: 1 }}).lean()
            let total_barang = 0
            let sisa = 0
            let kurang_qty = qty
            let is_stop = 0
            let total = 0;
            let price_out = 0;
    
    
            let newStockByDoc = await stockByDoc({
                items_id: isItems._id,
                doc_no: isTrnDo01.do_no,
                warehouse_id: warehouse._id,
                trn_date: moment(isTrnDo01.do_date).format("YYYY-MM-DD"),
                trn_month: moment(isTrnDo01.do_date).format("MM"),
                trn_year: moment(isTrnDo01.do_date).format("YYYY"),
                activity: "IN_DO",
                items_in: qty,
                items_out: 0,
                items_price: isItems.price_sell,
                items_remaining: isStockAvaliable.current_stock + qty,
                old_stock: isStockAvaliable.current_stock,
                current_stock: isStockAvaliable.current_stock + qty
            })
            await newStockByDoc.save()
    
    
            await TrnStock.findOneAndUpdate(
                { warehouse_id: warehouse._id, items_id: isItems._id },
                {   
                    items_in: qty,
                    old_stock: isStockAvaliable.current_stock,
                    items_out: 0,
                    current_stock: isStockAvaliable.current_stock + qty
                }
            )
    
            // history untuk do
            let newHistoryStock = await TrnStockHist({
                items_id: isItems._id,
                doc_no: isTrnDo01.do_no,
                warehouse_id: warehouse._id,
                trn_date: moment(isTrnDo01.do_date).format("YYYY-MM-DD"),
                trn_month: moment(isTrnDo01.do_date).format("MM"),
                trn_year: moment(isTrnDo01.do_date).format("YYYY"),
                activity: "IN_DO",
                qty: qty,
                old_stock: isStockAvaliable.current_stock,
                current_stock: isStockAvaliable.current_stock + qty
            })
            await newHistoryStock.save();
    
                let newTrnDo02 = new TrnDo02({
                    do_id: isTrnDo01._id,
                    items_id: isItems._id,
                    items_name: isItems.items_name,
                    qty,
                    price: isItems.price_sell,
                    discount: totalDiscount,
                    total: total,
                    remarks
                });
        
                let isTrnDo02Save = await newTrnDo02.save();
            
               return res.json({
                    status: "success",
                    message: "data success di simpan",
                    data: isTrnDo02Save
                })
            }
    
            // check stock by doc
            let dataTrnStockByDoc = await TrnStockByDoc.find({warehouse_id: isStockAvaliable.warehouse_id, items_id: isItems._id, items_remaining: { $gte: 1 }}).lean()
            let total_barang = 0
            let sisa = 0
            let kurang_qty = qty
            let is_stop = 0
            let total = 0;
            let price_out = 0;
    
            for (var i = 0; i < dataTrnStockByDoc.length; i++) {
                let id_by_doc = dataTrnStockByDoc[i]._id
                if (dataTrnStockByDoc[i].items_remaining >= kurang_qty) {
                    total_barang = total_barang + (kurang_qty * dataTrnStockByDoc[i].items_price)
                    sisa = dataTrnStockByDoc[i].items_remaining - kurang_qty
                    kurang_qty = dataTrnStockByDoc[i].items_remaining - kurang_qty
    
                    is_stop = 1 
                } else {
                    total_barang = total_barang + (qty * dataTrnStockByDoc[i].items_price)
                    sisa = 0
                    kurang_qty = kurang_qty - dataTrnStockByDoc[i].items_remaining
                    is_stop = 0
                }
                
                await TrnStockByDoc.findOneAndUpdate(
                    { _id: id_by_doc },
                    {   
                        items_in: 0,
                        items_out: kurang_qty,
                        old_stock: dataTrnStockByDoc[i].items_remaining,
                        items_remaining: sisa 
                    })
                if (is_stop === 1) {
                    break;
                }
    
            }
    
            price_out = total_barang / qty
            total = price_out * qty
            let totalDiscount;
    
            // if(discount.lastIndexOf("%") !== -1 ) {
            //     totalDiscount = total * (parseFloat(discount.slice(0, -1)) / 100)
            //     total - totalDiscount
            // } else {
            //     totalDiscount = discount
            //     total - totalDiscount
            // }
    
    
            let newStockByDoc = await stockByDoc({
                items_id: isItems._id,
                doc_no: isTrnDo01.do_no,
                warehouse_id: warehouse._id,
                trn_date: moment(isTrnDo01.do_date).format("YYYY-MM-DD"),
                trn_month: moment(isTrnDo01.do_date).format("MM"),
                trn_year: moment(isTrnDo01.do_date).format("YYYY"),
                activity: "ID_DO",
                items_in: 0,
                items_out: qty,
                items_price: price_out,
                items_remaining: 0,
                old_stock: isStockAvaliable.current_stock,
                current_stock: isStockAvaliable.current_stock - qty
            })
            await newStockByDoc.save()
    
    
            await TrnStock.findOneAndUpdate(
                { warehouse_id: warehouse._id, items_id: isItems._id },
                {   
                    items_in: 0,
                    old_stock: isStockAvaliable.current_stock,
                    items_out: qty,
                    current_stock: isStockAvaliable.current_stock - qty
                }
            )
    
            // history untuk do
            let newHistoryStock = await TrnStockHist({
                items_id: isItems._id,
                doc_no: isTrnDo01.do_no,
                warehouse_id: warehouse._id,
                trn_date: moment(isTrnDo01.do_date).format("YYYY-MM-DD"),
                trn_month: moment(isTrnDo01.do_date).format("MM"),
                trn_year: moment(isTrnDo01.do_date).format("YYYY"),
                activity: "ID_DO",
                qty: qty,
                old_stock: isStockAvaliable.current_stock,
                current_stock: isStockAvaliable.current_stock - qty
            })
            await newHistoryStock.save();
            
    
            let newTrnDo02 = new TrnDo02({
                do_id: isTrnDo01._id,
                items_id: isItems._id,
                items_name: isItems.items_name,
                qty,
                warehouse_id: warehouse._id,
                warehouse_name: warehouse.warehouse_name,
                price: price_out,
                discount: totalDiscount,
                total: total,
                remarks
            });
    
            let isTrnDo02Save = await newTrnDo02.save();
    
           return res.json({
                status: "success",
                message: "data success di simpan",
                data: isTrnDo02Save
            })
        } catch (err) {
            res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
}