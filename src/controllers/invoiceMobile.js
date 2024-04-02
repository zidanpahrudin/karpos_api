const mongoose = require('mongoose');
const id = mongoose.Types.ObjectId();
const moment = require("moment");
const path = require('path');
const fs = require("fs");
const momentTimezone = require('moment-timezone');
momentTimezone.tz('Asia/Jakarta'); // set time to lokal jakarta
const generateIsNo = require("../utils/generateIsNo");
const connectionManager = require("../middleware/db");

exports.addInvoiceMobile = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));

    const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
    const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
    const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
    const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
    const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
    const TrnRetur = require("../models/TrnRetur")(connectionManager.getConnection(connectionDB));
    const TrnReturIn = require("../models/TrnReturIn")(connectionManager.getConnection(connectionDB));
    try {

        const {
            customer_name,
            list_product,
            alamat,
            phone_number
        } = req.body;

        let date = Date.now()

        // ambil data di trn do
        let dataInvoice = JSON.parse(list_product);


        if (!dataInvoice.list_product.length > 0) {

            return res.json({

                status: "failed",

                message: "list product tidak boleh kosong ",

                data: []

            })

        }



        var utc = new Date();

        var day = moment(utc);
        var day2 = moment(utc).format("YYYY-MM-DD");
        let m = moment(utc);

        m.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });



        let doMobile = await TrnDo01.findOne({ partner_id: req.user.id, do_status: "Process", do_date: day2 }).lean();


        let doPartner = await TrnDo01.findOne({ partner_id: req.user.id, do_status: "Process", do_date: day2, is_active: 1 }).lean()
        let invCount = await Invoice.find({}).sort({ _id: -1 }).limit(1).lean()

        let inv_id = [];

        if (doPartner) {

            const invoicePipeline = { 'doc_ref': doPartner.do_no, invoice_status: { $ne: "Reject" } }

            let invHeader = await Invoice.find(invoicePipeline).lean()



            if (invHeader) {

                for await (const inv_header of invHeader) {

                    inv_id.push(inv_header._id)

                }

            }

        }

        let invoiceDetail = await TrnInvoice02.aggregate([

            {

                $match: {

                    inv_id: { $in: inv_id }

                }

            },

            {

                $group: {

                    _id: '$items_id',

                    inv_detail_id: { '$first': '$_id' },

                    totalInvoiceDetail: { '$sum': '$qty' }

                }

            },

            {

                $sort: {

                    'items_id': 1

                }

            }



        ])



        let doDetail = await TrnDo02.aggregate([

            {

                $match: {

                    do_id: doPartner._id

                }

            },

            {

                $group: {

                    _id: '$items_id',

                    do_detail_id: { '$first': '$_id' },

                    do_id: { '$first': '$do_id' },

                    do_id: { '$first': '$do_id' },

                    items_id: { '$first': '$items_id' },

                    items_name: { '$first': '$items_name' },

                    price: { '$first': '$price' },

                    total: { '$first': '$total' },

                    totalInvoiceDetail: { '$sum': '$qty' }

                }

            },

            {

                $sort: {

                    'items_id': 1

                }

            }



        ])



        let resultSisaItems = [];

        let items_selisih = [];

        for (const inv_detail of invoiceDetail) {

            for (const do_detail of doDetail) {

                if (inv_detail._id.toString() === do_detail._id.toString()) {



                    let retur_out_stock = await TrnRetur.findOne({ partner_id: req.user.id, items_id: do_detail.items_id, do_id_ref: doPartner._id }).lean()

                    let retur_in_stock = await TrnReturIn.findOne({ partner_id: req.user.id, items_id: do_detail.items_id, do_id_ref: doPartner._id }).lean()

                    let stock_retur = 0;

                    if (retur_out_stock && retur_out_stock) {

                        stock_retur = retur_in_stock.qty - retur_out_stock.qty;

                    }

                    const objDetail = {};



                    objDetail.sisa = do_detail.totalInvoiceDetail - inv_detail.totalInvoiceDetail - stock_retur;

                    objDetail.items_id = inv_detail._id

                    resultSisaItems.push(objDetail)



                    items_selisih.push(inv_detail._id)

                }

            }

        }



        let doDetail_sisa = await TrnDo02.aggregate([

            {

                $match: {

                    do_id: doMobile._id,

                    items_id: { $nin: items_selisih }

                }

            },

            {

                $group: {

                    _id: '$items_id',

                    do_detail_id: { '$first': '$_id' },

                    do_id: { '$first': '$do_id' },

                    do_id: { '$first': '$do_id' },

                    items_id: { '$first': '$items_id' },

                    items_name: { '$first': '$items_name' },

                    price: { '$first': '$price' },

                    total: { '$first': '$total' },

                    remarks: { '$first': '$remarks' },

                    createdAt: { '$first': '$createdAt' },

                    updatedAt: { '$first': '$updatedAt' },

                    warehouse_id: { '$first': '$warehouse_id' },

                    warehouse_name: { '$first': '$warehouse_name' },



                    totalInvoiceDetail: { '$sum': '$qty' }

                }

            },

            {

                $sort: {

                    'items_id': 1

                }

            }



        ]);



        if (doDetail_sisa) {

            for await (const doDetail of doDetail_sisa) {

                const objDetail = {};

                objDetail.sisa = doDetail.totalInvoiceDetail;

                objDetail.items_id = doDetail.items_id

                resultSisaItems.push(objDetail)

            }

        }


        if (!doMobile) {



            return res.json({



                status: "failed",



                message: "tidak terdapat delivery order",



                data: []



            })



        }


        if (!doMobile) {

            return res.json({

                status: "failed",

                message: "tidak terdapat delivery order",

                data: []

            })

        }



        if (!customer_name) {

            return res.json({

                status: "failed",

                message: "nama harus di isi",

                data: []

            })

        }

        let count_invoice = 0;
        if (invCount.length > 0) count_invoice = invCount[0].count;

        

        // save header start
        let newInvoice = new Invoice({
            doc_ref: doMobile.do_no,
            doc_status: "new",
            customer_id: id,
            customer_name: customer_name,
            alamat: alamat,
            total: 0,
            remarks: `pesanan dari customer ${customer_name}`,
            invoice_status: "Process",
            invoice_type: "inv_on_ride",
            is_active: 1,
            pic_input: req.user.id,
            input_time: date,
        });
        let newInvoiceMobile = await newInvoice.save()
        // save header end

        // ini id invoice
        const id_inv = newInvoiceMobile._id;
        const no_inv = newInvoiceMobile.invoice_no;


        let template_wa = `
            invoice ${no_inv}
            nama customer: ${customer_name}
            total invoice: ${total}
            jumlah bayar: ${a}

            berikut link pdf invoice: https://karbo.tech/invoice/view/${id_inv}
        `;

        let totalInvoice = 0;


        let list_items_memenuhi = [];

        let statusCreateInvoice = true;

        const inserInvoiceDetail = dataInvoice.list_product.map(async (item) => {
            let do_detail = await TrnDo02.findOne({ do_id: doMobile._id, items_id: item.itemsId }).lean();
            if (!do_detail) {
                statusCreateInvoice = false
            }
            for (const resultSisaItem of resultSisaItems) {

                if (item.itemsId.toString() === resultSisaItem.items_id.toString()) {



                    let price_item = parseInt(item.price);


                    let qty_item = parseInt(item.qty);

                    let sisa_item = parseInt(resultSisaItem.sisa);

                    let subtotal = 0;



                    if (price_item && qty_item && sisa_item) {

                        subtotal = price_item * qty_item;



                        let sisaStock = sisa_item - qty_item;

                        if (sisaStock < 0) {

                            statusCreateInvoice = false

                        }

                    }
                    else {

                        statusCreateInvoice = false

                    }

                    let items = await MstItems.findById(item.itemsId).lean()



                    const itemsInvoice = {};

                    itemsInvoice.items_id = item.itemsId;

                    itemsInvoice.price = price_item,

                        itemsInvoice.qty = qty_item,

                        itemsInvoice.subtotal = subtotal;

                    itemsInvoice.gallon_qty = item.gallon_qty;

                    if (items.replace_id) {

                        itemsInvoice.items_replace_id = items.replace_id,

                            itemsInvoice.qty_barang_terima = item.gallon_qty,

                            itemsInvoice.qty_barang_invoice = qty_item,

                            itemsInvoice.remarks = item.remarks

                    }

                    totalInvoice += itemsInvoice.subtotal

                    list_items_memenuhi.push(itemsInvoice)

                }

            }
            return statusCreateInvoice
        });

        let resultPromise = await Promise.allSettled(inserInvoiceDetail);
        if (statusCreateInvoice === false) {



            await Invoice.findOneAndRemove({ _id: newInvoiceMobile._id })



            return res.json({

                status: "failed",

                message: "gagal menambahkan invoice",

                data: []

            })

        }
        else {



            for await (const list_items of list_items_memenuhi) {

                let detailInvoice = new TrnInvoice02({

                    inv_id: newInvoiceMobile._id,

                    items_id: list_items.items_id,

                    price: parseInt(list_items.price),

                    qty: list_items.qty,

                    subtotal: parseInt(list_items.subtotal)

                });
                await detailInvoice.save();

                if (list_items.items_replace_id && list_items.items_replace_id !== "") {

                    const debtItems_date = Date.now()

                    let items = await MstItems.findById(list_items.items_replace_id).lean()

                    
                    if(items) {
                    let newTrnDebtItems = new TrnDebtItems({


                        inv_no: newInvoiceMobile.invoice_no,

                        partner_id: req.user.id,

                        items_id: list_items.items_replace_id,

                        qty_barang_terima: list_items.qty_barang_terima,

                        qty_barang_invoice: list_items.qty_barang_invoice,

                        status: "Process",

                        remarks: "",

                    })



                    await newTrnDebtItems.save()
                        
                    }




                }

            }





            await Invoice.findOneAndUpdate(newInvoiceMobile._id,



                                           {



                                               $set: {



                                                   total: totalInvoice



                                               }



                                           },

                                           { new: true }

                                           )



            return res.json({

                status: "success",

                message: "berhasil menambahkan invoice",

                data: []

            })

        }

    } catch (err) {

        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })

    }

}

