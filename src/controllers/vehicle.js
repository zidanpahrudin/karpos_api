const connectionManager = require("../middleware/db");

exports.getVehicle = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const Vehicle = require('../models/MstVehicle')(connectionManager.getConnection(connectionDB));
        const { id } = req.query;
        if (id) {
            await Vehicle.findById(id).exec(async (err, data) => {
                if (err) return res.status(400).json({ message: "Error : " + err.message })
                if (!data.length > 0) {
                    return res.json({ status: 'Success', message: 'tidak terdapat data vehicle', data: data })
                }
                res.json({ status: 'Success', message: 'berhasil mendapatkan data vehicle', data: data })
            });
        } else {

            await Vehicle.find({ is_active: 1 }).sort({input_time: -1}).exec(async (err, data) => { 
                if (err) return res.status(400).json({ message: "Error : " + err.message })
                if(data) {
                    if (!data.length > 0) {
                        return res.json({ status: 'Success', message: 'tidak terdapat data vehicle', data: [] })
                    }
                }
                res.json({ status: 'Success', message: 'berhasil mendapatkan data vehicle', data: data })
            })
        }
    } catch (err) {
        res.json({ message: 'server error : ' + err.message })
    }

};

exports.addVehicle = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const Vehicle = require('../models/MstVehicle')(connectionManager.getConnection(connectionDB));
        const {
            vehicle_no,
            vehicle_merk,
            is_active,
            pic_input,
            input_time,
            pic_edit,
            edit_time
        } = req.body;

        let newVehicle = new Vehicle({
            vehicle_no,
            vehicle_merk,
            is_active,
            pic_input,
            input_time,
            pic_edit,
            edit_time
        });

        await newVehicle.save((err, data) => {
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

exports.updateVehicle = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const Vehicle = require('../models/MstVehicle')(connectionManager.getConnection(connectionDB));
        let update = req.body;
        await Vehicle.findOneAndUpdate({ _id: req.params.id }, update, { new: true }).exec((err, data) => {
            if (err) return res.status(400).json({ status: 'Error', message: "gagal mengupdate data", data: [] })

            res.json({ status: 'Success', message: 'data berhasil di simpan', data: data })

        })
    } catch (err) {
        return res.json({ message: 'server error : ' + err.message })
    }
}

exports.deleteVehicle = async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const Vehicle = require('../models/MstVehicle')(connectionManager.getConnection(connectionDB));
        await Vehicle.findOneAndUpdate({ _id: req.params.id }, { is_active: 0 }, { new: true }).exec((err, data) => {
            if (err) return res.status(400).json({ status: 'Error', message: "gagal menghapus data", data: [] })

            res.json({ status: 'Success', message: 'data berhasil di hapus', data: [] })

        })
    } catch (err) {
        return res.json({ message: 'server error : ' + err.message })
    }
}