const moment = require("moment");
const mongoose = require('mongoose');
const Company = require("../models/MstCompany");
const connectionManager = require("../middleware/db");
const decryptString = require("../utils/decryptString");
exports.addInvoicetwo = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
    const Invoice2 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
    const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
    const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB))
    const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
    const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
    const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
    try {
        const {
            inv_id,
            items_id,
            price,
            qty,
            disc_percent,
            disc_value,
            remarks
        } = req.body;
        let tgl_skrng       = Date.now()

        // check is invoice 01
        let isInvoice01 = await Invoice.findById(inv_id).lean()
        if (!isInvoice01) {
            return res.json({
                status: "failed",
                message: "gagal invoice tidak di temukan",
                data: []
            })
        }

        // check items
        let isItems = await MstItems.findById(items_id).lean()
        if (!isItems) {
            return res.json({
                status: "failed",
                message: "gagal items tidak di temukan",
                data: []
            })
        }

        // check if stock avaliable
        if(isInvoice01.invoice_type === 'inv_pos') {
            let isStockAvaliable = await TrnStock.findOne({ warehouse_id: isInvoice01.warehouse_id, items_id: isItems._id, current_stock: { $gte: qty } }).lean()
            if (!isStockAvaliable) {
                return res.json({
                    status: "failed",
                    message: "stock tidak cukup",
                    data: []
                })
            }
        }


        let total_harga = (price * qty);

        if (disc_percent) {
            disc_value = (total_harga * (disc_percent / 100)) * qty
            total_harga = total_harga - disc_value
        }

        if (disc_value) {
            total_harga = total_harga - (disc_value * qty)
        }

        // update stock jika status invoice01  inv_pos
        if (isInvoice01.invoice_type === "inv_pos") {

            // update stock
            let stock = await TrnStock.findOne({ items_id: isItems._id, warehouse_id: isInvoice01.warehouse_id }).lean()
            await TrnStock.findOneAndUpdate(
                { items_id: isItems._id, warehouse_id: isInvoice01.warehouse_id },
                {
                    items_in: 0,
                    items_out: qty,
                    old_stock: stock.current_stock,
                    current_stock: stock.current_stock - qty,
                    activity: "INV_POS",
                    trn_date: moment(isInvoice01.os_date).format("YYYY-MM-DD"),
                    trn_month: moment(isInvoice01.os_date).format("MM"),
                    trn_year: moment(isInvoice01.os_date).format("YYYY"),
                }
            )

            // insert history
            let newHistoryStock = await StockHistory({
                items_id: isItems._id,
                doc_no: isInvoice01.invoice_no,
                warehouse_id: isInvoice01.warehouse_id,
                trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                trn_month: moment(tgl_skrng).format("MM"),
                trn_year: moment(tgl_skrng).format("YYYY"),
                activity: "INV_POS",
                qty: qty,
                old_stock: stock.current_stock,
                current_stock: stock.current_stock - qty
            })
            await newHistoryStock.save();

            await stockByDoc.find({warehouse_id: isInvoice01.warehouse_id,items_id: isItems._id, 
                items_remaining: { $gte: 1 } }).lean().exec(async (err, dataByDoc) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data old Stock', data: [] })

                let total_barang = 0
                let sisa = 0
                let kurang_qty = qty
                let is_stop = 0

                for (var i = 0; i < dataByDoc.length; i++) {

                    let id_by_doc = dataByDoc[i]._id
                    if (dataByDoc[i].items_remaining >= kurang_qty) {
                        total_barang = total_barang + (kurang_qty * dataByDoc[i].items_price)
                        sisa = dataByDoc[i].items_remaining - kurang_qty
                        kurang_qty = dataByDoc[i].items_remaining - kurang_qty

                        is_stop = 1
                    } else {
                        total_barang = total_barang + (qty * dataByDoc[i].items_price)
                        sisa = 0
                        kurang_qty = kurang_qty - dataByDoc[i].items_remaining

                        is_stop = 0
                    }

                    await stockByDoc.findOneAndUpdate({ _id: id_by_doc }, { items_remaining: sisa })

                    if (is_stop == 1) {
                        break
                    }

                }    

            })      
            
        }

        // untuk status invoice reject
        if(isInvoice01.doc_status === "reject") {
            // update stock
            let stock = await TrnStock.findOne({ items_id: isItems._id, warehouse_id: isInvoice01.warehouse_id }).lean()
            await TrnStock.findOneAndUpdate(
                { items_id: isItems._id, warehouse_id: isInvoice01.warehouse_id },
                {
                    items_in: 0,
                    items_out: qty,
                    old_stock: stock.current_stock,
                    current_stock: stock.current_stock - qty,
                    activity: "OUT_TR",
                    // trn_date: moment(isInvoice01.os_date).format("YYYY-MM-DD"),
                    // trn_month: moment(isInvoice01.os_date).format("MM"),
                    // trn_year: moment(isInvoice01.os_date).format("YYYY"),
                }
            )

            // insert history
            let newHistoryStock = await StockHistory({
                items_id: isItems._id,
                doc_no: isInvoice01.invoice_no,
                warehouse_id: isInvoice01.warehouse_id,
                trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                trn_month: moment(tgl_skrng).format("MM"),
                trn_year: moment(tgl_skrng).format("YYYY"),
                activity: "OUT_TR",
                qty: qty,
                old_stock: stock.current_stock,
                current_stock: stock.current_stock - qty
            })
            await newHistoryStock.save();
        }

        let newInvoice2 = new Invoice2({
            inv_id: isInvoice01._id,
            items_id: isItems._id,
            price: price,
            qty,
            disc_percent,
            disc_value: disc_value,
            subtotal: total_harga,
            remarks
        });

        

        let invoice02Save = await newInvoice2.save()

        res.json({
            status: "success",
            message: "berhasil menyimpan invoice02",
            data: invoice02Save
        })




    } catch (err) {
        return res.json({
            status: 'Failed',
            message: 'server error : ' + err.message,
            data: []
        })
    }
}