exports.addInvoiceMobileOfflineV2 = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));

    const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
    const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
    const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
    const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
    const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
    try {

        const {

            list_product,

        } = req.body;

        let date = Date.now()

        // ambil data di trn do

        let dataInvoice = JSON.parse(list_product);



        if (!dataInvoice.length > 0) {

            return res.json({

                status: "failed",

                message: "list product tidak boleh kosong ",

                data: []

            })

        }



        var utc = new Date();

        var day = moment(utc);

        let m = moment(utc);

        m.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });



        let doMobile = await TrnDo01.findOne({ partner_id: req.user.id, do_status: "Process", do_date: { $lte: day, $gte: m } }).lean();



        let doPartner = await TrnDo01.findOne({ partner_id: req.user.id, do_status: "Process", do_date: { $gte: m, $lte: day }, is_active: 1 }).lean()

        let invCount = await Invoice.find({}).sort({ _id: -1 }).limit(1).lean()

        let inv_id = [];

        if (doPartner) {

            const invoicePipeline = { 'doc_ref': doPartner.do_no, invoice_status: { $ne: "Reject" } }

            let invHeader = await Invoice.find(invoicePipeline).lean()



            if (invHeader) {

                for await (const inv_header of invHeader) {

                    inv_id.push(inv_header._id)

                }

            }

        }



        let invoiceDetail = await TrnInvoice02.aggregate([

            {

                $match: {

                    inv_id: { $in: inv_id }

                }

            },

            {

                $group: {

                    _id: '$items_id',

                    inv_detail_id: { '$first': '$_id' },

                    totalInvoiceDetail: { '$sum': '$qty' }

                }

            },

            {

                $sort: {

                    'items_id': 1

                }

            }



        ])



        let doDetail = await TrnDo02.aggregate([

            {

                $match: {

                    do_id: doPartner._id

                }

            },

            {

                $group: {

                    _id: '$items_id',

                    do_detail_id: { '$first': '$_id' },

                    do_id: { '$first': '$do_id' },

                    do_id: { '$first': '$do_id' },

                    items_id: { '$first': '$items_id' },

                    items_name: { '$first': '$items_name' },

                    price: { '$first': '$price' },

                    total: { '$first': '$total' },

                    totalInvoiceDetail: { '$sum': '$qty' }

                }

            },

            {

                $sort: {

                    'items_id': 1

                }

            }



        ])



        let resultSisaItems = [];

        let items_selisih = [];

        for (const inv_detail of invoiceDetail) {

            for (const do_detail of doDetail) {

                if (inv_detail._id.toString() === do_detail._id.toString()) {



                    let retur_out_stock = await TrnRetur.findOne({ partner_id: req.user.id, items_id: do_detail.items_id, do_id_ref: doPartner._id }).lean()

                    let retur_in_stock = await TrnReturIn.findOne({ partner_id: req.user.id, items_id: do_detail.items_id, do_id_ref: doPartner._id }).lean()

                    let stock_retur = 0;

                    if (retur_out_stock && retur_out_stock) {

                        stock_retur = retur_in_stock.qty - retur_out_stock.qty;

                    }

                    const objDetail = {};



                    objDetail.sisa = do_detail.totalInvoiceDetail - inv_detail.totalInvoiceDetail - stock_retur;

                    objDetail.items_id = inv_detail._id

                    resultSisaItems.push(objDetail)



                    items_selisih.push(inv_detail._id)

                }

            }

        }



        let doDetail_sisa = await TrnDo02.aggregate([

            {

                $match: {

                    do_id: doMobile._id,

                    items_id: { $nin: items_selisih }

                }

            },

            {

                $group: {

                    _id: '$items_id',

                    do_detail_id: { '$first': '$_id' },

                    do_id: { '$first': '$do_id' },

                    do_id: { '$first': '$do_id' },

                    items_id: { '$first': '$items_id' },

                    items_name: { '$first': '$items_name' },

                    price: { '$first': '$price' },

                    total: { '$first': '$total' },

                    remarks: { '$first': '$remarks' },

                    createdAt: { '$first': '$createdAt' },

                    updatedAt: { '$first': '$updatedAt' },

                    warehouse_id: { '$first': '$warehouse_id' },

                    warehouse_name: { '$first': '$warehouse_name' },



                    totalInvoiceDetail: { '$sum': '$qty' }

                }

            },

            {

                $sort: {

                    'items_id': 1

                }

            }



        ]);



        if (doDetail_sisa) {

            for await (const doDetail of doDetail_sisa) {

                const objDetail = {};

                objDetail.sisa = doDetail.totalInvoiceDetail;

                objDetail.items_id = doDetail.items_id

                resultSisaItems.push(objDetail)

            }

        }





        if (!doMobile) {



            return res.json({



                status: "failed",



                message: "tidak terdapat delivery order",



                data: []



            })



        }



        // let warehouse = await Warehouse.findById(invoice.warehouse_id).lean();





        if (!doMobile) {

            return res.json({

                status: "failed",

                message: "tidak terdapat delivery order",

                data: []

            })

        }







        let totalInvoice = 0;







        let newInvoiceMobile;

        let list_items_memenuhi = [];

        let statusCreateInvoice = true;

        const inserInvoiceDetail = dataInvoice.map(async (data_invoice_offline) => {

            let newInvoice = new Invoice({

                invoice_no: await generateIsNo("invoice", 'inv_on_ride', date),

                doc_ref: doMobile.do_no,

                doc_status: "new",

                // warehouse_id: warehouse._id,

                // warehouse_name: warehouse.warehouse_name,

                customer_id: id,

                customer_name: data_invoice_offline.data_json.customer,

                alamat: data_invoice_offline.data_json.address,

                // disc_value: "",

                total: 0,

                remarks: `pesanan dari customer ${data_invoice_offline.data_json.customer}`,

                invoice_status: "Process",

                invoice_type: "inv_on_ride",

                is_active: 1,

                pic_input: req.user.id,

                input_time: date,

                count: invCount[0].count + 1

            });

            const itemsInvoice = {};



            newInvoiceMobile = await newInvoice.save();

            itemsInvoice._id = newInvoiceMobile._id;

            for await (const item of data_invoice_offline.data_json.inv_json) {

                if (item) {

                    let do_detail = await TrnDo02.findOne({ do_id: doMobile._id, items_id: item.itemsId }).lean();



                    if (!do_detail) {

                        statusCreateInvoice = false

                    }

                    for (const resultSisaItem of resultSisaItems) {

                        if (item.itemsId.toString() === resultSisaItem.items_id.toString()) {



                            let price_item = parseInt(item.price);

                            let qty_item = parseInt(item.qty);

                            let sisa_item = parseInt(resultSisaItem.sisa);

                            let subtotal = 0;

                            if (price_item && qty_item && sisa_item) {

                                subtotal = price_item * qty_item;



                                let sisaStock = sisa_item - qty_item;



                                if (sisaStock < 0) {

                                    statusCreateInvoice = false

                                }

                            } else {

                                statusCreateInvoice = false

                            }

                            let items = await MstItems.findById(item.itemsId).lean()







                            itemsInvoice.items_id = item.itemsId;

                            itemsInvoice.price = price_item,

                                itemsInvoice.qty = qty_item,

                                itemsInvoice.subtotal = subtotal;

                            itemsInvoice.gallon_qty = item.gallon_qty;

                            if (items.replace_id) {

                                itemsInvoice.items_replace_id = items.replace_id,

                                    itemsInvoice.qty_barang_terima = item.gallon_qty,

                                    itemsInvoice.qty_barang_invoice = qty_item,

                                    itemsInvoice.remarks = item.remarks

                            }

                            totalInvoice += itemsInvoice.subtotal

                            list_items_memenuhi.push(itemsInvoice)

                        }

                    }



                    return statusCreateInvoice

                }

            }





        });



        let resultPromise = await Promise.allSettled(inserInvoiceDetail);

        if (statusCreateInvoice === false) {

            for await (const list_items of list_items_memenuhi) {

                await Invoice.findOneAndRemove({ _id: list_items._id })

            }



            return res.json({

                status: "failed",

                message: "gagal menambahkan invoice",

                data: []

            })

        } else {



            for await (const list_items of list_items_memenuhi) {


                let detailInvoice = new TrnInvoice02({

                    inv_id: list_items._id,

                    items_id: list_items.items_id,

                    price: parseInt(list_items.price),

                    qty: list_items.qty,

                    subtotal: parseInt(list_items.subtotal)

                });



                await detailInvoice.save();



                if (list_items.items_replace_id) {

                    const debtItems_date = Date.now()

                    let items = await MstItems.findById(list_items.items_replace_id).lean()



                    let newTrnDebtItems = new TrnDebtItems({

                        debtItems_no: await generateIsNo("debtItems", "debtItems", debtItems_date),

                        inv_no: newInvoiceMobile.invoice_no,

                        partner_id: req.user.id,

                        items_id: list_items.items_replace_id,

                        qty_barang_terima: list_items.qty_barang_terima,

                        qty_barang_invoice: list_items.qty_barang_invoice,

                        status: "Process",

                        remarks: "",

                    })



                    await newTrnDebtItems.save()



                }

            }





            await Invoice.findOneAndUpdate(newInvoiceMobile._id,



                {



                    $set: {



                        total: totalInvoice



                    }



                },

                { new: true }

            )



            return res.json({

                status: "success",

                message: "berhasil menambahkan invoice",

                data: []

            })

        }





    } catch (err) {

        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })

    }

};

