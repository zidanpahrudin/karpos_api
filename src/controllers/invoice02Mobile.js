const connectionManager = require("../middleware/db");
const { ObjectId } = require("mongodb");
exports.updateInvoiceTwo = async (req, res) => {
    
    try {
        
        const connectionDB = req.user.database_connection;
        const Invoice = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        const TrnInvoice01 = require("../models/TrnInvoice01")(connectionManager.getConnection(connectionDB));
        
        const Invoice2 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        const TrnInvoice02 = require("../models/TrnInvoice02")(connectionManager.getConnection(connectionDB));
        
        const MstItems = require("../models/MstItems")(connectionManager.getConnection(connectionDB));
        const Stock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
        const StockHistory = require("../models/TrnStockHist")(connectionManager.getConnection(connectionDB))
        const TrnStockByDoc = require("../models/TrnStockByDoc")(connectionManager.getConnection(connectionDB));
        const Warehouse = require("../models/MstWarehouse")(connectionManager.getConnection(connectionDB));
        const Customer = require("../models/MstCustomer")(connectionManager.getConnection(connectionDB));
        const generateIsNo = require("../utils/generateIsNo")(connectionManager.getConnection(connectionDB));
        const TrnStock = require("../models/TrnStock")(connectionManager.getConnection(connectionDB));
        const TrnRetur = require("../models/TrnRetur")(connectionManager.getConnection(connectionDB));
        const TrnReturIn = require("../models/TrnReturIn")(connectionManager.getConnection(connectionDB));
        
        const TrnDo02 = require("../models/TrnDo02")(connectionManager.getConnection(connectionDB));
        const TrnDebtItems = require("../models/TrnDebtItems")(connectionManager.getConnection(connectionDB));
        const TrnDo01 = require("../models/TrnDo01")(connectionManager.getConnection(connectionDB));
        
        const {
            inv_id,
            items_id,
            do_id,
            qty,
            gallon_qty,
            remarks
        } = req.body;

        let delivery_order = await TrnDo01.findById(do_id).lean()

        let invHeader = await TrnInvoice01.find({ doc_ref: delivery_order.do_no }).lean();
        
        let inv_ids = [];
        for (const inv_header of invHeader) {
            inv_ids.push(inv_header._id)
        }

        let invoiceDetails = await TrnInvoice02.aggregate([
            {
                $match: {
                    inv_id: {$in: inv_ids}
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

        let doDetail = await TrnDo02.aggregate([
            {
                $match: {
                    do_id: delivery_order._id
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

                    totalInvoiceDetail: {'$sum': '$qty'}
                }
            },
            {
                $sort: {
                    'items_id': 1
                }
            }
                       
        ])

        let sumSisaDO = 0;
        for (const inv_detail of invoiceDetails) {
            for (const do_detail of doDetail) {
                if(inv_detail._id.toString() === do_detail._id.toString()) {

                    let retur_out_stock = await TrnRetur.findOne({ partner_id: req.user.id, items_id: do_detail.items_id, do_id_ref: delivery_order._id }).lean()
                    let retur_in_stock = await TrnReturIn.findOne({ partner_id: req.user.id, items_id: do_detail.items_id, do_id_ref: delivery_order._id }).lean()
                    let stock_retur = 0;

                    
                    if (retur_out_stock && retur_out_stock) {
                        stock_retur = retur_in_stock.qty - retur_out_stock.qty;
                    }

                    if(items_id === do_detail.items_id.toString()) {
                        sumSisaDO = do_detail.totalInvoiceDetail - inv_detail.totalInvoiceDetail - stock_retur
                    }
                    
                }
            }
        }

        
        let stockMobil = await TrnDo02.findOne({items_id: new ObjectId(items_id.trim()), do_id: new ObjectId(do_id.trim())}).lean()
        

        

        
        let stockInvoice = await Invoice2.find({ inv_id: inv_id.trim()}).lean()
        let stockInvoiceQty = await Invoice2.aggregate([
            {
                $match: {
                    inv_id: new ObjectId(inv_id.trim()), items_id: new ObjectId(items_id)
                }
            },
            {
                $group: {
                    _id: "$items_id",
                    qty_total: {
                        $sum: "$qty"
                    }
                }
            },
        ]
        )
        
        
        let InvoiceDetail = await Invoice2.findOne({ inv_id: inv_id.trim(), items_id: items_id}).lean()
     
       
        if(sumSisaDO + InvoiceDetail.qty - parseInt(qty) < 0) {
            let sisaStock = sumSisaDO
            return res.json({
                status: "failed",
                message: `stock tidak mencukupi`,
                data: sisaStock,
                data: []
            })
        }

        if(parseInt(qty) < parseInt(gallon_qty)) {
            return res.json({
                status: "failed",
                message: "quantity item yang diberikan melebihi stock invoice",
                data: []
            })
        }

        let invoiceDetail = await Invoice2.findOneAndUpdate(
            { inv_id: new ObjectId(inv_id.trim()), items_id: new ObjectId(items_id) },
            {
                $set: {
                    // status_item_debt: isItemsDebt ? "Outstanding" : "Closed",
                    // qty_item_given: qty_item_given,
                    qty: parseInt(qty),
                    subtotal: (qty * InvoiceDetail.price)
                }
            },
            { new: true }
        )

        

        let invoiceHeader = await Invoice.findById(inv_id).lean()

        // kondisi jika galon kurang
        
            let items = await MstItems.findById(items_id).lean()
            
            const debtItems_date = Date.now()
            let Trn_debt_items = await TrnDebtItems.findOne({
                inv_no: invoiceHeader.invoice_no,
                partner_id: req.user.id,
                items_id: items.replace_id
            }).lean()

            if(Trn_debt_items) {
                await TrnDebtItems.findOneAndUpdate(
                    { 
                        inv_no: invoiceHeader.invoice_no, 
                        partner_id: req.user.id, 
                        items_id: items.replace_id 
                    }, 
                    {
                        qty_barang_terima: gallon_qty,
                        qty_barang_invoice: invoiceDetail.qty,
                        remarks: remarks,
                    }
                )
            } else {
                let newDebtItems = new TrnDebtItems({ 
                        debtItems_no: await generateIsNo("debtItems", "debtItems", debtItems_date),
                        inv_no: invoiceHeader.invoice_no, 
                        partner_id: req.user.id,
                        items_id: items.replace_id,
                        qty_barang_terima: gallon_qty,
                        qty_barang_invoice: invoiceDetail.qty,
                        status: "Process",
                        remarks: remarks,
                    }, 
                )
                await newDebtItems.save()
            }

        let totalAkhir = invoiceHeader.total - InvoiceDetail.subtotal + (invoiceDetail.qty * invoiceDetail.price);
        let totalInvoice = await Invoice.findByIdAndUpdate(inv_id.trim(), 
            {
                $set: {
                    total: totalAkhir
                }
            },
            {new: true}
        )

        res.json({
            status: "success",
            message: `berhasil menambahkan qty invoice sebesar ${qty}`,
            do_id: do_id,
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
