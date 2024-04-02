const connectionManager = require("../middleware/db");
exports.getSupplier = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const Supplier = require('../models/MstSupplier')(connectionManager.getConnection(connectionDB));

        const { id } = req.query;
        if(id) {
            await Supplier.findById(id).exec(async (err, data) => {
                if (err) return res.status(400).json({ message: "Error : " + err.message })
                if (!data.length > 0) {
                    return res.json({ status: 'Success', message: 'tidak terdapat data supplier', data: data })
                }
                res.json({ status: 'Success', message: 'berhasil mendapatkan data supplier', data: data })
            });
        } else {
            
            await Supplier.find({is_active: 1}).sort({input_time: -1}).exec(async (err, data) => {
                if (err) return res.status(400).json({ message: "Error : " + err.message })
                if (!data.length > 0) {
                    return res.json({ status: 'Success', message: 'tidak terdapat data supplier', data: data })  
                }
                res.json({ status: 'Success', message: 'berhasil mendapatkan data supplier', data: data })
            });
        }

    } catch (err) {
        res.json({ message: 'server error : ' + err.message })
    }

};

exports.addSupplier = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const Supplier = require('../models/MstSupplier')(connectionManager.getConnection(connectionDB));

        const {
            supplier_name,
            npwp,
            address,
            contact1,
            contact2,
            email,
            pic_sales,
            remaks,
            is_ppn,
            is_active,
            pic_input,
            input_time,
            pic_edit,
            edit_time
        } = req.body;

        let newSupplier = new Supplier({
            supplier_name,
            npwp,
            address,
            contact1,
            contact2,
            email,
            pic_sales,
            remaks,
            is_ppn,
            is_active,
            pic_input,
            input_time,
            pic_edit,
            edit_time
        });

        await newSupplier.save((err, data) => {
            if (err) return res.status(400).json({ status: 'Success', message: "Error : " + err.message })

            if (!data) {
                return res.json({ status: 'Failed', message: 'gagal mengupdate data', data: [] })
            }

            res.json({ status: 'Success', message: 'data berhasil di simpan', data: data })

        })
    } catch (err) {
        res.json({ message: 'server error : ' + err.message })
    }
}

exports.updateSupplier = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const Supplier = require('../models/MstSupplier')(connectionManager.getConnection(connectionDB));

        let update = req.body;
        await Supplier.findOneAndUpdate({_id: req.params.id}, update, {new: true}).exec((err, data) => {
            if (err) return res.status(400).json({ status: 'Error', message: "gagal mengupdate data", data: [] })

            res.json({ status: 'Success', message: 'data berhasil di simpan', data: data })

        })  
    } catch (err) {
        return res.json({ message: 'server error : ' + err.message })
    }
}

exports.deleteSupplier = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const Supplier = require('../models/MstSupplier')(connectionManager.getConnection(connectionDB));

        await Supplier.findOneAndUpdate({_id: req.params.id}, {is_active: 0}, {new: true}).exec((err, data) => {
            if (err) return res.status(400).json({ status: 'Error', message: "gagal menghapus data", data: [] })

            res.json({ status: 'Success', message: 'data berhasil di hapus', data: [] })

        })  
    } catch (err) {
        return res.json({ message: 'server error : ' + err.message })
    }
}