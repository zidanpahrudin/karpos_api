const connectionManager = require("../middleware/db");
const Company = require("../models/MstCompany");
const decryptString = require("../utils/decryptString");
module.exports = {
    reportInvoice: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const Invoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
            const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
            const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
    
            const { start_date, end_date, partner_id, payment_type } = req.body;
            const { invoice_status, type_user } = req.query;
            const formatDate = (date) => new Date(date);
    
            // let invoice;
            const filterInvoice = {};
    
    
            if (start_date && end_date) {
                filterInvoice.input_time = {
                    $gte: formatDate(start_date),
                    $lte: formatDate(end_date)
                }
            }
    
            if (invoice_status) {
                if (invoice_status === "ALL") {
                    filterInvoice.invoice_status = {
                        $exists: true
                    }
                } else if (invoice_status && invoice_status !== "ALL") {
                    filterInvoice.invoice_status = invoice_status
                }
            }
    
            if (type_user) {
                if (type_user === "mobile") {
                    filterInvoice.invoice_type = 'inv_on_ride'
                } else if (type_user === "admin") {
                    filterInvoice.invoice_type = {
                        $in: ['inv_pos', 'inv_do']
                    }
                } else if (type_user === "ALL") {
                    filterInvoice.invoice_type = {
                        $exists: true
                    }
                }
                else {
                    return res.json({
                        status: "failed",
                        message: "type user tidak di temukan",
                        data: []
                    })
                }
            }
    
            if (payment_type) filterInvoice.payment_type = payment_type;
    
            let docRefs = [];
            if (partner_id && partner_id !== "") {
                let delivery_orders = await TrnDo01.find({ partner_id: partner_id }).lean()
                for (const deliveryOrder of delivery_orders) {
                    if (deliveryOrder.do_no) {
                        docRefs.push(deliveryOrder.do_no)
                    }
                }
            }
    
            if (docRefs.length > 0) {
                filterInvoice.doc_ref = {
                    $in: docRefs
                }
            }
            let response_data_invoice = [];
            let invoice = await Invoice.find(filterInvoice).lean();
            for (const result_invoice of invoice) {
                const result = {};
    
                result._id = result_invoice._id;
                result.invoice_no = result_invoice.invoice_no;
                result.doc_ref = result_invoice.doc_ref;
                result.doc_status = result_invoice.doc_status;
                result.urut = result_invoice.urut;
                result.customer_id = result_invoice.customer_id;
                result.customer_name = result_invoice.customer_name;
                result.alamat = result_invoice.alamat;
                result.total = result_invoice.total;
                result.price = result_invoice.price;
                result.remarks = result_invoice.remarks;
                result.invoice_status = result_invoice.invoice_status;
                result.invoice_type = result_invoice.invoice_type;
                result.is_active = result_invoice.is_active;
                result.pic_input = result_invoice.pic_input;
                result.input_time = result_invoice.input_time;
                result.edit_time = result_invoice.edit_time;
                result.createdAt = result_invoice.createdAt;
                result.updatedAt = result_invoice.updatedAt;
                result.__v = result_invoice.__v;
                result.keterangan = result_invoice.keterangan;
                result.nama_file = result_invoice.nama_file;
                result.penerima = result_invoice.penerima;
                result.tautan_file = result_invoice.tautan_file;
                result.payment_type = result_invoice.payment_type ? result_invoice.payment_type : "";
                result.count = result_invoice.count;
                response_data_invoice.push(result)
            }
            if (!invoice && invoice.length > 0) {
                return res.json({
                    status: "failed",
                    message: "tidak terdapat invoice",
                    data: []
                })
            }
    
            res.json({
                status: "success",
                message: "berhasil mendapatkan data invoice",
                data: response_data_invoice
            });
    
        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },
    
    reportInvoiceDetail: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const Invoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
        try {
            const { start_date, end_date } = req.body;
            const formatDate = (date) => new Date(date);
            let invoice = await Invoice.aggregate(
                [
                    {
                        $match: {
                            input_time: {
                                $gte: formatDate(start_date),
                                $lte: formatDate(end_date)
                            }
                        }
                    }
                ]
            )
    
            if (!invoice && invoice.length > 0) {
                return res.json({
                    status: "failed",
                    message: "tidak terdapat invoice",
                    data: []
                })
            }
    
    
            let resultDetail = [];
            for (let i = 0; i < invoice.length; i++) {
                let result = invoice[i];
                let invoiceDetail = await Invoice02.find({ inv_id: result._id }).lean();
    
                if (invoiceDetail) {
                    for (let a = 0; a < invoiceDetail.length; a++) {
                        const objResult = {}
    
                        let detail = invoiceDetail[a];
                        let items = await MstItems.findOne({ _id: detail.items_id }).lean()
                        objResult._id = detail._id,
                            objResult.inv_no = result.invoice_no,
                            objResult.inv_id = detail.inv_id,
                            objResult.invoice_status = result.invoice_status,
                            objResult.items_id = detail.items_id,
                            objResult.items_name = items.items_name,
                            objResult.price = detail.price,
                            objResult.qty = detail.qty,
                            objResult.disc_percent = detail.disc_percent,
                            objResult.disc_value = detail.disc_value,
                            objResult.subtotal = detail.subtotal,
                            objResult.remarks = detail.remarks,
                            objResult.createdAt = detail.createdAt,
                            objResult.updatedAt = detail.updatedAt,
                            objResult.__v = detail.__v
                        resultDetail.push(objResult)
                    }
    
                }
    
            }
    
            res.json({
                status: "success",
                message: "berhasil mendapatkan data invoice detail",
                data: resultDetail
            });
        } catch (err) {
    
            return res.json({ message: 'server error : ' + err.message })
        }
    },
    
    reportInvoiceHeaderDetail: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const Invoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
            const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
            const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
            const { start_date, end_date, partner_id } = req.body;
            const { invoice_status, type_user, limit, page } = req.query;
            const formatDate = (date) => new Date(date);
    
            // let invoice;
            const filterInvoice = {};
    
    
            if (start_date && end_date) {
                filterInvoice.input_time = {
                    $gte: formatDate(start_date),
                    $lte: formatDate(end_date)
                }
            }
    
            if (invoice_status) {
                if (invoice_status === "ALL") {
                    filterInvoice.invoice_status = {
                        $exists: true
                    }
                } else if (invoice_status && invoice_status !== "ALL") {
                    filterInvoice.invoice_status = invoice_status
                }
            }
    
            if (type_user) {
                if (type_user === "mobile") {
                    filterInvoice.invoice_type = 'inv_on_ride'
                } else if (type_user === "admin") {
                    filterInvoice.invoice_type = {
                        $in: ['inv_pos', 'inv_do']
                    }
                } else if (type_user === "ALL") {
                    filterInvoice.invoice_type = {
                        $exists: true
                    }
                }
                else {
                    return res.json({
                        status: "failed",
                        message: "type user tidak di temukan",
                        data: []
                    })
                }
            }
    
            let docRefs = [];
            if (partner_id && partner_id !== "") {
                let delivery_orders = await TrnDo01.find({ partner_id: partner_id }).lean()
                for (const deliveryOrder of delivery_orders) {
                    if (deliveryOrder.do_no) {
                        docRefs.push(deliveryOrder.do_no)
                    }
                }
            }
    
            if (docRefs.length > 0) {
                filterInvoice.doc_ref = {
                    $in: docRefs
                }
            }
    
            const limit_result = parseInt(limit)
    
            let count_invoice = await Invoice.countDocuments(filterInvoice)
            let total_page = Math.round(count_invoice / limit_result);
    
            const invoice_pipeline = [
                {
                    $match: filterInvoice
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
                    $sort: {
                        createdAt: 1
                    }
                }
            ];
    
            if (page) {
                const skip_result = parseInt(page) * limit_result;
                invoice_pipeline.push({
                    $skip: skip_result
                })
            }
    
            if (limit) {
                invoice_pipeline.push({
                    $limit: limit_result
                })
            }
    
            Object.freeze(invoice_pipeline);
            let invoice = await Invoice.aggregate(invoice_pipeline)
    
            if (!invoice && invoice.length > 0) {
                return res.json({
                    status: "failed",
                    message: "tidak terdapat invoice",
                    data: []
                })
            }
    
            res.json({
                status: "success",
                message: "berhasil mendapatkan data invoice",
                count_invoice: count_invoice,
                total_page: total_page,
                data: invoice,
            });
    
        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },
    
    reportReturStock: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const Invoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
            const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
            const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
            const TrnReturIn = require("../models/TrnReturIn")(connectionManager.getConnection(connectionDB));
            const TrnRetur = require("../models/TrnRetur")(connectionManager.getConnection(connectionDB));
    
            const { start_date, end_date, jenis } = req.body;
            const formatDate = (date) => new Date(date);
            if (jenis === "retur_in") {
                let trn_in_retur = await TrnReturIn.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: formatDate(start_date),
                                $lte: formatDate(end_date),
                            }
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'trn_do_01',
                            startWith: '$do_id',
                            connectFromField: '_id',
                            connectToField: '_id',
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
                            from: 'mst_partner',
                            startWith: '$delivery_order_header.partner_id',
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
                            from: 'mst_partner',
                            startWith: '$partner_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'partner_do'
                        }
                    },
                    {
                        $unwind: {
                            path: '$partner_do',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $replaceRoot: {
                            newRoot: {
                                $mergeObjects: [
                                    {
                                        "customer_name": "$customer_name",
                                        "nama_item": "$items.items_name",
                                        "qty_retur": "$qty",
                                        "qty_do": "$qty_payment",
                                        "partner_retur": "$partner.partner_name",
                                        "vehicle_no": "$vehicle_no",
                                        "assistant": "$assistant",
                                        "partner_do": "$partner_do.partner_name",
                                        "tanggal_retur": "$createdAt",
                                        "tanggal_do": "$delivery_order_header.do_date",
                                        "retur_no": "$retur_no",
                                        "inv_no": "$invoice_no",
                                        "do_no": "$delivery_order_header.do_no",
                                        "items_name": "$items.items_name",
                                        "qty_payment": "$qty_payment"
                                    }
                                ]
                            }
                        }
                    },
                ])
    
                if (trn_in_retur.length < 0) {
                    return res.json({
                        status: 'failed',
                        message: 'data retur in tidak ditemukan',
                        data: []
                    })
                }
    
                return res.json({
                    status: 'success',
                    message: 'data retur in di temukan',
                    data: trn_in_retur
                })
    
            } else if (jenis === "retur_out") {
                let trn_retur = await TrnRetur.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: formatDate(start_date),
                                $lte: formatDate(end_date),
                            }
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'trn_do_01',
                            startWith: '$do_id',
                            connectFromField: '_id',
                            connectToField: '_id',
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
                            from: 'mst_partner',
                            startWith: '$delivery_order_header.partner_id',
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
                            from: 'mst_partner',
                            startWith: '$partner_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'partner_do'
                        }
                    },
                    {
                        $unwind: {
                            path: '$partner_do',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $replaceRoot: {
                            newRoot: {
                                $mergeObjects: [
                                    {
                                        "customer_name": "$customer_name",
                                        "nama_item": "$items.items_name",
                                        "qty_retur": "$qty",
                                        "qty_do": "$qty_payment",
                                        "partner_retur": "$partner.partner_name",
                                        "vehicle_no": "$vehicle_no",
                                        "assistant": "$assistant",
                                        "partner_do": "$partner_do.partner_name",
                                        "tanggal_retur": "$createdAt",
                                        "tanggal_do": "$delivery_order_header.do_date",
                                        "retur_no": "$retur_no",
                                        "inv_no": "$invoice_no",
                                        "do_no": "$delivery_order_header.do_no",
                                        "items_name": "$items.items_name",
                                        "qty_payment": "$qty_payment"
                                    }
                                ]
                            }
                        }
                    },
                ])
    
                if (trn_retur.length < 0) {
                    return res.json({
                        status: 'failed',
                        message: 'data retur out tidak ditemukan',
                        data: []
                    })
                }
    
                return res.json({
                    status: 'success',
                    message: 'data retur out di temukan',
                    data: trn_retur
                })
            }
        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },
    
    reportGallon: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const Invoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
            const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
            const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
            const { start_date, end_date, partner_id } = req.body;
            const { type } = req.query;
            const queryTrnDebtItems = {};
    
            const formatDate = (date) => new Date(date);
    
            let result = null;
            if (type === "gallon_empty") {
                result = await TrnDebtItems.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: formatDate(start_date),
                                $lte: formatDate(end_date),
                            }
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
                        $project: {
                            "_id": 1,
                            // "debtItems_no": 0,
                            "inv_no": "$inv_no",
                            "qty_barang_terima": "$qty_barang_terima",
                            "qty_barang_invoice": "$qty_barang_invoice",
                            "status": "$status",
                            "remarks": "$remarks",
                            "is_active": "$is_active",
                            // "input_time": "$input_time",
                            // "edit_time": "$edit_time",
                            "createdAt": "$createdAt",
                            "updatedAt": "$updatedAt",
                            "partner_id": "$partner_id",
                            "partner_name": "$partner.partner_name",
                            "items_id": "$items_id",
                            "items_name": { $ifNull: ["$items.items_name", ""] }
                        }
                    }
                ])
            } else if (type === "gallon_debt") {
                result = await TrnInvoice02.aggregate([
                    {
                        $match: {
                            status_item_debt: "Outstanding",
                            createdAt: {
                                $gte: formatDate(start_date),
                                $lte: formatDate(end_date),
                            }
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'trn_invoice_01',
                            startWith: '$inv_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'invoice_01'
                        }
                    },
                    {
                        $unwind: {
                            path: '$invoice_01',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'trn_do_01',
                            startWith: '$invoice_01.doc_ref',
                            connectFromField: 'do_no',
                            connectToField: 'do_no',
                            as: 'do_01'
                        }
                    },
                    {
                        $unwind: {
                            path: '$do_01',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'mst_partner',
                            startWith: '$do_01.partner_id',
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
                            from: 'mst_items',
                            startWith: '$items.replace_id',
                            connectFromField: '_id',
                            connectToField: '_id',
                            as: 'items_replace'
                        }
                    },
                    {
                        $unwind: {
                            path: '$items_replace',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            "_id": 1,
                            // "debtItems_no": 0,
                            "inv_no": "$invoice_01.invoice_no",
                            "qty_barang_terima": "$qty_item_given",
                            "qty_barang_invoice": "$qty",
                            "status": "$status_item_debt",
                            "remarks": "$remarks",
                            "is_active": "$invoice_01.is_active",
                            // "input_time": "$input_time",
                            // "edit_time": "$edit_time",
                            "createdAt": "$createdAt",
                            "updatedAt": "$updatedAt",
                            "partner_id": "$do_01.partner_id",
                            "partner_name": "$partner.partner_name",
                            "items_id": "$items_id",
                            "items_name": { $ifNull: ["$items.items_name", ""] }
                        }
                    }
                ])
            } else {
                return res.json({
                    status: 'failed',
                    message: 'type tidak ditemukan',
                    data: []
                })
            }
    
            if (result && result.length > 0) {
                return res.json({
                    status: 'success',
                    message: 'report gallon kosong berhasil di dapat',
                    data: result
                })
            } else {
                return res.json({
                    status: 'failed',
                    message: 'tidak terdapat report gallon kosong',
                    data: []
                })
            }
    
    
        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },

    reportStock: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const Invoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const search = req.query.search;

            const invoice_header = await Invoice.find({invoice_status: {$ne: "Reject"}});
            const invoice_header_id = [];
            for await (const invoice of invoice_header) {
                invoice_header_id.push(invoice._id);
            }

            const invoice_detail_pipeline = [];
            if (search && search['start_date'] && search['end_date']) {
                invoice_detail_pipeline.push({
                    $match: {
                        inv_id: {
                            $in: invoice_header_id
                        },
                        createdAt: {
                            $gte: new Date(search['start_date']),
                            $lte: new Date(search['end_date'])
                        }
                    }
                });
            }

            let limit = 10;
            if (search['limit']) limit = parseInt(search['limit']);



            invoice_detail_pipeline.push(
                {
                    $sort: {
                        qty: -1
                    }
                },
                {
                    $graphLookup: {
                        from: "mst_items",
                        startWith: "$items_id",
                        connectFromField: "_id",
                        connectToField: "_id",
                        as: "items"
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
                        totalAmount: { $sum: "$qty" },
                        count: { $sum: 1 },
                        qty: { $first: "$qty" }, // Include the original "qty" in the output
                        items_name: { $first: "$items.items_name" }, // Extract items_name
                        createdAt: { $first: "$createdAt" }, // Extract items_name
                        price: { $first: "$price" }, // Extract items_name
                        subtotal: {$first: "$subtotal"}

                    }
                },
                {
                    $sort: {
                        totalAmount: -1
                    }
                },
                {
                    $limit: limit
                },
                
                {
                    $project: {
                        "qty": "$totalAmount",
                        "items_name": "$items_name", // Include items_name in the output
                        "price": "$price",
                        "subtotal": "$subtotal",
                        "createdAt": "$createdAt"
                    }
                },
                
               
            );
            
            

            const invoice_detail = await Invoice02.aggregate(invoice_detail_pipeline);
            if (invoice_detail.length > 0) {
                return res.json({
                    status: 'success',
                    message: 'report gallon kosong berhasil di dapat',
                    data: invoice_detail
                });
            } else {
                return res.json({
                    status: 'failed',
                    message: 'report gallon kosong berhasil di dapat',
                    data: []
                })
            }
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

    summaryAmountInvoice: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const search = req.query.search;
            let invoice_header_pipeline = [];
            let limit = 10;
            let status = { $ne: "Reject" };
            if (search && search['limit']) limit = parseInt(search['limit']);
            if(search && search['status']) status = search['status'];
            if (search && search['start_date'] && search['end_date']) {
                invoice_header_pipeline.push(
                    {
                        $match: {
                            invoice_status: status,
                            createdAt: {
                                $gte: new Date(search['start_date']),
                                $lte: new Date(search['end_date'])
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: "$createdAt" },
                                month: { $month: "$createdAt" },

                            },
                            total: { $sum: "$total" },
                            total_outstanding: {
                                $sum: {
                                    $cond: { 
                                        if: { $eq: ["$invoice_status", "Outstanding"] }, 
                                        then: "$total", 
                                        else: 0 
                                    }
                                }
                            }
                        }
                    },
                    {
                        $sort: {
                            "_id.year": 1,
                            "_id.month": 1
                        }
                    },
                    {
                        $project: {
                            _id: 0, // Exclude default _id field from output
                            month: "$_id.month",
                            year: "$_id.year",
                            total_outstanding: 1,
                            total: 1 // Include total field
                        }
                    },
                );
            }
            

            const invoice_header = await Invoice.aggregate(invoice_header_pipeline);
            
            if(invoice_header.length > 0) {
                return res.json({
                    status: 'success',
                    message: 'terdapat data summary invoice',
                    data: invoice_header,
                });
            } else {
                return res.json({
                    status: 'failed',
                    message: 'tidak terdapat data summary invoice',
                    data: []
                })
            }
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

    summaryAmountInvoiceByCompanyId: async (req, res) => {
        try {
            const company_id = req.params.company_id;
            const company = await Company.findOne({_id: company_id}).lean();
            const connectionDB = decryptString(company.db_connection);
            const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const search = req.query.search;
            let invoice_header_pipeline = [];
            let limit = 10;
            let status = { $ne: "Reject" };
            if (search && search['limit']) limit = parseInt(search['limit']);
            if(search && search['status']) status = search['status'];
            if (search && search['start_date'] && search['end_date']) {
                invoice_header_pipeline.push(
                    {
                        $match: {
                            invoice_status: status,
                            createdAt: {
                                $gte: new Date(search['start_date']),
                                $lte: new Date(search['end_date'])
                            }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: "$createdAt" },
                                month: { $month: "$createdAt" },

                            },
                            total: { $sum: "$total" },
                            total_outstanding: {
                                $sum: {
                                    $cond: { 
                                        if: { $eq: ["$invoice_status", "Outstanding"] }, 
                                        then: "$total", 
                                        else: 0 
                                    }
                                }
                            }
                        }
                    },
                    {
                        $sort: {
                            "_id.year": 1,
                            "_id.month": 1
                        }
                    },
                    {
                        $project: {
                            _id: 0, // Exclude default _id field from output
                            month: "$_id.month",
                            year: "$_id.year",
                            total_outstanding: 1,
                            total: 1 // Include total field
                        }
                    },
                );
            }
            

            const invoice_header = await Invoice.aggregate(invoice_header_pipeline);
            
            if(invoice_header.length > 0) {
                return res.json({
                    status: 'success',
                    message: 'terdapat data summary invoice',
                    data: invoice_header,
                });
            } else {
                return res.json({
                    status: 'failed',
                    message: 'tidak terdapat data summary invoice',
                    data: []
                })
            }
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

    summaryTotalInvoice: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const search = req.query.search;
            let invoice_header_pipeline = [];
            let limit = 10;
            let status = { $ne: "Reject" };
            if(search && search['status']) status = search['status'];
            if(search && search['status'] === "Paid") { 
                status = "Closed";
            }
            const currentDate = new Date();
            let range_date = {
                $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0),
                $lte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59),
            };


            if (search && search['limit']) limit = parseInt(search['limit']);
            if (search && search['start_date'] && search['end_date']) {
                range_date = {
                    $gte: new Date(search['start_date']),
                    $lte: new Date(search['end_date'])
                }
            }
            invoice_header_pipeline.push(
                {
                    $match: {
                        invoice_status: status,
                        createdAt: range_date
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$total" }
                    }
                },
                {
                    $project: {
                        _id: 0, 
                        status: "$invoice_status",
                        total: 1 // Include total field
                    }
                },
            );
            

            const invoice_header = await Invoice.aggregate(invoice_header_pipeline);
            
            if(invoice_header.length > 0) {
                return res.json({
                    status: 'success',
                    message: 'terdapat data summary invoice',
                    data: invoice_header
                });
            } else {
                return res.json({
                    status: 'failed',
                    message: 'tidak terdapat data summary invoice',
                    data: []
                })
            }
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

    summaryAmountInvoiceByStatus: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const search = req.query.search;
            let invoice_header_pipeline = [];
            let limit = 10;

            const currentDate = new Date();
            let range_date = {
                $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0),
                $lte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59),
            };

            if (search && search['limit']) limit = parseInt(search['limit']);
            if (search && search['start_date'] && search['end_date']) {
                range_date = {
                    $gte: new Date(search['start_date']),
                    $lte: new Date(search['end_date'])
                }
            }
            invoice_header_pipeline.push(
                {
                    $match: {
                        invoice_status: { $ne: "Reject" },
                        createdAt: range_date
                    }
                },
                {
                    $group: {
                        _id: {
                            invoice_status: "$invoice_status"
                        },
                        total: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0, 
                        status: "$_id.invoice_status",
                        total: 1 // Include total field
                    }
                },
            );
            

            const invoice_header = await Invoice.aggregate(invoice_header_pipeline);
            
            if(invoice_header.length > 0) {
                return res.json({
                    status: 'success',
                    message: 'terdapat data summary invoice',
                    data: invoice_header
                });
            } else {
                return res.json({
                    status: 'failed',
                    message: 'tidak terdapat data summary invoice',
                    data: []
                })
            }
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

    summaryInvoiceNetProfit: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
            const Invoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
            const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
            const search = req.query.search;
            let invoice_header_pipeline = [];
            let limit = 10;

            const currentDate = new Date();
            let range_date = {
                $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0),
                $lte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59),
            };

            if (search && search['limit']) limit = parseInt(search['limit']);
            if (search && search['start_date'] && search['end_date']) {
                range_date = {
                    $gte: new Date(search['start_date']),
                    $lte: new Date(search['end_date'])
                }
            }
            invoice_header_pipeline.push(
                {
                    $match: {
                        invoice_status: { 
                            $ne: "Reject",
                            $in: ["Closed", "Outstanding"]
                        },
                        createdAt: range_date
                    }
                },
                {
                    $lookup: {
                        from: 'trn_invoice_02',
                        localField: '_id',
                        foreignField: 'inv_id',
                        as: 'detail_invoices'
                    }
                },
                {
                    $unwind: "$detail_invoices"
                },
                {
                    $lookup: {
                        from: 'mst_items',
                        localField: 'detail_invoices.items_id',
                        foreignField: '_id',
                        as: 'items'
                    }
                },
                {
                    $unwind: "$items"
                },
                {
                    $group: {
                        _id: null,
                        totalBeli: { $sum: "$items.price_buy" },
                        totalJual: { $sum: "$items.price_sell" }
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id from output
                        totalBeli: 1,
                        totalJual: 1
                    }
                }
            );

            const invoice_header = await Invoice.find({
                invoice_status: { 
                    $ne: "Reject",
                    $in: ["Closed", "Outstanding"]
                },
                createdAt: range_date
            }, {_id: 1}).lean();
            const invoiceIds = invoice_header.map(invoice => invoice._id);

            const invoice_detail = await Invoice02.find({inv_id: {$in: invoiceIds}}).lean();
            const itemIds = invoice_detail.map(invoice_detail => invoice_detail.items_id);

            // const mst_items = await MstItems.find({_id: {$in: itemIds}}).lean()
            
            const mst_items = await MstItems.aggregate([
                { 
                    $match: { 
                        _id: { $in: itemIds }
                    } 
                },
                {
                    $group: {
                        _id: null,
                        totalBeli: { $sum: "$price_buy" },
                        totalJual: { $sum: "$price_sell" }
                    }
                },
                {
                    $project: {
                        _id: 0, // Exclude _id from output
                        totalBeli: 1,
                        totalJual: 1
                    }
                }
            ]);

            // const invoice_header = await Invoice.aggregate(invoice_header_pipeline);
            
            if(mst_items.length > 0) {
                return res.json({
                    status: 'success',
                    message: 'terdapat data keuntungan penjualan',
                    data: mst_items
                });
            } else {
                return res.json({
                    status: 'failed',
                    message: 'tidak terdapat data keuntungan penjualan',
                    data: []
                })
            }
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