exports.addInvoiceMobileOfflineV3 = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));

    const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
    const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
    const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
    const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
    try {

        const {

            header,

            detail

        } = req.body;

        const user_id = req.user.id;

        const date = Date.now();

        let is_data_valid = true;



        const utc = new Date();

        const day = moment(utc);

        const set_to_0 = moment(utc).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });



        const delivery_order_partner_pipeline_search = {};

        delivery_order_partner_pipeline_search.partner_id = user_id;

        delivery_order_partner_pipeline_search.do_status = "Process";

        delivery_order_partner_pipeline_search.do_date = { $lte: day, $gte: set_to_0 };



        let delivery_order_partner = await TrnDo01.findOne(delivery_order_partner_pipeline_search).lean();

        let data_header = JSON.parse(header);

        let data_detail = JSON.parse(detail);

        if (delivery_order_partner) {

            for (const header_item of data_header) {

                const invoice_field = {};

                const mongo_user_id = mongoose.Types.ObjectId();

                let invCount = await Invoice.find({}).sort({ _id: -1 }).limit(1).lean();

                let count = 1;



                invoice_field.invoice_no = await generateIsNo("invoice", 'inv_on_ride', date),

                    invoice_field.doc_ref = delivery_order_partner.do_no,

                    invoice_field.doc_status = "new",

                    invoice_field.urut = count + 1,

                    invoice_field.customer_id = mongo_user_id,

                    invoice_field.customer_name = header_item.customer,

                    invoice_field.alamat = header_item.address,

                    invoice_field.total = 0,

                    invoice_field.remarks = `pesanan dari customer ${header_item.customer}`,

                    invoice_field.invoice_status = "Process",

                    invoice_field.invoice_type = "inv_on_ride",

                    invoice_field.is_active = 1,

                    invoice_field.count = invCount[0].count + 1,

                    invoice_field.pic_input = user_id,

                    invoice_field.input_time = date



                let new_invoice = new Invoice(invoice_field);



                let insert_invoice = await new_invoice.save();



                let invoice_header = await TrnInvoice01.findOne(

                    { doc_ref: delivery_order_partner.do_no }

                ).lean();



                for await (const detail_items of data_detail) {

                    let delivery_order_detail = await TrnDo02.find(

                        { do_id: delivery_order_partner._id, items_id: detail_items.items_id }

                    ).lean();

                    let invoice_detail = await TrnInvoice02.find(

                        { inv_id: invoice_header._id, items_id: detail_items.items_id }

                    ).lean();

                    if (delivery_order_detail.length > 0 && invoice_detail.length > 0) {

                        let i = 0;

                        while (i < delivery_order_detail.length) {

                            let j = 0;

                            while (j < invoice_detail.length) {

                                let sisa_qty = delivery_order_detail[i].qty - invoice_detail[j].qty;

                                if (sisa_qty < detail_items.qty) {

                                    is_data_valid = false;

                                    break;

                                }

                            }



                        }



                    }



                }



                return res.json({

                    status: 'success',

                    message: 'invoice berhasil di simpan',

                    data: []

                })

            }

        } else {

            return res.json({

                status: 'failed',

                message: 'delivery order tidak di temukan',

                data: []

            })

        }


    } catch (err) {

        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })

    }

}

