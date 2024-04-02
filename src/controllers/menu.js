
const decryptString = require("../utils/decryptString");
const connectionManager = require("../middleware/db");
module.exports = {
    addMenu: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Menu = require('../models/MstMenu')(connectionManager.getConnection(connectionDB));
            const newMenu = new Menu(req.body);
            let saveMenu = await newMenu.save();
    
            res.json({ message: 'success', data: saveMenu })
        } catch (err) {
            res.json({ message: 'server error : ' + err.message })
        }
    },
    
    getMenu: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Menu = require('../models/MstMenu')(connectionManager.getConnection(connectionDB));
            const menu = await Menu.find({is_active: 1}, { __v: 0 }).sort({menu_group: 1})
            

            res.status(200).json({ message: "Success", data: menu })
            
        } catch (err) {
            res.json({ message: 'server error : ' + err.message })
        }
    },
    
    updateMenu: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            let update = req.body;
            const Menu = require('../models/MstMenu')(connectionManager.getConnection(connectionDB));
            await Menu.findOneAndUpdate(
                { _id: req.params.id },
                update,
                { new: true }
            ).exec((err, data) => {
                if (err) res.status(400).json({ message: "Error : " + err.message })
                res.status(200).json({ status: "Success", message: 'success update menu', data: data })
            })
        } catch (err) {
            res.json({ message: 'server error : ' + err.message })
        }
    },
    
    deleteMenu: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Menu = require('../models/MstMenu')(connectionManager.getConnection(connectionDB));
            await Menu.findByIdAndRemove(req.params.id).exec((err, data) => {
                if (err) res.status(400).json({ message: "Error : " + err.message })
                res.status(200).json({ status: "Success", message: 'success delete menu', data: [] })
            })
        } catch (err) {
            res.json({ message: 'server error : ' + err.message })
        }
    },
}
