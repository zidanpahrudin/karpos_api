const ItemsKind = require('../models/MstItemsKind');
const connectionManager = require("../middleware/db");
exports.getItemsKind = async (req, res) => {
    try {
        const { id } = req.query;
        if (id) {
            await ItemsKind.findById(id).lean().exec(async (err, data) => {
                if (err) return res.status(400).json({ message: "Error : " + err.message })

                if (!data.length > 0) {
                    return res.json({ status: 'Success', message: 'tidak terdapat data items kind', data: data })
                }
                res.json({ status: 'Success', message: 'berhasil mendapatkan data items kind', data: data })
            });
        } else {

            await ItemsKind.find({ is_active: 1 }).sort({createdAt: -1}).lean().exec(async (err, data) => {
                if (err) return res.status(400).json({ message: "Error : " + err.message })
                if (!data.length > 0) {
                    return res.json({ status: 'Success', message: 'tidak terdapat data items kind', data: data })
                }
               return res.json({ status: 'Success', message: 'berhasil mendapatkan data items kind', data: data })
            });
        }

    } catch (err) {
        res.json({ message: 'server error : ' + err.message })
    }

};

exports.addItemsKind = async (req, res) => {
    try {
        const {
            items_kind_code,
            items_kind_name,
            is_active,
            pic_input,
            input_time,
            pic_edit,
            edit_time
        } = req.body;

        let newItemsKind = new ItemsKind({
            items_kind_code,
            items_kind_name,
            is_active,
            pic_input,
            input_time,
            pic_edit,
            edit_time
        });

        await newItemsKind.save((err, data) => {
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

exports.updateItemsKind = async (req, res) => {
    try {
        let update = req.body;
        await ItemsKind.findOneAndUpdate({ _id: req.params.id }, update, { new: true }).exec((err, data) => {
            if (err) return res.status(400).json({ status: 'Error', message: "gagal mengupdate data", data: [] })

           return res.json({ status: 'Success', message: 'data berhasil di simpan', data: data })

        })
    } catch (err) {
        return res.json({ message: 'server error : ' + err.message })
    }
}

exports.deleteItemsKind = async (req, res) => {
    try {
        await ItemsKind.findOneAndUpdate({ _id: req.params.id }, { is_active: 0 }, { new: true }).exec((err, data) => {
            if (err) return res.status(400).json({ status: 'Error', message: "gagal menghapus data", data: [] })

            return res.json({ status: 'Success', message: 'data berhasil di hapus', data: [] })

        })
    } catch (err) {
        return res.json({ message: 'server error : ' + err.message })
    }
}