exports.addInvoiceMobileOfflineV4 = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;

    const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
    const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
    const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
    const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
    const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
    const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
    const TrnRetur = require("../models/TrnRetur")(connectionManager.getConnection(connectionDB));
    const TrnReturIn = require("../models/TrnReturIn")(connectionManager.getConnection(connectionDB));
        const {
            header,
            detail
        } = req.body;
        const user_id = req.user.id;
        const date = Date.now();
        let is_data_valid = true;
        const utc = new Date();
        const day = moment(utc);
        const set_to_0 = moment(utc).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

        const delivery_order_partner_pipeline_search = {};
        delivery_order_partner_pipeline_search.partner_id = user_id;
        delivery_order_partner_pipeline_search.do_status = "Process";
        delivery_order_partner_pipeline_search.do_date = { $lte: day, $gte: set_to_0 };

        let delivery_order_partner = await TrnDo01.findOne(delivery_order_partner_pipeline_search).lean();
        let data_header = JSON.parse(header);
        let data_detail = JSON.parse(detail);
        if (delivery_order_partner) {
            let m = moment(utc).format("YYYY-MM-DD");

            let doMobile = await TrnDo01.findOne({ partner_id: req.user.id, do_status: "Process", do_date: m }).lean();

            let doPartner = await TrnDo01.findOne({ partner_id: req.user.id, do_status: "Process", do_date: { $gte: m, $lte: day }, is_active: 1 }).lean()
            
            let inv_id = [];
            if (doPartner) {
                const invoicePipeline = { 'doc_ref': doPartner.do_no, invoice_status: { $ne: "Reject" } }
                let invHeader = await TrnInvoice01.find(invoicePipeline).lean()

                if (invHeader) {
                    for await (const inv_header of invHeader) {
                        inv_id.push(inv_header._id)
                    }
                }
            }

            let invoiceDetail = await TrnInvoice02.aggregate([
                {
                    $match: {
                        inv_id: { $in: inv_id }
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        inv_detail_id: { '$first': '$_id' },
                        totalInvoiceDetail: { '$sum': '$qty' }
                    }
                },
                {
                    $sort: {
                        'items_id': 1
                    }
                }

            ])

            let doDetail = await TrnDo02.aggregate([
                {
                    $match: {
                        do_id: doPartner._id
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        do_detail_id: { '$first': '$_id' },
                        do_id: { '$first': '$do_id' },
                        do_id: { '$first': '$do_id' },
                        items_id: { '$first': '$items_id' },
                        items_name: { '$first': '$items_name' },
                        price: { '$first': '$price' },
                        total: { '$first': '$total' },
                        totalInvoiceDetail: { '$sum': '$qty' }
                    }
                },
                {
                    $sort: {
                        'items_id': 1
                    }
                }

            ])

            let resultSisaItems = [];
            let items_selisih = [];
            for (const inv_detail of invoiceDetail) {
                for (const do_detail of doDetail) {
                    if (inv_detail._id.toString() === do_detail._id.toString()) {

                        let retur_out_stock = await TrnRetur.findOne({ partner_id: req.user.id, items_id: do_detail.items_id, do_id_ref: doPartner._id }).lean()
                        let retur_in_stock = await TrnReturIn.findOne({ partner_id: req.user.id, items_id: do_detail.items_id, do_id_ref: doPartner._id }).lean()
                        let stock_retur = 0;
                        if (retur_out_stock && retur_out_stock) {
                            stock_retur = retur_in_stock.qty - retur_out_stock.qty;
                        }
                        const objDetail = {};

                        objDetail.sisa = do_detail.totalInvoiceDetail - inv_detail.totalInvoiceDetail - stock_retur;
                        objDetail.items_id = inv_detail._id
                        resultSisaItems.push(objDetail)
                        items_selisih.push(inv_detail._id)
                    }
                }
            }




            let doDetail_sisa = await TrnDo02.aggregate([
                {
                    $match: {
                        do_id: doMobile._id,
                        items_id: { $nin: items_selisih }
                    }
                },
                {
                    $group: {
                        _id: '$items_id',
                        do_detail_id: { '$first': '$_id' },
                        do_id: { '$first': '$do_id' },
                        do_id: { '$first': '$do_id' },
                        items_id: { '$first': '$items_id' },
                        items_name: { '$first': '$items_name' },
                        price: { '$first': '$price' },
                        total: { '$first': '$total' },
                        remarks: { '$first': '$remarks' },
                        createdAt: { '$first': '$createdAt' },
                        updatedAt: { '$first': '$updatedAt' },
                        warehouse_id: { '$first': '$warehouse_id' },
                        warehouse_name: { '$first': '$warehouse_name' },

                        totalInvoiceDetail: { '$sum': '$qty' }
                    }
                },
                {
                    $sort: {
                        'items_id': 1
                    }
                }

            ]);


            if (doDetail_sisa) {
                for await (const doDetail of doDetail_sisa) {
                    const objDetail = {};
                    objDetail.sisa = doDetail.totalInvoiceDetail;
                    objDetail.items_id = doDetail.items_id
                    resultSisaItems.push(objDetail)
                }
            }


            if (!doMobile) {

                return res.json({

                    status: "failed",

                    message: "tidak terdapat delivery order",

                    data: []

                })

            }

            if (!doMobile) {
                return res.json({
                    status: "failed",
                    message: "tidak terdapat delivery order",
                    data: []
                })
            }






            let list_items_memenuhi = [];

            for (const header_item of data_header) {
                const invoice_field = {};
                let totalInvoice = 0;
                const mongo_user_id = mongoose.Types.ObjectId();
                let invCount = await TrnInvoice01.find({}).sort({ _id: -1 }).limit(1).lean();
                let count = 1;

                // invoice_field.invoice_no = await generateIsNo("invoice", 'inv_on_ride', date),
                    invoice_field.doc_ref = delivery_order_partner.do_no,
                    invoice_field.doc_status = "new",
                    invoice_field.urut = count + 1,
                    invoice_field.customer_id = mongo_user_id,
                    invoice_field.customer_name = header_item.customer,
                    invoice_field.alamat = header_item.address,
                    invoice_field.total = 0,
                    invoice_field.remarks = `pesanan dari customer ${header_item.customer}`,
                    invoice_field.invoice_status = "Process",
                    invoice_field.invoice_type = "inv_on_ride",
                    invoice_field.is_active = 1,
                    invoice_field.count = invCount[0].count + 1,
                    invoice_field.pic_input = user_id,
                    invoice_field.input_time = date

                let new_invoice = new TrnInvoice01(invoice_field);

                let insert_invoice = await new_invoice.save();

                if (insert_invoice) {
                    let statusCreateInvoice = true;
                    const inserInvoiceDetail = data_detail.map(async (data_invoice_offline) => {
                        for (const resultSisaItem of resultSisaItems) {

                            if (data_invoice_offline.items_id.toString() === resultSisaItem.items_id.toString()) {
                                const itemsInvoice = {};
                                let price_item = parseInt(data_invoice_offline.price);
                                let qty_item = parseInt(data_invoice_offline.qty);
                                let sisa_item = parseInt(resultSisaItem.sisa);
                                let subtotal = 0;
                                if (price_item && qty_item && sisa_item) {
                                    subtotal = price_item * qty_item;

                                    let sisaStock = sisa_item - qty_item;
                                    if (sisaStock < 0) {
                                        statusCreateInvoice = false
                                    }
                                } else {
                                    statusCreateInvoice = false
                                }
                                let items = await MstItems.findById(data_invoice_offline.items_id).lean()



                                itemsInvoice.items_id = data_invoice_offline.items_id;
                                itemsInvoice.price = price_item,
                                    itemsInvoice.qty = qty_item,
                                    itemsInvoice.subtotal = subtotal;
                                itemsInvoice.gallon_qty = data_invoice_offline.gallon_qty;
                                if (items.replace_id) {
                                    itemsInvoice.items_replace_id = items.replace_id,
                                        itemsInvoice.qty_barang_terima = data_invoice_offline.gallon_qty,
                                        itemsInvoice.qty_barang_invoice = qty_item,
                                        itemsInvoice.remarks = data_invoice_offline.remarks
                                }
                                totalInvoice += subtotal
                                list_items_memenuhi.push(itemsInvoice)
                            }
                        }

                        return statusCreateInvoice

                    });
                    let is_data_valid = await Promise.allSettled(inserInvoiceDetail);
                    if (is_data_valid[0].value === false) {
                        await TrnInvoice01.findOneAndRemove({ _id: insert_invoice._id })

                        return res.json({
                            status: "failed",
                            message: "gagal menambahkan invoice",
                            data: []
                        })
                    } else {
                        for await (const list_items of list_items_memenuhi) {
                            let detailInvoice = new TrnInvoice02({
                                inv_id: insert_invoice._id,
                                items_id: list_items.items_id,
                                price: parseInt(list_items.price),
                                qty: parseInt(list_items.qty),
                                subtotal: parseInt(list_items.subtotal)
                            });

                            await detailInvoice.save();

                            if (list_items.items_replace_id) {
                                const debtItems_date = Date.now()
                                let items = await MstItems.findById(list_items.items_replace_id).lean()

                                let newTrnDebtItems = new TrnDebtItems({
                                    debtItems_no: await generateIsNo("debtItems", "debtItems", debtItems_date),
                                    inv_no: insert_invoice.invoice_no,
                                    partner_id: req.user.id,
                                    items_id: list_items.items_replace_id,
                                    qty_barang_terima: list_items.qty_barang_terima,
                                    qty_barang_invoice: list_items.qty_barang_invoice,
                                    status: "Process",
                                    remarks: "",
                                })

                                await newTrnDebtItems.save()

                            }
                        }


                        await TrnInvoice01.findOneAndUpdate(insert_invoice._id,

                            {

                                $set: {

                                    total: totalInvoice

                                }

                            },
                            { new: true }
                        )

                    }

                }


            }
            return res.json({
                status: "success",
                message: "berhasil menambahkan invoice",
                data: []
            })



        } else {
            return res.json({
                status: 'failed',
                message: 'delivery order tidak di temukan',
                data: []
            })
        }


    } catch (err) {
        return res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}

