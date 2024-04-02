const moment = require("moment");
const mongoose = require('mongoose');
const Company = require("../models/MstCompany");
const connectionManager = require("../middleware/db");
const decryptString = require("../utils/decryptString");
const axios = require('axios');
const qs = require('qs');

module.exports = {
    addInvoice: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const company_id = req.user.company_id;
        
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const Warehouse = require("../models/MstWarehouse")(connectionManager.getConnection(connectionDB));
        const Customer = require("../models/MstCustomer")(connectionManager.getConnection(connectionDB));
        try {
            const {
                doc_ref,
                doc_status,
                warehouse_id,
                customer_id,
                disc_value,
                total,
                alamat,
                remarks,
                payment_type,
                total_payment,
                invoice_type,
                is_active,
                pic_input,
                input_time
            } = req.body;
    
    
            let customer = await Customer.findById(customer_id).lean()
            let invoice_status_input = "New";
            let sisaHutang = 0;
            let tanggal_sekarang = Date.now()
            const insert_invoice = {};
            let inv_count = 0;
            let last_invoice = await Invoice.find({}).sort({_id: -1}).limit(1).lean();
            if(last_invoice.length > 0) {
                inv_count = last_invoice[0].count + 1
            }
            if(invoice_type  === "inv_pos") {
                let warehouse = await Warehouse.findById(warehouse_id).lean();
                if(total_payment < total) {
                    sisaHutang = total - total_payment
                    invoice_status_input = "Outstanding"
                } else {
                    invoice_status_input = "Closed"
                }
    
                let newInvoice = new Invoice({
                    doc_ref,
                    doc_status,
                    warehouse_id,
                    warehouse_name: warehouse.warehouse_name,
                    customer_id,
                    customer_name: customer.customer_name,
                    alamat,
                    disc_value,
                    payment_type,
                    price: total_payment,
                    total,
                    sisa_hutang: sisaHutang,
                    remarks,
                    invoice_status: invoice_status_input,
                    invoice_type,
                    is_active,
                    pic_input,
                    input_time,
                });

                const rupiah = (number)=>{
                    return new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR"
                    }).format(number);
                  }
    
                const company = await Company.findOne({ _id: company_id }).lean();
                newInvoice.save((err, data) => {
                    if (err) return res.json({ status: 'Failed', message: 'gagal menambah data invoice ' + err.message, data: [] });
    
                    if (data) {

                        

                        // kirim pesan ke customer
                        let template_pesan = `
Invoice Elektronik

Toko ${company.pt_name}
${company.address}

Pelanggan Yth,
${customer.customer_name}

Nomor Invoice : ${data.invoice_no}

Total Invoice : ${rupiah(data.total)}
Nominal Bayar : ${rupiah(data.price)}
Sisa tagihan  : ${rupiah(data.sisa_hutang)}

Detail Invoice : https://karbo.tech/mki-inventory-web-codeigniter/invoice/view/${company_id}/${data._id}

Terimakasih
                        `;

                        

                        let data_send = qs.stringify({
                            'no_telp': customer.contact1,
                            'pesan': template_pesan
                        });

                        let config = {
                            method: 'post',
                            maxBodyLength: Infinity,
                            url: 'https://karboe.tech/wa_bot/send_pm',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            data: data_send
                        };

                        axios.request(config)
                            .then((response) => {
                                console.log(JSON.stringify(response.data));
                            })
                            .catch((error) => {
                                console.log(error);
                            });

                        return res.json({ status: 'Success', message: 'success menambah data invoice', data: data })
                    }
                })
    
            } else if(invoice_type  === "inv_do") {
    
                let newInvoice = new Invoice({
                    // invoice_no: await generateIsNo("invoice", invoice_type, tanggal_sekarang),
                    doc_ref,
                    doc_status,
                    // warehouse_id,
                    // warehouse_name: warehouse.warehouse_name,
                    customer_id,
                    customer_name: customer.customer_name,
                    alamat,
                    disc_value,
                    payment_type,
                    price: total_payment,
                    total,
                    sisa_hutang: sisaHutang,
                    remarks,
                    invoice_status: invoice_status_input,
                    invoice_type,
                    is_active,
                    pic_input,
                    input_time,
                    // count: inv_count + 1
                });
    
                await newInvoice.save((err, data) => {
                    if (err) return res.json({ status: 'Failed', message: 'gagal menambah data invoice ' + err.message, data: [] });
    
                    if (data) {
                        return res.json({ status: 'Success', message: 'success menambah data invoice', data: data })
                    }
                })
    
            }  else {
                return res.json({
                    status: 'failed',
                    message: 'status invoice tidak di temukan',
                    data: []
                })
            }
    
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    
        }
    },
    
    addInvoiceMobile: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const Warehouse = require("../models/MstWarehouse")(connectionManager.getConnection(connectionDB));
        const generateIsNo = require("../utils/generateIsNo")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        try {
            const {
                doc_status,
                // customer_id,
                customer_name,
                // disc_value,
                list_product,
                // total,
                alamat,
                // remarks,
                invoice_status,
                // invoice_type,
                input_time
            } = req.body;
    
            let date = Date.now()
    
    
    
            // ambil data di trn do
            let doMobile = await TrnDo01.findOne({ partner_id: req.user.id }).lean();
            let warehouse = await Warehouse.findById(doMobile.warehouse_id).lean();
    
            let newInvoice = new Invoice({
                invoice_no: await generateIsNo("invoice", 'inv_on_ride', date),
                doc_ref: doMobile.do_no,
                doc_status,
                warehouse_id: warehouse._id,
                warehouse_name: warehouse.warehouse_name,
                // customer_id,
                customer_name: customer_name,
                alamat,
                // disc_value,
                total: 0,
                // remarks,
                invoice_status,
                invoice_type: "inv_on_ride",
                is_active: 1,
                pic_input: req.user.id,
                input_time: date
            });
    
            let newInvoiceMobile = await newInvoice.save()
    
            let totalInvoice = 0;
            list_product.map(async (item) => {
                let detailInvoice = new TrnInvoice02({
                    inv_id: newInvoiceMobile._id,
                    items_id: item.items_id,
                    price: item.price,
                    qty: item.qty,
                    subtotal: (item.price * item.qty)
                    // disc_percent,
                    // disc_value,
                });
    
                let newDetailInvoice = await detailInvoice.save()
                totalInvoice += newDetailInvoice.subtotal
    
                await Invoice.findByIdAndUpdate(newInvoiceMobile,
                    {
                        $set: {
                            total: totalInvoice
                        }
                    }
                )
            })
    
    
            res.json({
                status: "success",
                message: "berhasil menambahkan invoice",
                data: []
            })
    
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    updateInvoice: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const Warehouse = require("../models/MstWarehouse")(connectionManager.getConnection(connectionDB));
        const Customer = require("../models/MstCustomer")(connectionManager.getConnection(connectionDB));
    
        const {
            doc_ref,
            warehouse_id,
            customer_id,
            disc_value,
            total,
            remarks,
            invoice_status,
            is_active,
            pic_edit,
            edit_time
        } = req.body;
        let warehouseName;
        let customerName;
        let invoice = await Invoice.findById(req.params.id).lean()
        if (invoice) {
            warehouseName = invoice.warehouse_name;
            customerName = invoice.customer_name;
        }
        if (warehouse_id) {
            let warehouse = await Warehouse.findById(warehouse_id).lean();
            warehouseName = warehouse.warehouse_name;
        }
        if (customer_id) {
            let customer = await Customer.findById(customer_id).lean();
            customerName = customer.customer_name
        }
    
        await Invoice.findOneAndUpdate(
            { _id: req.params.id },
            {
                doc_ref,
                disc_value,
                warehouse_id,
                customer_id,
                total,
                warehouse_name: warehouseName,
                customer_name: customerName,
                remarks,
                invoice_status,
                is_active,
                pic_edit,
                edit_time,
            }
        ).exec((err, updateInvoice) => {
            if (err) return res.json({ status: 'Failed', message: 'gagal mengupdate data invoice ' + err.message, data: [] });
    
            if (updateInvoice) {
                return res.json({ status: 'Success', message: 'success mengupdate data invoice', data: updateInvoice })
            }
        })
    },
     
    updateInvoiceV2: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const Customer = require("../models/MstCustomer")(connectionManager.getConnection(connectionDB));
    
        try {
            const { id } = req.params;
            const {
                urut,
                customer_id,
                customer_name,
                total,
                sisa_hutang,
                price,
                remarks,
                invoice_status,
                is_active,
                pic_input,
                payment_type,
                edit_time,
                alamat
            } = req.body;
            let invoice = await Invoice.findById(id).lean()
            if (invoice) {
    
                const invoice_update_pipeline = {};
                if (urut) invoice_update_pipeline.urut = parseInt(urut);
                if (customer_id) {
                    let customer = await Customer.findById(customer_id).lean();
                    if (customer) {
                        invoice_update_pipeline.customer_id = customer._id;
                        invoice_update_pipeline.customer_name = customer.customer_name;
                    }
                }
                if (customer_name) invoice_update_pipeline.customer_name = customer_name;
                if (total) invoice_update_pipeline.total = parseFloat(total);
                if (sisa_hutang) invoice_update_pipeline.sisa_hutang = parseFloat(sisa_hutang);
                if (price) invoice_update_pipeline.price = parseFloat(price);
                if (remarks) invoice_update_pipeline.remarks = remarks;
                if (invoice_status) invoice_update_pipeline.invoice_status = invoice_status;
                if (is_active) invoice_update_pipeline.is_active = is_active;
                if (pic_input) invoice_update_pipeline.pic_input = pic_input;
                if (payment_type) invoice_update_pipeline.payment_type = payment_type;
                if (edit_time) invoice_update_pipeline.edit_time = edit_time;
                if (alamat) invoice_update_pipeline.alamat = alamat;
    
                let invoice_update = await Invoice.findOneAndUpdate(
                        { _id: invoice._id },
                        invoice_update_pipeline
                        )
    
                if (invoice_update) {
                    return res.json({
                        status: 'success',
                        message: 'berhasil update invoice',
                        data: []
                    })
                }
            } else {
                return res.json({
                    status: 'failed',
                    message: 'invoice tidak di temukan',
                    data: []
                })
            }
        } catch (err) {
            res.json({
                status: 'failed',
                message: 'server error : ' + err.message,
                data: []
            })
        }
    },
    
    updateUrutInvoice: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        try {
            const { id, urut, invoice_status, doc_ref } = req.body;
    
            let updateInvoice = await Invoice.findOneAndUpdate(
                { _id: id },
                {
                    urut: urut,
                    invoice_status: "Process",
                    doc_ref: doc_ref
                },
                { new: true }
            );
            if (!updateInvoice) {
                return res.status(400)
                    .json({
                        status: "failed",
                        message: "gagal mengupdate no urut invoice",
                        data: []
                    })
            }
    
            res
                .status(200)
                .json({
                    status: "success",
                    message: "berhasil mengupdate data",
                    data: updateInvoice
                })
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    deleteInvoice: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        try {
            await Invoice.findByIdAndUpdate(
                { _id: req.params.id },
                { is_active: 0 }
            ).exec((err, deleteInvoice) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal delete data invoice ' + err.message, data: [] });
    
                if (deleteInvoice) {
                    return res.json({ status: 'Success', message: 'success delete data invoice', data: deleteInvoice })
                }
            })
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    GetInvoice: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const {type_user} = req.query;
        try {
            let statusInvoice = "unpaid";
            if (req.query.id) {
                await Invoice.aggregate([
                    { $match: { $expr: { $eq: ['$_id', { $toObjectId: req.query.id }] } } },
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
                        $sort: {
                            createdAt: -1
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
                            path: '$warehouse',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $unwind: {
                            path: '$customer',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'trn_do_01',
                            startWith: '$doc_ref',
                            connectFromField: 'do_no',
                            connectToField: 'do_no',
                            as: 'do_header'
                        }
                    },
                    {
                        $unwind: {
                            path: '$do_header',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'mst_partner',
                            startWith: '$do_header.partner_id',
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
                        $replaceRoot: {
                            newRoot: {
                                $mergeObjects: [
                                    {
                                        "_id": "$_id",
                                        "invoice_no": "$invoice_no",
                                        "doc_ref": "$doc_ref",
                                        "doc_status": "$doc_status",
                                        "urut": "$urut",
                                        "warehouse_id": "$warehouse_id",
                                        "warehouse_name": "$warehouse_name",
                                        "customer_id": "$customer_id",
                                        "customer_name": "$customer_name",
                                        "keterangan": { $ifNull: ["$keterangan", ""] },
                                        "penerima": { $ifNull: ["$penerima", ""] },
                                        "alamat": { $ifNull: ["$customer.address", "$alamat"] },
                                        "total": "$total",
                                        "price": "$price",
                                        "invoice_status": "$invoice_status",//{ $cond: { if: { $lte: [ "$price", 0 ] }, then: "Outstanding", else: "Paid" }},
                                        "invoice_type": "$invoice_type",
                                        "payment_type": {$ifNull: ["$payment_type", ""]},
                                        "input_time": "$input_time",
                                        "edit_time": "$edit_time",
                                        "createdAt": "$createdAt",
                                        "updatedAt": "$updatedAt",
                                        "remarks": "$remarks",
                                        "warehouse": "$warehouse",
                                        "customer": "$customer",
                                        "do_header": {$ifNull: ["$do_header", {}]},
                                        "partner": {$ifNull: ["$partner", {}]}
                                    },
                                ]
                            }
                        }
                    }
    
                ]).exec((err, invoiceData) => {
                    if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data invoice ' + err.message, data: [] });
                    if (invoiceData) {
                        return res.json({ status: 'Success', message: 'success mendapatkan data invoice', data: invoiceData })
                    }
                })
            } else if (req.query.isCheck === "1") {
    
                let result = [];
                let result2 = [];
                let invoice;
                let invoice02;
                let resultObj = {};
                let result3 = []
                let result4 = []
                let totalBarang = 0;
                let ids = []
                let body = Object.keys(req.body).length > 0
                if (!body) {
                    return res.json({
                        status: "failed",
                        message: "tidak terdapat id",
                        data: []
                    })
                }
                for (const data of req.body) {
                    invoice = await Invoice.aggregate([
                        { $match: { $expr: { $eq: ['$_id', { $toObjectId: data }] } } },
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
                                            "_id": "$_id",
                                            "invoice_no": "$invoice_no",
                                            "doc_ref": "$doc_ref",
                                            "doc_status": "$doc_status",
                                            "urut": "$urut",
                                            "warehouse_id": "$warehouse_id",
                                            "warehouse_name": "$warehouse_name",
                                            "customer_id": "$customer_id",
                                            "customer_name": "$customer_name",
                                            "penerima": { $ifNull: ["$penerima", ""] },
                                            "alamat": { $ifNull: ["$customer.address", "$alamat"] },
                                            "total": "$total",
                                            "price": "$price",
                                            "invoice_status": "$invoice_status",//{ $cond: { if: { $lte: [ "$price", 0 ] }, then: "Outstanding", else: "Paid" }},
                                            "invoice_type": "$invoice_type",
                                            "payment_type": {$ifNull: ["$payment_type", ""]},
                                            "input_time": "$input_time",
                                            "edit_time": "$edit_time",
                                            "createdAt": "$createdAt",
                                            "updatedAt": "$updatedAt",
                                            "warehouse": "$warehouse",
                                            "customer": "$customer",
                                            "do_header": {$ifNull: ["$do_header", {}]},
                                            "partner": {$ifNull: ["$partner", {}]}
                                        },
                                    ]
                                }
                            }
                        }
                    ])
                    for (const resultData of invoice) {
                        result.push(resultData)
                    }
    
                    ids.push(invoice[0]._id)
    
    
                }
    
    
                invoice02 = await TrnInvoice02.aggregate([
                    {
                        $match: {
                            inv_id: { $in: ids }
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
                        $sort: {
                            items_id: -1
                        }
                    }
                    // {
                    //     $group: {
                    //         _id: "$items_id",
                    //         // totalBarang: { $sum: "$qty" },
                    //         namaBarang: { $addToSet: "$items.items_name" }
                    //     }
                    // },
    
                    // { $unwind: "$namaBarang" }
    
                    // {
                    //     $replaceRoot: {
                    //         newRoot: {
                    //             $mergeObjects: [
                    //                 "$items",
                    //                 {
                    //                     // 'nama_barang': "$items.items_name",
                    //                 }
                    //             ]
                    //         }
                    //     }
                    // }
                ]);
                for (const resultData2 of invoice02) {
    
                    result2.push(resultData2)
                }
                if (!result) {
                    return res.status(404).json({
                        status: "failed",
                        message: "gagal mendapatkan data",
                        data: []
                    })
                }
    
                res
                    .status(200)
                    .json({
                        status: "success", message: "berhasil mendapatkan data invoice", data: result, detail: result2
                    })
    
    
            }
            else {
                let result = ["inv_pos", "inv_do", "inv_on_ride"]
                if(type_user === "mobile") {
                    result = ["inv_on_ride"]
                } else if(type_user === "admin") {
                    result =["inv_pos", "inv_do"]
                }
                await Invoice.aggregate([
                    {$match: {
                        invoice_type: {
                            $in: result
                        }
                    }},
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
                        $sort: {
                            createdAt: -1
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
                            path: '$warehouse',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $unwind: {
                            path: '$customer',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'trn_do_01',
                            startWith: '$doc_ref',
                            connectFromField: 'do_no',
                            connectToField: 'do_no',
                            as: 'do_header'
                        }
                    },
                    {
                        $unwind: {
                            path: '$do_header',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'mst_partner',
                            startWith: '$do_header.partner_id',
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
                        $replaceRoot: {
                            newRoot: {
                                $mergeObjects: [
                                    {
                                        "_id": "$_id",
                                        "invoice_no": "$invoice_no",
                                        "doc_ref": "$doc_ref",
                                        "doc_status": "$doc_status",
                                        "urut": "$urut",
                                        "warehouse_id": "$warehouse_id",
                                        "warehouse_name": "$warehouse_name",
                                        "customer_id": "$customer_id",
                                        "customer_name": "$customer_name",
                                        "penerima": { $ifNull: ["$penerima", ""] },
                                        "alamat": { $ifNull: ["$customer.address", "$alamat"] },
                                        "total": "$total",
                                        "price": "$price",
                                        "invoice_status":  {
                                            $cond: { if: { $eq: [ "$invoice_status", "Closed" ] }, then: "Paid", else: "$invoice_status" }
                                          },
                                        "invoice_type": "$invoice_type",
                                        "payment_type": {$ifNull: ["$payment_type", ""]},
                                        "input_time": "$input_time",
                                        "edit_time": "$edit_time",
                                        "createdAt": "$createdAt",
                                        "updatedAt": "$updatedAt",
                                        "warehouse": "$warehouse",
                                        "customer": "$customer",
                                        "do_header": {$ifNull: ["$do_header", {}]},
                                        "partner": {$ifNull: ["$partner", {}]}
                                    },
                                ]
                            }
                        }
                    }
    
    
                ]).exec((err, invoiceData) => {
                    if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data invoice ' + err.message, data: [] });
                    if (invoiceData) {
                        return res.json({ status: 'Success', message: 'success mendapatkan data invoice', data: invoiceData })
                    }
                })
            }
    
    
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    GetInvoicev2: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const MstPartner = require('../models/MstPartner')(connectionManager.getConnection(connectionDB));
        const payment_type = req.query.payment_type;
        const type_user = req.query.type_user;
        const id = req.query.id;
        const isCheck = req.query.isCheck;
        const start_range = parseInt(req.query.start_range) || 0;
        const end_range = parseInt(req.query.end_range) || 0;
        const search = req.query.search;
        try {
            // serialization query params
            let detail_invoice = [];
            let skip = 0;
            const invoice_pipeline = [];
            let invoice_total_search_data = [];
            let total_page = 1;
            let total_count_invoice = 0;
            let result = ["inv_pos", "inv_do", "inv_on_ride"];
            const limit_result = end_range - start_range;
            const skipCount = start_range * limit_result; // Calculate the skip count based on the page number

            invoice_pipeline.push(
                {
                    $match: {
                        is_active: 1
                    }
                },
                { $sort: { createdAt: -1, _id: -1 } }
            );
            const invoice_filter = {};
            invoice_filter['is_active'] = 1;
            if (id) invoice_filter['_id'] = id;
            if (payment_type) invoice_filter['payment_type'] = payment_type;
            const invoice_header = await Invoice.find(invoice_filter).sort({ createdAt: -1, _id: -1 }).lean();

            if (id) invoice_pipeline.push({$match: { $expr: { $eq: ['$_id', { $toObjectId: id }] }}});
            if (payment_type) invoice_pipeline.push({$match: { $expr: { $eq: ['$payment_type', payment_type] }}});
            
            invoice_pipeline.push(
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
                        from: 'mst_customer',
                        startWith: '$customer_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'customer'
                    }
                },
                {
                    $unwind: {
                        path: '$customer',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $graphLookup: {
                        from: 'trn_do_01',
                        startWith: '$doc_ref',
                        connectFromField: 'do_no',
                        connectToField: 'do_no',
                        as: 'do_header'
                    }
                },
                {
                    $unwind: {
                        path: '$do_header',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $graphLookup: {
                        from: 'mst_partner',
                        startWith: '$do_header.partner_id',
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
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                {
                                    "_id": "$_id",
                                    "nama_file": {$ifNull: [ "$nama_file", ""]},
                                    "tautan_file": {"$concat": ["https://karboe.tech","$tautan_file"]},
                                    "invoice_no": {$ifNull: [ "$invoice_no", ""]},
                                    "doc_ref": {$ifNull: [ "$doc_ref", ""]},
                                    "doc_status": {$ifNull: [ "$doc_status", ""]},
                                    "urut": {$ifNull: [ "$urut", ""]},
                                    "warehouse_id": {$ifNull: [ "$warehouse_id", ""]},
                                    "warehouse_name": {$ifNull: [ "$warehouse_name", ""]},
                                    "customer_id": {$ifNull: [ "$customer_id", ""]},
                                    "customer_name": {$ifNull: [ "$customer_name", ""]},
                                    "keterangan": { $ifNull: ["$keterangan", ""] },
                                    "penerima": { $ifNull: ["$penerima", ""] },
                                    "alamat": { $ifNull: ["$customer.address", "$alamat", ""] },
                                    "total": "$total",
                                    "total_invoice": "$total",
                                    "price": { $ifNull: ["$price", 0] },
                                    "total_bayar": { $ifNull: ["$price", 0] },
                                    "invoice_status": { $cond: { if: { $eq: [ "$invoice_status", "Closed" ] }, then: "Paid", else: "$invoice_status" }},
                                    "invoice_type": { $ifNull: ["$invoice_type", ""] },
                                    "payment_type": { $ifNull: ["$payment_type", ""] },
                                    "input_time": "$input_time",
                                    "edit_time": "$edit_time",
                                    "createdAt": "$createdAt",
                                    "updatedAt": "$updatedAt",
                                    "remarks": "$remarks",
                                    "warehouse": {$ifNull: [ "$warehouse", ""]},
                                    "customer": "$customer",
                                    "do_header": { $ifNull: ["$do_header", {}] },
                                    "assistant": { $ifNull: ["$do_header.assistant", ""] },
                                    "partner": {
                                        "_id": { $ifNull: ["$partner._id", ""] },
                                        "partner_name": { $ifNull: ["$partner.partner_name", ""] },
                                        "phone": { $ifNull: ["$partner.phone", ""] },
                                        "password": { $ifNull: ["$partner.password", ""] },
                                        "partner_pic": { $ifNull: ["$partner.partner_pic", ""] },
                                        "tautan": { $ifNull: ["$partner.tautan", ""] },
                                        "url_transaction": { $ifNull: ["$partner.url_transaction", ""] },
                                        "is_active": { $ifNull: ["$partner.is_active", ""] },
                                        "createdAt": { $ifNull: ["$partner.createdAt", ""] },
                                        "updatedAt": { $ifNull: ["$partner.updatedAt", ""] },
                                        "__v": { $ifNull: ["$partner.__v", ""] }
                                    }
                                },
                            ]
                        }
                    }
                }
            );
    
            if (search) {
               
                invoice_pipeline.push({
                    $match:
                    {
                        $or: [
                            {'partner.partner_name': { $regex: search, $options: 'i' }},
                            {'invoice_no': { $regex: search, $options: 'i' }},
                            { 'customer_name': { $regex: search, $options: 'i' }},
                            { 'invoice_status': { $regex: search, $options: 'i' }},
                        ]
                    },
                },
                );

                if (start_range && typeof start_range === "number") invoice_pipeline.push({ "$skip": start_range });
                if (!search && end_range) invoice_pipeline.push({ "$limit": limit_result });

                invoice_pipeline.push({"$limit" : limit_result});
                invoice_total_search_data.push(
                    
                    {
                        $graphLookup: {
                            from: 'trn_do_01',
                            startWith: '$doc_ref',
                            connectFromField: 'do_no',
                            connectToField: 'do_no',
                            as: 'do_header'
                        }
                    },
                    {
                        $unwind: {
                            path: '$do_header',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'mst_partner',
                            startWith: '$do_header.partner_id',
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
                )
                invoice_total_search_data.push({
                    $match:
                    {
                        $or: [
                            {'partner.partner_name': { $regex: search, $options: 'i' }},
                            {'invoice_no': { $regex: search, $options: 'i' }},
                            { 'customer_name': { $regex: search, $options: 'i' }},
                            { 'invoice_status': { $regex: search, $options: 'i' }},
                        ]
                    },
                })
                
                invoice_total_search_data.push({
                    $group: {
                        _id: null, // Group all documents into a single group (null)
                        count: { $sum: 1 } // Use $sum to count the number of documents in each group
                    }
                });

               
    
                
                let count_invoice_data = await Invoice.aggregate([invoice_pipeline]);
                const total_count_invoice = await Invoice.aggregate([invoice_total_search_data]);
                
                const partners = await MstPartner.find({partner_name: { $regex: search, $options: 'i' }});
                let partner_ids = [];
                for (const partner of partners) {
                    partner_ids.push(partner._id)
                }
                const total_count_invoice2 = await Invoice.countDocuments({
                    $or: [
                        // {'partner.partner_name': { $regex: search, $options: 'i' }},
                        {partner_id: {
                            $in: partner_ids
                        }},
                        {'invoice_no': { $regex: search, $options: 'i' }},
                        { 'customer_name': { $regex: search, $options: 'i' }},
                        { 'invoice_status': { $regex: search, $options: 'i' }},
                    ]
                });
                if(count_invoice_data.length > 0) {
                    return res.json({ 
                        status: 'Success',
                        message: 'success mendapatkan data invoice',
                        start_data: start_range,
                        end_data: end_range,
                        total_count: total_count_invoice[0].count,
                        count: count_invoice_data.length, 
                        total_page: Math.floor(total_count_invoice[0].count /parseInt(limit_result)),
                        page: Math.floor(parseInt(total_count_invoice[0].count) / parseInt(limit_result)),
                        data: count_invoice_data,
                        detail:  []
                    })
                } else {
                    return res.json({ 
                        status: 'Success',
                        message: 'success mendapatkan data invoice',
                        start_data: start_range,
                        end_data: end_range,
                        total_count: 0,
                        count: 0, 
                        // total_page: total_page,
                        // page: page,
                        data: [],
                        detail:  []
                    })
                }
            }
            else {
                total_count_invoice = await Invoice.countDocuments({is_active: 1})
            }
            
            if(type_user === "mobile") {
                result = ["inv_on_ride"]
            } else if(type_user === "admin") {
                result =["inv_pos", "inv_do"]
            }
            if (result) invoice_pipeline.push({ $match: { invoice_type: { $in: result } } });
            let id_array = [];
           if(isCheck === "1") {
               let body = Object.keys(req.body).length > 0
               if (!body) {
                   return res.json({
                       status: "failed",
                       message: "tidak terdapat id",
                       data: []
                   })
               }
               for (const data of req.body) {
                id_array.push(mongoose.Types.ObjectId(data))
               }
               invoice_pipeline.push({ $match: {_id: {$in: id_array}}});
           }
            if(limit_result > 0) {
            total_page = Math.round(total_count_invoice / parseInt(limit_result));
    
            } else {
                total_page = Math.round(total_count_invoice);
            }

            if (start_range && typeof start_range === "number")  invoice_pipeline.push({"$skip" : start_range});
            if(!search && end_range) invoice_pipeline.push({"$limit" : limit_result});

            let invoiceData = await Invoice.aggregate([invoice_pipeline]);
            if (isCheck === "1") {
                
                detail_invoice = await TrnInvoice02.aggregate([
                    {
                        $match: {
                            inv_id: { $in: id_array }
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
                        $sort: {
                            items_id: -1
                        }
                    }
                ]);
    
            }
            
            return res.json({ 
                status: 'Success',
                message: 'success mendapatkan data invoice',
                start_data: start_range,
                end_data: skip,
                total_count: total_count_invoice,
                count: invoiceData.length, 
                total_page: total_page,
                data: invoiceData,
                detail:  detail_invoice
            });
            
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },

    getInvoiceMobile: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        try {
            const { date } = req.body;
            let doPartner = await TrnDo01.findOne({ partner_id: req.user.id, do_status: "Process", do_date: date }).lean()
            let invoice = await Invoice.find({ doc_ref: doPartner.do_no }).lean();
    
    
    
    
    
    
    
            let resultArr = [];
            if (invoice) {
                let hasilAkhir = [];
                for (const inv_header of invoice) {
    
                    const objResult = {};
                    let total = 0;
                    //
                    objResult._id = inv_header._id,
                        objResult.invoice_no = inv_header.invoice_no,
                        objResult.doc_ref = inv_header.doc_ref,
                        objResult.warehouse_id = inv_header.warehouse_id,
                        objResult.warehouse_name = inv_header.warehouse_name,
                        objResult.customer_id = inv_header.customer_id,
                        objResult.customer_name = inv_header.customer_name,
                        objResult.total = inv_header.total,
                        objResult.remarks = inv_header.remarks,
                        objResult.invoice_status = inv_header.invoice_status,
                        objResult.invoice_type = inv_header.invoice_type,
                        objResult.is_active = inv_header.is_active,
                        objResult.pic_input = inv_header.pic_input,
                        objResult.input_time = inv_header.input_time,
                        objResult.edit_time = inv_header.edit_time,
                        objResult.createdAt = inv_header.createdAt,
                        objResult.updatedAt = inv_header.updatedAt,
                        objResult.urut = inv_header.urut,
    
                        resultArr.push(objResult)
                    // hasilAkhir.push(resultArr)
    
                    let detailInvoice = await TrnInvoice02.find({ inv_id: inv_header._id }).lean();
                    let resultDetail = [];
                    for (const detailInv of detailInvoice) {
                        let items = await MstItems.findById(detailInv.items_id).lean()
                        let objDetail = {};
                        objDetail._id = items._id;
                        objDetail.items_code = items.items_code;
                        objDetail.items_name = items.items_name;
                        objDetail.items_name = items.items_name;
                        objDetail.qty = detailInv.qty;
                        objDetail.price = detailInv.price;
                        objDetail.subtotal = detailInv.subtotal;
    
    
                        total += detailInv.subtotal
    
                        // resultDetail += JSON.stringify(objDetail)
                        resultDetail.push(objDetail)
    
                    }
                    objResult.detail_invoice = resultDetail
    
                    objResult.nilai_bayar = inv_header.price
                    objResult.sum_total_invoice = total
    
    
                }
                res.json({ status: "success", message: "berhasil mendapatkan invoice", data: resultArr })
    
    
            }
    
            let invoice2 = await Invoice.aggregate([
                {
                    '$match': {
                        doc_ref: doPartner.do_no
                    }
                },
                {
                    '$graphLookup': {
                        'from': 'trn_invoice_02',
                        'startWith': '$_id',
                        'connectFromField': 'inv_id',
                        'connectToField': 'inv_id',
                        'as': 'detail_invoice'
                    }
                },
                {
                    $unwind: {
                        "path": "$detail_invoice"
                    }
                },
                {
                    '$graphLookup': {
                        'from': 'mst_items',
                        'startWith': '$detail_invoice.items_id',
                        'connectFromField': '_id',
                        'connectToField': '_id',
                        'as': 'items'
                    }
                },
    
                {
                    $unwind: {
                        "path": "$items"
                    }
                },
    
    
                // {
                //     $project: {
                //         "_id": "$_id",
                //         "invoice_no": "$invoice_no",
                //         "doc_ref": "$doc_ref",
                //         "warehouse_id": "$warehouse_id",
                //         "warehouse_name": "$warehouse_name",
                //         "customer_id": "$customer_id",
                //         "customer_name": "$customer_name",
                //         "total": "$total",
                //         "remarks": "$remarks",
                //         "invoice_status": "$invoice_status",
                //         "invoice_type": "$invoice_type",
                //         "is_active": "$is_active",
                //         "pic_input": "$pic_input",
                //         "input_time": "$input_time",
                //         "edit_time": "$edit_time",
                //         "createdAt": "$createdAt",
                //         "updatedAt": "$updatedAt",
                //         "urut": "$urut",
                //         "nilai_bayar": "$price",
                //         'detail_invoice': '$detail_invoice',
                //         'items': "$items",
                //         'sum_total_invoice': {
                //             '$sum': '$detailInvoice.subtotal'
                //         },
    
                //         // 'detail_invoice': { $concatArrays: ["$detail_invoice", "$items"] }
                //     }
                // },
                // {
                //     $unwind: "$detail_invoice"
                // },
    
    
                {
                    '$replaceRoot': {
                        'newRoot': {
    
                            '$mergeObjects': [
                                {
                                    "_id": "$_id",
                                    "invoice_no": "$invoice_no",
                                    "doc_ref": "$doc_ref",
                                    "warehouse_id": "$warehouse_id",
                                    "warehouse_name": "$warehouse_name",
                                    "customer_id": "$customer_id",
                                    "customer_name": "$customer_name",
                                    "total": "$total",
                                    "remarks": "$remarks",
                                    "invoice_status": "$invoice_status",
                                    "invoice_type": "$invoice_type",
                                    "is_active": "$is_active",
                                    "pic_input": "$pic_input",
                                    "input_time": "$input_time",
                                    "edit_time": "$edit_time",
                                    "createdAt": "$createdAt",
                                    "updatedAt": "$updatedAt",
                                    "urut": "$urut",
                                    "nilai_bayar": "$price"
                                },
                                {
                                    'items_id': '$detail_invoice.items_id',
                                    "items_code": "$items.items_code",
                                    "items_name": "$items.items_name",
                                    'qty': '$detail_invoice.qty',
                                    // 'items': '$items',
                                    'sum_total_invoice': {
                                        '$sum': '$detail_invoice.subtotal'
                                    },
                                },
                            ],
                        }
                    }
                },
    
                // {
                //     $group: {
                //         _id: {
                //             // invoice_no: "$invoice_no",
                //             items_id: "$items_id"
                //         }
                //     }
                // }
    
                // {
                //     $group: {
                //         _id: "$items_id",
                //         // _id: "6321527a974edfc6ce2773e8",
                //         // invoice_no: "IND202209001",
                //         // doc_ref: {$first: "$$ROOT"},
                //         // warehouse_id: {$first: "$warehouse_id"},
                //         // warehouse_name: {$first: "$warehouse_name"},
                //         // customer_id: "63215023974edfc6ce2773bd",
                //         // customer_name: "Rizal Ramli",
                //         // total: 23000,
                //         // remarks": "",
                //         // invoice_status": "Closed",
                //         // invoice_type": "inv_do",
                //         // is_active": 1,
                //         // pic_input": "62e38b347306f95decd420ed",
                //         // input_time": "2022-09-14T11:03:06.652Z",
                //         // edit_time": "2022-09-14T11:03:06.652Z",
                //         // createdAt": "2022-09-14T04:03:06.654Z",
                //         // updatedAt": "2022-09-14T15:13:19.755Z",
                //         // urut": 2,
                //         // nilai_bayar": 0,
                //         // items_id: {$first: "$items_id"},
                //         // items_code: {$first: "$items_code"},
                //         // items_name: "barang c",
                //         // sum_total_invoice: 8000
                //     }
                // },
            ])
    
            // const detail_invoice ={};
            let arr = [];
            // let arr2 = [];
            // for (let i = 0; i < invoice.length; i++) {
            //    let invoiceHeader = await Invoice.findOne({invoice_no: invoice[i].invoice_no}).lean();
            //     if(invoiceHeader) {
            //         arr.push(invoice[i])
            //     }
    
    
            // }
    
    
            // const groupByCategory = invoice.reduce((group, product) => {
            //     const { invoice_no } = product;
            //     group[invoice_no] = group[invoice_no] ?? [];
            //     group[invoice_no].push(product);
            //     return group;
            //   }, {});
    
    
    
    
        } catch (err) {
            return res.json({ status: 'failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    GetInvoiceDo: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
    
        try {
            await Invoice.aggregate([
                {
                    $match: { invoice_type: "inv_do", invoice_status: "New" }
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
                    $unwind: '$customer'
                },
            ]).exec((err, invoiceData) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data invoice ' + err.message, data: [] });
                if (invoiceData) {
                    return res.json({ status: 'Success', message: 'success mendapatkan data invoice', data: invoiceData })
                }
            })
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    
    rejectInvoice: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const Invoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
        const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
        const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
        const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        try {
            const { id } = req.params;
    
            let invoice = await Invoice.findById(id).lean();
    
            if(invoice) {
                let delivery_order = await TrnDo01.findOne({do_no: invoice.doc_ref, do_status: 'Process'}).lean()
    
    
                let invoiceDetail = await Invoice02.find({ inv_id: invoice._id }).lean()
    
                let tgl_skrng = Date.now()
    
                await Invoice.findOneAndUpdate(
                    {_id: invoice._id},
                    {
                        $set: {
                            invoice_status: 'Reject'
                        }
                    }
                    )
    
                if (invoice.invoice_type == 'inv_pos') {
                    for (let i = 0; i < invoiceDetail.length; i++) {
    
                        let stock = await TrnStock.findOne({ items_id: invoiceDetail[i].items_id, warehouse_id: invoice.warehouse_id }).lean()
                        await TrnStock.findOneAndUpdate(
                            { items_id: invoiceDetail[i].items_id, warehouse_id: invoice.warehouse_id },
                            {
                                items_in: invoiceDetail[i].qty,
                                items_out: 0,
                                old_stock: stock.current_stock,
                                current_stock: stock.current_stock + invoiceDetail[i].qty,
                                activity: "POS_RJ",
                                trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                                trn_month: moment(tgl_skrng).format("MM"),
                                trn_year: moment(tgl_skrng).format("YYYY"),
                            }
                            )
    
                        let newHistoryStock = await StockHistory({
                            items_id: invoiceDetail[i].items_id,
                            doc_no: invoice.invoice_no,
                            warehouse_id: invoice.warehouse_id,
                            trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                            trn_month: moment(tgl_skrng).format("MM"),
                            trn_year: moment(tgl_skrng).format("YYYY"),
                            activity: "POS_RJ",
                            qty: invoiceDetail[i].qty,
                            old_stock: stock.current_stock,
                            current_stock: stock.current_stock + invoiceDetail[i].qty
                        });
    
                        await newHistoryStock.save();
    
                        let qty_value = invoiceDetail[i].qty
    
                        await stockByDoc.find(
                            {
                                warehouse_id: invoice.warehouse_id,
                                items_id: invoiceDetail[i].items_id,
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
                                        total_barang = total_barang + (invoiceDetail[i].qty * dataByDoc[i].items_price)
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
    
                        // let newStockByDoc = new stockByDoc({
                        //     items_id: invoiceDetail[i].items_id,
                        //     doc_no: invoice.invoice_no,
                        //     warehouse_id: invoice.warehouse_id,
                        //     trn_date: moment(tgl_skrng).format("YYYY-MM-DD"),
                        //     trn_month: moment(tgl_skrng).format("MM"),
                        //     trn_year: moment(tgl_skrng).format("YYYY"),
                        //     activity: "POS_RJ",
                        //     items_in: invoiceDetail[i].qty,
                        //     items_out: 0,
                        //     items_price: invoiceDetail[i].price,
                        //     items_remaining: stock.current_stock + invoiceDetail[i].qty,
                        //     old_stock: stock.current_stock,
                        //     current_stock: stock.current_stock + invoiceDetail[i].qty,
                        //     createdAt: moment(invoice.createdAt).startOf('month').format('YYYY-MM-DD hh:mm'),
                        // })
    
                        // await newStockByDoc.save()
    
                    }
                } else if (invoice.invoice_type === 'inv_on_ride') {
                    let totalInvoice = 0;
                    let arrayUpdate = [];
                    for (const invoice_detail of invoiceDetail) {
                        const objUpdate = {};
                        // if(delivery_order_detail) {
                        //     await TrnDo02.findOneAndUpdate(updatePipeline,
                        //         {
                        //             $set: {
                        //                 qty: delivery_order_detail.qty + invoice_detail.qty
                        //             }
                        //         }
                        //     )
                        // }
    
                        // TrnDebtItems
    //                    if(invoice_detail) {
    //                        
    //                        let items = await MstItems.findById(invoice_detail.items_id).lean();
    //                        console.log(tems.replace_id)
    //                        if(items.replace_id !== "") {
    //                        let debt_items = await TrnDebtItems.findOne({items_id: items.replace_id, inv_no: invoice.invoice_no}).lean()
    //                        if(debt_items) {
    //                            const debItemsPipeline = {items_id: items.replace_id, inv_no: invoice.invoice_no}
    //                            await TrnDebtItems.findOneAndRemove(debItemsPipeline)
    //                        } 
    //                            
    //                        }
    //                    }
                        
                    }
                } else if (invoice.invoice_type === 'inv_do') {
                    if(invoice.invoice_status === 'Process') {
                        for (const invoice_detail of invoiceDetail) {
    
                            const updatePipeline = {do_id: delivery_order._id, items_id: invoice_detail.items_id}
                            let delivery_order_detail = await TrnDo02.findOne(updatePipeline).lean();
    
                            // if(delivery_order_detail) {
                            //     await TrnDo02.findOneAndUpdate(updatePipeline,
                            //         {
                            //             $set: {
                            //                 qty: delivery_order_detail.qty + invoice_detail.qty
                            //             }
                            //         }
                            //     )
                            // }
    
                            // TrnDebtItems
                            let items = await MstItems.findById(invoice_detail.items_id).lean();
    //                        if(items.replace_id !== "") {
    //                        let debt_items = await TrnDebtItems.findOne({items_id: items.replace_id, inv_no: invoice.invoice_no}).lean()
    //                        if(debt_items) {
    //
    //                            const debItemsPipeline = {items_id: items.replace_id, inv_no: invoice.invoice_no}
    //                            await TrnDebtItems.findOneAndRemove(debItemsPipeline)
    //                        }
    //                            
    //                        }
                        }
                    }
                }
    
    
    
            } else {
                return res.json({
                    status: 'failed',
                    message: 'invoice tidak di temukan',
                    data: []
                })
            }
    
    
            return res.json({
                status: "success",
                message: "berhasil reject invoice",
                data: []
            })
    
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getInvoiceDate: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        try {
            const date_from = req.params.date_from
            const date_to = req.params.date_to
            await Invoice.aggregate([
                {
                    $match:
                    {
                        $expr: { input_time: { $gte: ISODate(date_from), $lt: ISODate(date_to) } },
                        invoice_status: "Closed"
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
                    $sort: {
                        createdAt: -1
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
                    $unwind: '$warehouse'
                },
                {
                    $unwind: '$customer'
                },
            ]).exec((err, invoiceData) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data invoice ' + err.message, data: [] });
                if (invoiceData) {
                    return res.json({ status: 'Success', message: 'success mendapatkan data invoice', data: invoiceData })
                }
            })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    getOutstandingInvoice: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        try {
            let invoice = await Invoice.find({invoice_status: "Outstanding"}).lean();
    
            if(invoice.length > 0) {
                return res.json({
                    status: "success",
                    message: "berhasil mendapatkan invoice outstanding",
                    data: invoice
                })
            }
    
            return res.json({
                status: "failed",
                message: "tidak terdapat data",
                data: []
            })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },
    
    invoicePayment: async (req, res) => {
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        try {
            const {id} = req.params;
            const {total_payment, payment_type, remarks} = req.body;
            let invoice = await Invoice.findById(id).lean();
            let status = "Closed"
    
            if(total_payment < 0) {
                return res.json({
                    status: "failed",
                    message: "nilai pembayaran harus positif",
                    data: []
                })
            }
    
            let hargaSisaHutang = parseInt(invoice.total) - parseInt(invoice.price);
    
            if(hargaSisaHutang < parseInt(total_payment)) {
                return res.json({
                    status: "failed",
                    message: "total pembayaran melebihi hutang",
                    data: []
                })
            }
    
            if(hargaSisaHutang > parseInt(total_payment)) {
                status = "Outstanding"
            }
            
            // if(hargaSisaHutang == parseInt(total_payment)) {
            //     status = "Paid"
            // }
    
            let invoice_payment = await Invoice.findByIdAndUpdate(id, {
                payment_type,
                invoice_status: status,
                price: invoice.price + parseInt(total_payment),
            });
    
            return res.json({
                status: "success",
                message: "invoice berhasil di bayar",
                data: []
            })
    
        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    },

    invoiceHeaderByCompanyId: async (req, res) => {
        const { company_id, invoice_id } = req.params;
        const company = await Company.findOne(
            { _id: company_id, is_active: 1 }
        );

        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(decryptString(company.db_connection)));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(decryptString(company.db_connection)));
        const MstPartner = require('../models/MstPartner')(connectionManager.getConnection(decryptString(company.db_connection)));
        const payment_type = req.query.payment_type;
        const type_user = req.query.type_user;
        const isCheck = req.query.isCheck;
        const start_range = parseInt(req.query.start_range) || 0;
        const end_range = parseInt(req.query.end_range) || 0;
        const search = req.query.search;
        try {
            // serialization query params
            let detail_invoice = [];
            let skip = 0;
            const invoice_pipeline = [];
            let invoice_total_search_data = [];
            let total_page = 1;
            let total_count_invoice = 0;
            let result = ["inv_pos", "inv_do", "inv_on_ride"];
            const limit_result = end_range - start_range;
            const skipCount = start_range * limit_result; // Calculate the skip count based on the page number


            invoice_pipeline.push(
                {
                    $match: {
                        is_active: 1
                    }
                },
                { $sort: { createdAt: -1, _id: -1 } }
            );


            if (invoice_id) invoice_pipeline.push({ $match: { $expr: { $eq: ['$_id', { $toObjectId: invoice_id }] } } });
            if (payment_type) invoice_pipeline.push({ $match: { $expr: { $eq: ['$payment_type', payment_type] } } });

            invoice_pipeline.push(
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
                        from: 'mst_customer',
                        startWith: '$customer_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'customer'
                    }
                },
                {
                    $unwind: {
                        path: '$customer',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $graphLookup: {
                        from: 'trn_do_01',
                        startWith: '$doc_ref',
                        connectFromField: 'do_no',
                        connectToField: 'do_no',
                        as: 'do_header'
                    }
                },
                {
                    $unwind: {
                        path: '$do_header',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $graphLookup: {
                        from: 'mst_partner',
                        startWith: '$do_header.partner_id',
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
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                {
                                    "_id": "$_id",
                                    "nama_file": { $ifNull: ["$nama_file", ""] },
                                    "tautan_file": { "$concat": ["https://karboe.tech", "$tautan_file"] },
                                    "invoice_no": { $ifNull: ["$invoice_no", ""] },
                                    "doc_ref": { $ifNull: ["$doc_ref", ""] },
                                    "doc_status": { $ifNull: ["$doc_status", ""] },
                                    "urut": { $ifNull: ["$urut", ""] },
                                    "warehouse_id": { $ifNull: ["$warehouse_id", ""] },
                                    "warehouse_name": { $ifNull: ["$warehouse_name", ""] },
                                    "customer_id": { $ifNull: ["$customer_id", ""] },
                                    "customer_name": { $ifNull: ["$customer_name", ""] },
                                    "keterangan": { $ifNull: ["$keterangan", ""] },
                                    "penerima": { $ifNull: ["$penerima", ""] },
                                    "alamat": { $ifNull: ["$customer.address", "$alamat", ""] },
                                    "total": "$total",
                                    "total_invoice": "$total",
                                    "price": { $ifNull: ["$price", 0] },
                                    "total_bayar": { $ifNull: ["$price", 0] },
                                    "invoice_status": { $cond: { if: { $eq: ["$invoice_status", "Closed"] }, then: "Paid", else: "$invoice_status" } },
                                    "invoice_type": { $ifNull: ["$invoice_type", ""] },
                                    "payment_type": { $ifNull: ["$payment_type", ""] },
                                    "input_time": "$input_time",
                                    "edit_time": "$edit_time",
                                    "createdAt": "$createdAt",
                                    "updatedAt": "$updatedAt",
                                    "remarks": "$remarks",
                                    "warehouse": { $ifNull: ["$warehouse", ""] },
                                    "customer": "$customer",
                                    "do_header": { $ifNull: ["$do_header", {}] },
                                    "partner": {
                                        "_id": { $ifNull: ["$partner._id", ""] },
                                        "partner_name": { $ifNull: ["$partner.partner_name", ""] },
                                        "phone": { $ifNull: ["$partner.phone", ""] },
                                        "password": { $ifNull: ["$partner.password", ""] },
                                        "partner_pic": { $ifNull: ["$partner.partner_pic", ""] },
                                        "tautan": { $ifNull: ["$partner.tautan", ""] },
                                        "url_transaction": { $ifNull: ["$partner.url_transaction", ""] },
                                        "is_active": { $ifNull: ["$partner.is_active", ""] },
                                        "createdAt": { $ifNull: ["$partner.createdAt", ""] },
                                        "updatedAt": { $ifNull: ["$partner.updatedAt", ""] },
                                        "__v": { $ifNull: ["$partner.__v", ""] }
                                    }
                                },
                            ]
                        }
                    }
                }
            );

            if (search) {

                invoice_pipeline.push({
                    $match:
                    {
                        $or: [
                            { 'partner.partner_name': { $regex: search, $options: 'i' } },
                            { 'invoice_no': { $regex: search, $options: 'i' } },
                            { 'customer_name': { $regex: search, $options: 'i' } },
                            { 'invoice_status': { $regex: search, $options: 'i' } },
                        ]
                    },
                },
                );

                if (start_range && typeof start_range === "number") invoice_pipeline.push({ "$skip": start_range });
                if (!search && end_range) invoice_pipeline.push({ "$limit": limit_result });

                invoice_pipeline.push({ "$limit": limit_result });
                invoice_total_search_data.push(

                    {
                        $graphLookup: {
                            from: 'trn_do_01',
                            startWith: '$doc_ref',
                            connectFromField: 'do_no',
                            connectToField: 'do_no',
                            as: 'do_header'
                        }
                    },
                    {
                        $unwind: {
                            path: '$do_header',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $graphLookup: {
                            from: 'mst_partner',
                            startWith: '$do_header.partner_id',
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
                )
                invoice_total_search_data.push({
                    $match:
                    {
                        $or: [
                            { 'partner.partner_name': { $regex: search, $options: 'i' } },
                            { 'invoice_no': { $regex: search, $options: 'i' } },
                            { 'customer_name': { $regex: search, $options: 'i' } },
                            { 'invoice_status': { $regex: search, $options: 'i' } },
                        ]
                    },
                })

                invoice_total_search_data.push({
                    $group: {
                        _id: null, // Group all documents into a single group (null)
                        count: { $sum: 1 } // Use $sum to count the number of documents in each group
                    }
                });




                let count_invoice_data = await Invoice.aggregate([invoice_pipeline]);
                const total_count_invoice = await Invoice.aggregate([invoice_total_search_data]);

                const partners = await MstPartner.find({ partner_name: { $regex: search, $options: 'i' } });
                let partner_ids = [];
                for (const partner of partners) {
                    partner_ids.push(partner._id)
                }
                const total_count_invoice2 = await Invoice.countDocuments({
                    $or: [
                        // {'partner.partner_name': { $regex: search, $options: 'i' }},
                        {
                            partner_id: {
                                $in: partner_ids
                            }
                        },
                        { 'invoice_no': { $regex: search, $options: 'i' } },
                        { 'customer_name': { $regex: search, $options: 'i' } },
                        { 'invoice_status': { $regex: search, $options: 'i' } },
                    ]
                });
                if (count_invoice_data.length > 0) {
                    return res.json({
                        status: 'Success',
                        message: 'success mendapatkan data invoice',
                        start_data: start_range,
                        end_data: end_range,
                        total_count: total_count_invoice[0].count,
                        count: count_invoice_data.length,
                        total_page: Math.floor(total_count_invoice[0].count / parseInt(limit_result)),
                        page: Math.floor(parseInt(total_count_invoice[0].count) / parseInt(limit_result)),
                        data: count_invoice_data,
                        detail: []
                    })
                } else {
                    return res.json({
                        status: 'Success',
                        message: 'success mendapatkan data invoice',
                        start_data: start_range,
                        end_data: end_range,
                        total_count: 0,
                        count: 0,
                        // total_page: total_page,
                        // page: page,
                        data: [],
                        detail: []
                    })
                }
            }
            else {
                total_count_invoice = await Invoice.countDocuments({ is_active: 1 })
            }

            if (type_user === "mobile") {
                result = ["inv_on_ride"]
            } else if (type_user === "admin") {
                result = ["inv_pos", "inv_do"]
            }
            if (result) invoice_pipeline.push({ $match: { invoice_type: { $in: result } } });
            let id_array = [];
            if (isCheck === "1") {
                let body = Object.keys(req.body).length > 0
                if (!body) {
                    return res.json({
                        status: "failed",
                        message: "tidak terdapat id",
                        data: []
                    })
                }
                for (const data of req.body) {
                    id_array.push(mongoose.Types.ObjectId(data))
                }
                invoice_pipeline.push({ $match: { _id: { $in: id_array } } });
            }
            if (limit_result > 0) {
                total_page = Math.round(total_count_invoice / parseInt(limit_result));

            } else {
                total_page = Math.round(total_count_invoice);
            }

            if (start_range && typeof start_range === "number") invoice_pipeline.push({ "$skip": start_range });
            if (!search && end_range) invoice_pipeline.push({ "$limit": limit_result });

            let invoiceData = await Invoice.aggregate([invoice_pipeline]);
            if (isCheck === "1") {

                detail_invoice = await TrnInvoice02.aggregate([
                    {
                        $match: {
                            inv_id: { $in: id_array }
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
                        $sort: {
                            items_id: -1
                        }
                    }
                ]);

            }

            return res.json({
                status: 'Success',
                message: 'success mendapatkan data invoice',
                start_data: start_range,
                end_data: skip,
                total_count: total_count_invoice,
                count: invoiceData.length,
                total_page: total_page,
                data: invoiceData,
                detail: detail_invoice
            });

        } catch (err) {
            return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
        }
    }
}