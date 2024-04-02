const connectionManager = require("../middleware/db");
const moment = require("moment");
const escapeRegex = require("../utils/escapeRegex");
const generateIsNo = require("../utils/generateIsNo");
exports.addReturStock = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const TrnRetur = require("../models/TrnRetur")(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require('../models/TrnInvoice01')(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require('../models/TrnInvoice02')(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require('../models/TrnDo01')(connectionManager.getConnection(connectionDB));
        const TrnDo02 = require('../models/TrnDo02')(connectionManager.getConnection(connectionDB));
        const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));

        const MstCustomer = require("../models/MstCustomer")(connectionManager.getConnection(connectionDB));
        const TrnReturIn = require("../models/TrnReturIn")(connectionManager.getConnection(connectionDB));

        const { qty, remarks, invoice_no, items_id} = req.body;

        const retur_date = Date.now()


        var utc = new Date();
        var day = moment(utc);
        let m = moment(utc);
        m.set({hour:0,minute:0,second:0,millisecond:0});

        const invoice_header_pipeline = {
            invoice_no: invoice_no,
            // invoice_type: "inv_do",
        };

        let invoice_header = await TrnInvoice01.findOne(invoice_header_pipeline).lean();

        const invoice_detail_pipeline = {
            inv_id: invoice_header._id,
            items_id: items_id
        };

        let invoice_detail = await TrnInvoice02.findOne(invoice_detail_pipeline).lean();

        const delivery_order_pipeline = {
            do_no: invoice_header.doc_ref
        };
        let delivery_order = await TrnDo01.findOne(delivery_order_pipeline).lean()

        let delivery_order_ref = await TrnDo01.findOne({
            // do_date: {$lte: day, $gte: m},
            partner_id: req.user.id, 
            do_status: "Process"
        }).lean();


        let new_retur_in_stock = new TrnReturIn({
            partner_id: req.user.id,
            retur_kind: "retur_in",
            status: "Process",
            do_id: delivery_order._id,
            do_id_ref: delivery_order_ref._id,
            invoice_no: invoice_header.invoice_no,
            customer_name: invoice_header.customer_name,
            items_id: invoice_detail.items_id,
            qty: qty,
            qty_payment: invoice_detail.qty,
            remarks: remarks
        });
        
        await new_retur_in_stock.save();
        

        res.json({
            status: "success",
            message: "berhasil retur stock customer",
            data: []
        })


    } catch (err) {
        res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}