exports.getInvoiceMobile = async (req, res) => {

    try {
        const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));

    const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
    const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
    const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
    const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
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

                    objResult.urut = inv_header.urut,

                    objResult.invoice_no = inv_header.invoice_no,

                    objResult.doc_ref = inv_header.doc_ref,

                    objResult.customer_id = inv_header.customer_id,

                    objResult.customer_name = inv_header.customer_name,

                    objResult.remarks = inv_header.remarks,

                    objResult.invoice_status = inv_header.invoice_status,

                    objResult.grand_total = `${inv_header.total}.0`,

                    objResult.warehouse_name = inv_header.warehouse_name,

                    objResult.warehouse_id = inv_header.warehouse_id,

                    objResult.invoice_type = inv_header.invoice_type,

                    objResult.is_active = inv_header.is_active,

                    objResult.pic_input = inv_header.pic_input,

                    objResult.input_time = inv_header.input_time,

                    objResult.edit_time = inv_header.edit_time,

                    objResult.createdAt = inv_header.createdAt,

                    objResult.updatedAt = inv_header.updatedAt,



                    resultArr.push(objResult)



                let detailInvoice = await TrnInvoice02.find({ inv_id: inv_header._id }).lean();

                let resultDetail = [];

                for (const detailInv of detailInvoice) {

                    let items = await MstItems.findById(detailInv.items_id).lean()

                    let doPartnerDetail = await TrnDo02.findOne({ do_id: doPartner._id, items_id: detailInv.items_id }).lean()

                    let objDetail = {};

                    objDetail._id = items._id;

                    objDetail.items_code = items.items_code;

                    objDetail.items_name = items.items_name;

                    objDetail.items_name = items.items_name;

                    objDetail.qty = detailInv.qty;



                    let total = 0;



                    objDetail.price = `${detailInv.price}.0`;

                    objDetail.subtotal = `${detailInv.subtotal}.0`;

                    // if(doPartnerDetail) {

                    //     objDetail.sisa_stock = doPartnerDetail.qty - detailInv.qty;

                    // }





                    total += detailInv.subtotal



                    // resultDetail += JSON.stringify(objDetail)

                    resultDetail.push(objDetail)



                }
                objResult.detail_invoice = resultDetail



                objResult.nilai_bayar = inv_header.price

                objResult.sum_total_invoice = total





            }



            res.json({

                status: "success",

                message: "berhasil mendapatkan invoice",

                do_id: doPartner._id,

                data: resultArr

            })

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

}

