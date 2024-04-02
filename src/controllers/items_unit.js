
const connectionManager = require("../middleware/db");
exports.getItemsUnit = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const ItemsUnit = require('../models/MstItemsUnit')(connectionManager.getConnection(connectionDB));
        const { id } = req.query;
        if (id) {
            await ItemsUnit.findById(id).exec(async (err, data) => {
                if (err) return res.status(400).json({ message: "Error : " + err.message })

                if (!data.length > 0) {
                    return res.json({ status: 'Success', message: 'tidak terdapat data items unit', data: data })
                }
                res.json({ status: 'Success', message: 'berhasil mendapatkan data items unit', data: data })
            });
        } else {

            await ItemsUnit.find({ is_active: 1 }).sort({createdAt: -1}).exec(async (err, data) => {
                if (err) return res.status(400).json({ message: "Error : " + err.message })
                if (!data.length > 0) {
                    return res.json({ status: 'Success', message: 'tidak terdapat data items unit', data: data })
                }
               return res.json({ status: 'Success', message: 'berhasil mendapatkan data items unit', data: data })
            });
        }

    } catch (err) {
        res.json({ message: 'server error : ' + err.message })
    }

};

exports.addItemsUnit = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const ItemsUnit = require('../models/MstItemsUnit')(connectionManager.getConnection(connectionDB));
        const {
            items_unit_name,
            is_active,
            pic_input,
            input_time,
            pic_edit,
            edit_time
        } = req.body;

        let newItemsUnit = new ItemsUnit({
            items_unit_name,
            is_active,
            pic_input,
            input_time,
            pic_edit,
            edit_time
        });

        await newItemsUnit.save((err, data) => {
            if (err) return res.status(400).json({ status: 'Success', message: "Error : " + err.message })

            if (!data) {
                return res.json({ status: 'Failed', message: 'data gagal di simpan', data: [] })
            }

            return res.json({ status: 'Success', message: 'data berhasil di simpan', data: data })

        })
    } catch (err) {
        res.json({ message: 'server error : ' + err.message })
    }
}

exports.updateItemsUnit = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const ItemsUnit = require('../models/MstItemsUnit')(connectionManager.getConnection(connectionDB));
        let update = req.body;
        await ItemsUnit.findOneAndUpdate({ _id: req.params.id }, update, { new: true }).exec((err, data) => {
            if (err) return res.status(400).json({ status: 'Error', message: "gagal mengupdate data", data: [] })

           return res.json({ status: 'Success', message: 'data berhasil di simpan', data: data })

        })
    } catch (err) {
        return res.json({ message: 'server error : ' + err.message })
    }
}

exports.deleteItemsUnit = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const ItemsUnit = require('../models/MstItemsUnit')(connectionManager.getConnection(connectionDB));
        await ItemsUnit.findOneAndUpdate({ _id: req.params.id }, { is_active: 0 }, { new: true }).exec((err, data) => {
            if (err) return res.status(400).json({ status: 'Error', message: "gagal menghapus data", data: [] })

            return res.json({ status: 'Success', message: 'data berhasil di hapus', data: [] })

        })
    } catch (err) {
        return res.json({ message: 'server error : ' + err.message })
    }
}