exports.outgoingReturStock = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;

        const TrnRetur = require("../models/TrnRetur")(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require('../models/TrnInvoice01')(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require('../models/TrnInvoice02')(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require('../models/TrnDo01')(connectionManager.getConnection(connectionDB));
        const TrnDo02 = require('../models/TrnDo02')(connectionManager.getConnection(connectionDB));
        const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
        const MstCustomer = require("../models/MstCustomer")(connectionManager.getConnection(connectionDB));
        const TrnReturIn = require("../models/TrnReturIn")(connectionManager.getConnection(connectionDB));

        const {return_no} = req.body;
        const retur_stock_pipeline = {
            retur_no: return_no
        }

        const retur_date = Date.now()
        
        var utc = new Date();
        var day = moment(utc);
        let m = moment(utc);
        m.set({hour:0,minute:0,second:0,millisecond:0});

        let returStock = await TrnReturIn.findOne(retur_stock_pipeline).lean();

        const delivery_order_pipeline = {
            partner_id: returStock.partner_id,
            // do_date: {$lte: day, $gte: m},
            do_status: 'Process'
        }

        let delivery_order = await TrnDo01.findOne(delivery_order_pipeline).lean()
        
        
        const delivery_order_detail_pipeline = {
            do_id: delivery_order._id,
            items_id: returStock.items_id
        }

        let delivery_order_detail = await TrnDo02.findOne(delivery_order_detail_pipeline).lean()
        const update_pipeline = {};
        if(delivery_order_detail && delivery_order_detail.qty > parseInt(returStock.qty)) {
            update_pipeline.sisa_do = delivery_order_detail.qty - parseInt(returStock.qty);
            update_pipeline.sisa_retur = 0;
        } else if(delivery_order_detail && delivery_order_detail.qty > 0) {
            update_pipeline.sisa_do = 0;
            update_pipeline.sisa_retur = parseInt(returStock.qty) - delivery_order_detail.qty;
        } else {
            return res.json({
                status: "failed",
                message: "barang tidak ditemukan",
                data: []
            })
        }


        let new_retur_stock = new TrnRetur({
            partner_id: req.user.id,
            do_id: delivery_order._id,
            do_id_ref: returStock.do_id_ref,
            invoice_no: returStock.invoice_no,
            customer_name: returStock.customer_name,
            items_id: returStock.items_id,
            qty: update_pipeline.sisa_retur,
            qty_payment: returStock.qty,
            remarks: ""
        });

        await new_retur_stock.save();

        await TrnReturIn.findOneAndUpdate({ return_no: returStock.return_no },
            {
                $set: {
                    status: "Closed"
                }
            }
        )
        
        
        // await TrnRetur.findByIdAndUpdate(returStock._id, 
        //     {
        //         qty: update_pipeline.sisa_retur
        //     }
        // )

        res.json({
            status: "success",
            message: "stock customer berhasil di retur", 
            data: []
        })
    } catch (err) {
        res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}

exports.getListReturStock = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;

        const TrnRetur = require("../models/TrnRetur")(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require('../models/TrnInvoice01')(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require('../models/TrnInvoice02')(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require('../models/TrnDo01')(connectionManager.getConnection(connectionDB));
        const TrnDo02 = require('../models/TrnDo02')(connectionManager.getConnection(connectionDB));
        const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
        const MstCustomer = require("../models/MstCustomer")(connectionManager.getConnection(connectionDB));
        const TrnReturIn = require("../models/TrnReturIn")(connectionManager.getConnection(connectionDB));
        const {nama} = req.body;
        const retur_stock_pipeline = {
            customer_name: new RegExp(escapeRegex(nama), "gi"),
            // invoice_type: "inv_do",
            doc_ref: { $exists: true, $ne: null, $ne: ""  },
            qty: {$gt: 0}
        }
        let returStock = await TrnReturIn.find(retur_stock_pipeline).lean();
        if(returStock.length < 0) {
            return res.json({
                status: "failed",
                message: "nama tidak di temukan",
                data: []
            })
        }
        
        
        let resultArr = []
        for (let i = 0; i < returStock.length; i++) {
            let delivery_order = await TrnDo01.findById(returStock[i].do_id).lean()
    
            const invoice_pipeline = {
                doc_ref: delivery_order.do_no
            }
            const invoice = await TrnInvoice01.findOne(invoice_pipeline).lean()
    
            const customer_pipeline = {
                _id: invoice.customer_id
            }
            const customer = await MstCustomer.findById(customer_pipeline).lean()
            
    
            const delivery_order_detail_pipeline = {
                do_id: returStock[i].do_id,
                items_id: returStock[i].items_id
            }
            
    
            let delivery_order_detail = await TrnDo02.findOne(delivery_order_detail_pipeline).lean()
    
            let items = await MstItems.findById(returStock[i].items_id).lean()
            const objectResult = {};
    
            objectResult.return_no = returStock[i].retur_no;
            objectResult.customer_name = returStock[i].customer_name;
            objectResult.items_id = items._id;
            objectResult.items_name = items.items_name;
            objectResult.qty = returStock[i].qty;
            objectResult.address = invoice.alamat ? invoice.alamat : customer.address;
            
            resultArr.push(objectResult)
    
    
    
            // if(delivery_order_detail && delivery_order_detail.qty > 0) {
                
            // } else {
            //     return res.json({
            //         status: "failed",
            //         message: "barang tidak ditemukan",
            //         data: []
            //     })
            // }

        }
        return res.json({
            status: "success",
            message: "barang di temukan", 
            data: resultArr
        })

        
    } catch (err) {
        res.json({ status: 'Failed', message: 'server error : ' + err.message, data: [] })
    }
}