exports.getInvoiceMobilev2 = async (req, res) => {

    try {
        const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));

    const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
    const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
    const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
    const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
    const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
        const { date } = req.body;

        // var utc = new Date();

        var day = momentTimezone().format("YYYY-MM-DD");
        let m = momentTimezone();

        m.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

        let doPartner = await TrnDo01.findOne({ partner_id: req.user.id, do_status: "Process", do_date: { $gte: m, $lte: day }, is_active: 1 }).lean()



        let invoice = await Invoice.find({ doc_ref: doPartner.do_no, is_active: 1, invoice_status: { $ne: 'Reject' } }).lean();





        let resultArr = [];

        if (invoice) {

            let hasilAkhir = [];

            for (const inv_header of invoice) {



                let detailInvoice = await TrnInvoice02.find({ inv_id: inv_header._id }).lean();

                const objResult = {};

                let total = 0;



                for (const totalInv of detailInvoice) {

                    let items = await MstItems.findById(totalInv.items_id).lean()

                    total += totalInv.subtotal

                }

                // 



                objResult._id = inv_header._id,

                    objResult.urut = inv_header.urut,

                    objResult.invoice_no = inv_header.invoice_no,

                    objResult.doc_ref = inv_header.doc_ref,

                    objResult.customer_id = inv_header.customer_id ? inv_header.customer_id : "",

                    objResult.customer_name = inv_header.customer_name,

                    objResult.remarks = inv_header.remarks,

                    objResult.invoice_status = inv_header.invoice_status,

                    objResult.nilai_bayar = `${inv_header.price}`

                objResult.sum_total_invoice = `${total}`

                objResult.grand_total = `${inv_header.total}`,



                    resultArr.push(objResult)

                let resultDetail = [];

                for (const detailInv of detailInvoice) {

                    let items = await MstItems.findById(detailInv.items_id).lean()

                    let doPartnerDetail = await TrnDo02.findOne({ do_id: doPartner._id, items_id: detailInv.items_id }).lean()

                    let objDetail = {};

                    objDetail._id = items._id;

                    objDetail.items_code = items.items_code;

                    objDetail.items_name = items.items_name;

                    objDetail.qty = detailInv.qty;

                    // check items ada galon kosong



                    objDetail.price = `${detailInv.price}`;

                    objDetail.subtotal = `${detailInv.subtotal}`;



                    // if(doPartnerDetail) {

                    //     objDetail.sisa_stock = doPartnerDetail.qty - detailInv.qty;

                    // }



                    let gallon_qty = 0;

                    if (items.replace_id) {

                        let Trn_debt_items = await TrnDebtItems.findOne({ items_id: items.replace_id, inv_no: inv_header.invoice_no, partner_id: req.user.id }).lean()

                        if (Trn_debt_items) {

                            if (Trn_debt_items.qty_barang_terima) {

                                gallon_qty = Trn_debt_items.qty_barang_terima

                            }

                            objDetail.gallon_qty = gallon_qty

                        } else {

                            objDetail.gallon_qty = gallon_qty

                        }

                    } else {

                        objDetail.gallon_qty = gallon_qty

                    }

                    objDetail.is_container = items.replace_id ? true : false;



                    // resultDetail += JSON.stringify(objDetail)

                    resultDetail.push(objDetail)



                }

                objResult.detail_invoice = resultDetail



            }

            res.json({

                status: "success",

                message: "berhasil mendapatkan invoice",

                do_id: doPartner._id,

                data: resultArr

            })

        }





    } catch (err) {

        return res.json({ status: 'failed', message: 'server error : ' + err.message, data: [] })

    }

}