exports.getInvoiceTwo = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
    const Invoice2 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
    const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
    const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB))
    const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
    const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
    const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
    try {
        const { id } = req.query;
        let invoice02;
        const idToObject = mongoose.Types.ObjectId(id);
        if (id) {
            invoice02 = await Invoice2.aggregate([
                {
                    $match: { inv_id: idToObject }
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
                    $graphLookup: {
                        from: 'trn_invoice_01',
                        startWith: '$inv_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'invoice01'
                    }
                },
                {
                    $unwind: {
                        path: "$invoice01",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        "_id": "$_id",
                        "inv_id": "$inv_id",
                        "items_id": "$items_id",
                        "price": "$price",
                        "qty": "$qty",
                        "disc_percent": "$disc_percent",
                        "disc_value": "$disc_value",
                        "subtotal": "$subtotal",
                        "remarks": "$remarks",
                        "createdAt": "$createdAt",
                        "updatedAt": "$updatedAt",
                        "__v": "$__v",
                        "items": {
                            "_id": "$items._id",
                            "items_code": "$items.items_code",
                            "items_name": "$items.items_name",
                            "items_info": "$items.items_info",
                            "items_unit_id": "$items.items_unit_id",
                            "items_category": "$items.items_category",
                            "price_buy": "$items.price_buy",
                            "price_sell": "$items.price_sell",
                            "is_active": "$items.is_active",
                            "pic_input": "$items.pic_input",
                            "input_time": "$items.input_time",
                            "edit_time": "$items.edit_time",
                            "createdAt": "$items.createdAt",
                            "updatedAt": "$items.updatedAt",
                            "__v": "$items.__v"
                        },
                        "invoice01": {
                            "_id": "$invoice01._id",
                            "invoice_no": "$invoice01.invoice_no",
                            "doc_ref": "$invoice01.doc_ref",
                            "urut": "$invoice01.urut",
                            "warehouse_id": "$invoice01.warehouse_id",
                            "warehouse_name": "$invoice01.warehouse_name",
                            "customer_id": "$invoice01.customer_id",
                            "customer_name": "$invoice01.customer_name",
                            "total": "$invoice01.total",
                            "sisa_hutang": "$invoice01.sisa_hutang",
                            "price": "$invoice01.price",
                            "remarks": "$invoice01.remarks",
                            "invoice_status": "$invoice01.invoice_status",
                            "invoice_type": "$invoice01.invoice_type",
                            "is_active": "$invoice01.is_active",
                            "pic_input": "$invoice01.pic_input",
                            "payment_type": { $ifNull: ["$invoice01.payment_type", ""] },
                            "input_time": "$invoice01.input_time",
                            "edit_time": "$invoice01.edit_time",
                            "createdAt": "$invoice01.createdAt",
                            "updatedAt": "$invoice01.updatedAt",
                            "__v": "$invoice01.__v",
                            "keterangan": "$invoice01.keterangan",
                            "nama_file": "$invoice01.nama_file",
                            "penerima": "$invoice01.penerima",
                            "tautan_file": "$invoice01.tautan_file"
                        },
                    }
                }
            ])
        } else {
            invoice02 = await Invoice2.aggregate([
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
                    $graphLookup: {
                        from: 'trn_invoice_01',
                        startWith: '$inv_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'invoice01'
                    }
                },
                {
                    $unwind: {
                        path: "$invoice01",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        "_id": "$_id",
                        "inv_id": "$inv_id",
                        "items_id": "$items_id",
                        "price": "$price",
                        "qty": "$qty",
                        "disc_percent": "$disc_percent",
                        "disc_value": "$disc_value",
                        "subtotal": "$subtotal",
                        "remarks": "$remarks",
                        "createdAt": "$createdAt",
                        "updatedAt": "$updatedAt",
                        "__v": "$__v",
                        "items": {
                            "_id": "$items._id",
                            "items_code": "$items.items_code",
                            "items_name": "$items.items_name",
                            "items_info": "$items.items_info",
                            "items_unit_id": "$items.items_unit_id",
                            "items_category": "$items.items_category",
                            "price_buy": "$items.price_buy",
                            "price_sell": "$items.price_sell",
                            "is_active": "$items.is_active",
                            "pic_input": "$items.pic_input",
                            "input_time": "$items.input_time",
                            "edit_time": "$items.edit_time",
                            "createdAt": "$items.createdAt",
                            "updatedAt": "$items.updatedAt",
                            "__v": "$items.__v"
                        },
                        "invoice01": {
                            "_id": "$invoice01._id",
                            "invoice_no": "$invoice01.invoice_no",
                            "doc_ref": "$invoice01.doc_ref",
                            "urut": "$invoice01.urut",
                            "warehouse_id": "$invoice01.warehouse_id",
                            "warehouse_name": "$invoice01.warehouse_name",
                            "customer_id": "$invoice01.customer_id",
                            "customer_name": "$invoice01.customer_name",
                            "total": "$invoice01.total",
                            "sisa_hutang": "$invoice01.sisa_hutang",
                            "price": "$invoice01.price",
                            "remarks": "$invoice01.remarks",
                            "invoice_status": "$invoice01.invoice_status",
                            "invoice_type": "$invoice01.invoice_type",
                            "is_active": "$invoice01.is_active",
                            "pic_input": "$invoice01.pic_input",
                            "payment_type": { $ifNull: ["$invoice01.payment_type", ""] },
                            "input_time": "$invoice01.input_time",
                            "edit_time": "$invoice01.edit_time",
                            "createdAt": "$invoice01.createdAt",
                            "updatedAt": "$invoice01.updatedAt",
                            "__v": "$invoice01.__v",
                            "keterangan": "$invoice01.keterangan",
                            "nama_file": "$invoice01.nama_file",
                            "penerima": "$invoice01.penerima",
                            "tautan_file": "$invoice01.tautan_file"
                        },
                    }
                }

            ])
        }
        if (!invoice02) {
            return res.json({
                status: "success",
                message: "tidak terdapat data",
                data: []
            })
        }

        res.json({
            status: "success",
            message: "berhasil mendapatkan data",
            data: invoice02
        })

    } catch (err) {
        return res.json({
            status: 'Failed',
            message: 'server error : ' + err.message,
            data: []
        })
    }
};

