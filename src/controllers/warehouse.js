const decryptString = require("../utils/decryptString");
const connectionManager = require("../middleware/db");

/**
 * controller /warehouse.
 * @return {Object} - mendapatkan data active warehouse
 */
exports.getWarehouse = async (req, res) => {
    const connectionDB = req.user.database_connection;
    try {
        const {
            id
        } = req.query;
        let warehouse = {};
        const Warehouse = require('../models/MstWarehouse')(connectionManager.getConnection(connectionDB));
        if (id) {
            
            warehouse = await Warehouse.findOne({ _id: id, is_active: 1 }).lean();
            if (!warehouse) {
                return res.json({
                    status: "failed",
                    message: "data warehouse tidak di temukan",
                    data: [],
                })
            }
        } else {
            warehouse = await Warehouse.find({ is_active: 1 }).sort({ createdAt: -1 }).lean();
            if (warehouse.length <= 0) {
                return res.json({
                    status: "failed",
                    message: "data warehouse tidak di temukan",
                    data: [],
                })
            }
        }


        res.json({
            status: "success",
            message: "data warehouse di temukan",
            data: warehouse,
        })

        res.json(response);

    } catch (err) {
        res.json({
            status: "failed",
            message: 'server error : ' + err.message,
            data: [],
        })
    }

};

/**
 * controller /warehouse.
 * @return {Object} - menambah warehouse
 */
exports.addWarehouse = async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Warehouse = require('../models/MstWarehouse')(connectionManager.getConnection(connectionDB));
    try {
        const {
            warehouse_name,
            warehouse_code,
            address,
            telp,
            city,
            remarks,
            pic_input,
            input_time,
            pic_edit,
            edit_time
        } = req.body;
        const warehouse_obj = {};
        warehouse_obj.warehouse_name = warehouse_name;
        warehouse_obj.warehouse_code = warehouse_code;
        warehouse_obj.address = address;
        warehouse_obj.telp = telp;
        warehouse_obj.city = city;
        warehouse_obj.remarks = remarks;
        warehouse_obj.pic_input = pic_input;
        warehouse_obj.input_time = input_time;
        warehouse_obj.pic_edit = pic_edit;
        warehouse_obj.edit_time = edit_time;
        let newWarehouse = new Warehouse(warehouse_obj);

        const warehouseSave = await newWarehouse.save();
        
        res.json({
            status: "success",
            message: "berhasil menambahkan warehouse",
            data: [],
        });
        
    } catch (err) {
        res.json({
            status: "failed",
            message: 'server error : ' + err.message,
            data: [],
        });
    }
}

/**
 * controller /warehouse/:id.
 * @return {Object} - mengupdate warehouse
 */
exports.updateWarehouse = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const Warehouse = require('../models/MstWarehouse')(connectionManager.getConnection(connectionDB));
        const {
            id
        } = req.params;

        let {
            warehouse_name,
            warehouse_code,
            address,
            telp,
            city,
            remarks,
            pic_input,
            input_time,
            pic_edit,
            edit_time
        } = req.body;

        const warehouse_obj = {};
        warehouse_obj.warehouse_name = warehouse_name;
        warehouse_obj.warehouse_code = warehouse_code;
        warehouse_obj.address = address;
        warehouse_obj.telp = telp;
        warehouse_obj.city = city;
        warehouse_obj.remarks = remarks;
        warehouse_obj.pic_input = pic_input;
        warehouse_obj.input_time = input_time;
        warehouse_obj.pic_edit = pic_edit;
        warehouse_obj.edit_time = edit_time;
        
        const warehouse = await Warehouse.findOne(
            { _id: id, is_active: 1 },
            { _id: 1 }
        ).lean();
        if(!warehouse) {
            return res.json({
                status: "failed",
                message: "warehouse tidak di temukan",
                data: [],
            });
        }
            await Warehouse.findOneAndUpdate(
                { _id: warehouse._id },
                warehouse_obj,
                { new: true }
            );

            res.json({
                status: "success",
                message: "berhasil mengupdate warehouse",
                data: [],
            });
    } catch (err) {
        res.json({
            status: "failed",
            message: 'server error : ' + err.message,
            data: [],
        });
    }
}

/**
 * controller /warehouse/:id.
 * @return {Object} - menghapus warehouse
 */
exports.deleteWarehouse = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const Warehouse = require('../models/MstWarehouse')(connectionManager.getConnection(connectionDB));
        const {
            id
        } = req.params;

        const warehouse = await Warehouse.findOne(
            { _id: id, is_active: 1 },
            { _id: 1 }
        ).lean();

        if (!warehouse) {
            return res.json({
                status: "failed",
                message: "warehouse tidak di temukan",
                data: [],
            });
        }

        const warehouse_obj = {};
        warehouse_obj.is_active = 0;
        await Warehouse.findOneAndUpdate(
            { _id: warehouse._id },
            warehouse_obj,
            { new: true })

        res.json({
            status: "success",
            message: "berhasil menghapus warehouse",
            data: [],
        });

    } catch (err) {
        res.json({
            status: "failed",
            message: 'server error : ' + err.message,
            data: [],
        });
    }
}