/**
 * controller mobile/invoice/payment.
 * @return {Object} - membayar invoice customer by driver
 */
exports.PaymentInvoice = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const {
            nilai_bayar,
            invoice_no,
            sign_img,
            penerima,
            keterangan
        } = req.body;
        const date = Date.now();


        let invoice = await Invoice.findOne(
            { invoice_no: invoice_no, is_active: 1 }
        ).sort({ _id: -1 }).lean();

        if (!invoice) {
            return res.json({
                status: "failed",
                message: "tidak terdapat invoice",
                data: [],
            })
        }
        const invoice_obj = {};
        invoice_obj.price = nilai_bayar;
        invoice_obj.penerima = penerima;
        invoice_obj.keterangan = keterangan;
        invoice_obj.invoice_status = "Outstanding";
        if (invoice.total <= nilai_bayar) {
            invoice_obj.invoice_status = "Closed";
        }
       
        const nama_file = date + "_" + invoice_no;

        invoice_obj.sisa_hutang = invoice.total - nilai_bayar
        const invoicePaid =  await Invoice.findOneAndUpdate(
            {
                invoice_no: invoice.invoice_no
            },
            {
                $set: invoice_obj
            },
            {
                new: true
            }
        );

        fs.writeFile(
            path.join(__dirname + "../../../" + "public/images/sign/" + nama_file + ".png"),
            sign_img,
            { encoding: 'base64' },
            async function (err) {

                if (err) {
                    return res.json({
                        status: "failed",
                        message: "tanda tangan gagal di upload",
                        data: [],
                    })
                } else {
                    const invoice_sign = {};
                    invoice_sign.nama_file = nama_file + ".png";

                    await Invoice.findOneAndUpdate(
                        {
                            invoice_no: invoice.invoice_no
                        },
                        {
                            $set: invoice_sign
                        }
                    )
                    return res.json({
                        status: "success",
                        message: "berhasil membayar invoice",
                        data: invoicePaid,
                    })
                    
                }
            }
        );

        

    } catch (err) {
        res.json({
            status: "failed",
            message: 'server error : ' + err.message,
            data: [],
        })
    }
}