exports.getInvoiceTwoByCompanyId = async (req, res) => {
    const { company_id, invoice_id } = req.params;
    const company = await Company.findOne(
        { _id: company_id, is_active: 1 }
    );
    const Invoice2 = require("../models/TrnInvoice02")(connectionManager.getConnection(decryptString(company.db_connection)));
    try {
        let invoice02;
        const idToObject = mongoose.Types.ObjectId(invoice_id);
        if (invoice_id) {
            invoice02 = await Invoice2.aggregate([
                {
                    $match: { inv_id: idToObject }
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
                    $graphLookup: {
                        from: 'trn_invoice_01',
                        startWith: '$inv_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'invoice01'
                    }
                },
                {
                    $unwind: {
                        path: "$invoice01",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        "_id": "$_id",
                        "inv_id": "$inv_id",
                        "items_id": "$items_id",
                        "price": "$price",
                        "qty": "$qty",
                        "disc_percent": "$disc_percent",
                        "disc_value": "$disc_value",
                        "subtotal": "$subtotal",
                        "remarks": "$remarks",
                        "createdAt": "$createdAt",
                        "updatedAt": "$updatedAt",
                        "__v": "$__v",
                        "items": {
                            "_id": "$items._id",
                            "items_code": "$items.items_code",
                            "items_name": "$items.items_name",
                            "items_info": "$items.items_info",
                            "items_unit_id": "$items.items_unit_id",
                            "items_category": "$items.items_category",
                            "price_buy": "$items.price_buy",
                            "price_sell": "$items.price_sell",
                            "is_active": "$items.is_active",
                            "pic_input": "$items.pic_input",
                            "input_time": "$items.input_time",
                            "edit_time": "$items.edit_time",
                            "createdAt": "$items.createdAt",
                            "updatedAt": "$items.updatedAt",
                            "__v": "$items.__v"
                        },
                        "invoice01": {
                            "_id": "$invoice01._id",
                            "invoice_no": "$invoice01.invoice_no",
                            "doc_ref": "$invoice01.doc_ref",
                            "urut": "$invoice01.urut",
                            "warehouse_id": "$invoice01.warehouse_id",
                            "warehouse_name": "$invoice01.warehouse_name",
                            "customer_id": "$invoice01.customer_id",
                            "customer_name": "$invoice01.customer_name",
                            "total": "$invoice01.total",
                            "sisa_hutang": "$invoice01.sisa_hutang",
                            "price": "$invoice01.price",
                            "remarks": "$invoice01.remarks",
                            "invoice_status": "$invoice01.invoice_status",
                            "invoice_type": "$invoice01.invoice_type",
                            "is_active": "$invoice01.is_active",
                            "pic_input": "$invoice01.pic_input",
                            "payment_type": { $ifNull: ["$invoice01.payment_type", ""] },
                            "input_time": "$invoice01.input_time",
                            "edit_time": "$invoice01.edit_time",
                            "createdAt": "$invoice01.createdAt",
                            "updatedAt": "$invoice01.updatedAt",
                            "__v": "$invoice01.__v",
                            "keterangan": "$invoice01.keterangan",
                            "nama_file": "$invoice01.nama_file",
                            "penerima": "$invoice01.penerima",
                            "tautan_file": "$invoice01.tautan_file"
                        },
                    }
                }
            ])
        } 
        if (!invoice02) {
            return res.json({
                status: "success",
                message: "tidak terdapat data",
                data: []
            })
        }

        res.json({
            status: "success",
            message: "berhasil mendapatkan data",
            data: invoice02
        })

    } catch (err) {
        return res.json({
            status: 'Failed',
            message: 'server error : ' + err.message,
            data: []
        })
    }
};