exports.rejectInvoiceMobile = async (req, res) => {

    try {
        const connectionDB = req.user.database_connection;
    const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));

    const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
    const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
    const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
    const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
    const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
    const MstPartner = require("../models/MstPartner")(connectionManager.getConnection(connectionDB));
    const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
    const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB));
    const stockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
        const { id } = req.params;



        const partner = await MstPartner.findById(req.user.id).lean()

        if (!partner) {

            return res.json({

                status: 'failed',

                message: 'partner tidak di temukan',

                data: []

            })

        }



        let invoice = await Invoice.findById(id).lean();



        if (invoice) {

            let delivery_order = await TrnDo01.findOne({ do_no: invoice.doc_ref, do_status: 'Process' }).lean()



            let invoiceDetail = await TrnInvoice02.find({ inv_id: invoice._id }).lean()



            let tgl_skrng = Date.now()



            await Invoice.findOneAndUpdate(

                { _id: invoice._id },

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



                


                }

            } 
            else if (invoice.invoice_type === 'inv_on_ride') {

                let totalInvoice = 0;

                let arrayUpdate = [];

                for (const invoice_detail of invoiceDetail) {

                    const objUpdate = {};

                    const updatePipeline = { do_id: delivery_order._id, items_id: invoice_detail.items_id }

                    let delivery_order_detail = await TrnDo02.findOne(updatePipeline).lean();




                    // TrnDebtItems

                    let items = await MstItems.findById(invoice_detail.items_id).lean();
                

                    if(items.replace_id && items.replace_id.length > 0) {
                    let debt_items = await TrnDebtItems.findOne({ items_id: items.replace_id, inv_no: invoice.invoice_no }).lean()
                    if (debt_items) {

                        const debItemsPipeline = { items_id: items.replace_id, inv_no: invoice.invoice_no }

                        await TrnDebtItems.findOneAndRemove(debItemsPipeline)
                            
                        

                    }
                    }

                }

            } 
            else if (invoice.invoice_type === 'inv_do') {

                if (invoice.invoice_status === 'Process') {

                    for (const invoice_detail of invoiceDetail) {



                        const updatePipeline = { do_id: delivery_order._id, items_id: invoice_detail.items_id }

                        let delivery_order_detail = await TrnDo02.findOne(updatePipeline).lean();



                        // TrnDebtItems

                        let items = await MstItems.findById(invoice_detail.items_id).lean();
                       
                        if(items.replace_id && items.replace_id.length > 0) {
                            let debt_items = await TrnDebtItems.findOne({ items_id: items.replace_id, inv_no: invoice.invoice_no }).lean()

                        if (debt_items) {

                            const debItemsPipeline = { items_id: items.replace_id, inv_no: invoice.invoice_no }

                            await TrnDebtItems.findOneAndRemove(debItemsPipeline)

                        }    
                        }
                        

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

        return res.json({

            status: "failed",

            message: `server error cause : ${err.message}`,

            data: []

        })

    }

}