exports.updateInvoiceTwo = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
const Invoice2 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB))
const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
    try {
        
        const {
            inv_id,
            items_id,
            do_id,
            qty,
        } = req.body;

        let stockMobil = await TrnDo02.findOne({items_id: items_id, do_id: do_id}).lean()
        let stockInvoice = await Invoice2.findOne({ inv_id: inv_id}).lean()

        if(stockMobil.qty < qty) {
            let sisaStock = stockMobil.qty - stockInvoice.qty
            return res.json({
                status: "failed",
                message: `tidak dapat menambah stock, sisa stock : ${sisaStock}`,
                data: sisaStock
            })
        }

        let invoiceDetail = await Invoice2.findOneAndUpdate(
            { inv_id: inv_id},
            {
                $set: {
                    qty: qty,
                    subtotal: qty * stockInvoice.price
                }
            }
        )
        let invoiceHeader = await Invoice.findById(inv_id).lean()
        let totalAkhir = invoiceHeader.total - stockInvoice.subtotal + (invoiceDetail.qty * invoiceDetail.price);
        let totalInvoice = await Invoice.findByIdAndUpdate(inv_id, 
            {
                $set: {
                    total: totalAkhir
                }
            }
        )

        res.json({
            status: "success",
            message: `berhasil menambahkan qty invoice sebesar ${qty}`,
            data: totalInvoice
        })
        // update invoice detail
        //  update invoice header
        
    } catch (err) {
        return res.json({
            status: 'Failed',
            message: 'server error : ' + err.message,
            data: []
        })
    }
}

exports.deleteInvoicetwo = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
const Invoice2 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB))
const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
    try {

        let deleteInvoice02 = await Invoice2.deleteMany(
            { inv_id: req.params.id },
        );
        if (deleteInvoice02) {
            res.json({
                status: "success",
                message: "berhasil menghapus data",
                data: []
            })
        }

    } catch (err) {
        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}