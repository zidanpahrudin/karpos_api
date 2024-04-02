
const UserV2 = require('../models/MstUserV2');
const { Schema } = require('mongoose');
const Company = require("../models/MstCompany");
const bcrypt = require('bcrypt');
const _ = require("lodash");
const connectionManager = require("../middleware/db");

const decryptString = require("../utils/decryptString");



module.exports = {
/**
 * controller admin/user_menu/:id
 * @return {Object} - menambahkan list menu permission user
 */
AddmenuUser: async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const { id } = req.params;
        const { menu_id } = req.body;
        
        const user_v2 = await UserV2.findOne(
            { _id: id, is_active: 1 },
            { _id: 1 }
        ).lean()
        
        if(!user_v2) {
            return res.json({
                status: "failed",
                message: "user tidak di temukan",
                data: []
            })
        }
        let menuUser = [];

        // for (const list of menu_id) {
        //     menuUser.push({
        //         user_id: user_v2,
        //         menu_id: list
        //     })
        // }
        const menu_user = {
            user_id: user_v2,
            menu_id: menu_id
        }
        const MenuPermission = require('../models/MstMenuPermission')(connectionManager.getConnection(connectionDB));
        let insertMenuPermission = new MenuPermission(menu_user);
        await insertMenuPermission.save();
        res.json({
            status: "success",
            message: "menu permission di tambahkan",
            data: insertMenuPermission,
        })

    } catch (err) {
        res.json({
            status: "failed",
            message: 'server error : ' + err.message,
            data: [],
        })
    }
},

/**
 * controller admin/user_menu.
 * @return {Object} - mendapatkan list menu permission user
 */
getMenuUser: async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const menu_permission_pipeline = [
                {
                  '$group': {
                    '_id': '$user_id', 
                    'menu_id': {
                      '$addToSet': '$menu_id'
                    }
                  }
                }, {
                  '$graphLookup': {
                    'from': 'mst_menu', 
                    'startWith': '$menu_id', 
                    'connectFromField': '_id', 
                    'connectToField': '_id', 
                    'as': 'menu'
                  }
                }, {
                  '$graphLookup': {
                    'from': 'mst_user', 
                    'startWith': '$_id', 
                    'connectFromField': '_id', 
                    'connectToField': '_id', 
                    'as': 'user'
                  }
                }, {
                  '$unwind': {
                    'path': '$user'
                  }
                }, {
                  '$replaceRoot': {
                    'newRoot': {
                      '$mergeObjects': [
                        '$user', {
                          'menu': '$menu'
                        }
                      ]
                    }
                  }
                }, {
                  '$project': {
                    'password': 0, 
                    '__v': 0
                  }
                },
              ]
              const MenuPermission = require('../models/MstMenuPermission')(connectionManager.getConnection(connectionDB));
        const list_menu_permission = await MenuPermission.aggregate(menu_permission_pipeline)
        if (list_menu_permission.length <= 0) {
            return res.json({
                status: "failed",
                message: "menu list permison tidak ditemukan",
                data: [],
            })
        }
        res.json({ 
            status: "failed",
            message: "menu list permison ditemukan",
            data: list_menu_permission,
        });
    } catch (err) {
        res.json({
            status: "failed",
            message: 'server error : ' + err.message,
            data: [],
        })
    }
},

/**
 * controller admin/user_menu/:id
 * @return {Object} - mendapatkan user akses by id
 */
getMenuUserById: async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const { id } = req.params;
        
        const obj_result = {};
        // const User = require('../models/MstUser')(connectionManager.getConnection(connectionDB));
        // const user = await User.findOne(
        //     { _id: id, is_active: 1 },
        // ).lean();
        // if(user) {
        //     obj_result._id = user._id;
        //     obj_result.name = user.name;
        //     obj_result.username = user.username;
        //     obj_result.level_user = user.level_user;
        //     obj_result.is_active = user.is_active;
        //     obj_result.input_time = user.input_time;
        //     obj_result.edit_time = user.edit_time;
        //     obj_result.createdAt = user.createdAt;
        //     obj_result.updatedAt = user.updatedAt;
        // }

        const user_v2 = await UserV2.findOne(
            { _id: id, is_active: 1 }
        ).lean();
        if(user_v2) {
            obj_result._id = user_v2._id;
            obj_result.name = user_v2.name;
            obj_result.username = user_v2.username;
            obj_result.level_user = user_v2.level_user;
            obj_result.is_active = user_v2.is_active;
            obj_result.input_time = user_v2.input_time;
            obj_result.edit_time = user_v2.edit_time;
            obj_result.createdAt = user_v2.createdAt;
            obj_result.updatedAt = user_v2.updatedAt;
        }
       
        if(!user_v2) {
            return res.json({
                status: "failed",
                message: "user tidak di temukan",
                data: []
            })
        }
        

            const menu_array = [];
            const MenuPermission = require('../models/MstMenuPermission')(connectionManager.getConnection(connectionDB));
            let menuPermissionv2 = await MenuPermission.find({user_id: user_v2._id}, {menu_id: 1}).lean();
            const Menu = require('../models/MstMenu')(connectionManager.getConnection(connectionDB));

            if(menuPermissionv2) {
                for await (const menu of menuPermissionv2) {
                    
                    const list_menu = await Menu.findOne({_id: menu.menu_id}).lean();
                    menu_array.push(list_menu)
                }
                obj_result.menu = menu_array;
            }

            if(obj_result.length <= 0) {
                return res.json({
                    status: "failed",
                    message: "list permission tidak ditemukan",
                    data: [],
                })
            }
        res.json({
            status: "success",
            message: "permission user ditemukan",
            data: menu_array.length > 0 ? [obj_result] : menu_array,
        })

    } catch (err) {
        res.json({
            status: "failed",
            message: 'server error : ' + err.message,
            data: [],
        });
    }
},

updateMenu: async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const User = require('../models/MstUser')(connectionManager.getConnection(connectionDB));

        await User.findById(req.params.id).exec(async (err, user) => {
            if (err) return res.status(400).json({ message: "Error : " + err.message });
            let newMenuUser = req.body.menu_id;
            const MenuPermission = require('../models/MstMenuPermission')(connectionManager.getConnection(connectionDB));
            await MenuPermission.findOneAndUpdate(
                { user_id: user._id },
                { menu_id: newMenuUser },
                { new: true }
            ).exec((err, menu) => {
                if (err) return res.status(400).json({ message: "Error : " + err.message });

                res.json({ status: 'Success', message: 'data berhasil di update', data: menu })
            })
        });
    } catch (err) {
        res.json({ message: 'server error : ' + err.message })
    }
},

changePassword: async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        const {phone, password} = req.body;
        // let user = await User.findOneAndUpdate(
        //     {
        //         phone: phone
        //     },
        //     {
        //         password: password
        //     }
        // )

        // if (!user) {
        //     return res
        //         .status(400)
        //         .json({
        //             status: "failed",
        //             message: "gagal merubah password",
        //             data: []
        //         })
        // }


        // await MstPartner.findOneAndUpdate(
        //     { phone: user.phone },
        //     { password: user.password }
        // )

       return res
            .status(200)
            .json({
                status: "success",
                message: "success mengupdate password",
                data: ""
            })
    } catch (err) {
        return res.json({ message: 'server error : ' + err.message })
    }
},

deleteAccessUser: async (req, res) => {
    try {
        const connectionDB = req.user.database_connection;
        await UserV2.findById(req.params.id).exec(async (err, user) => {
            if (err) return res.status(400).json({ message: "Error : " + err.message });
            
            if(!user) {
                return res.json({
                    status: "failed",
                    message: "user tidak di temukan",
                    data: []
                })
            }
            const MenuPermission = require('../models/MstMenuPermission')(connectionManager.getConnection(connectionDB));
            await MenuPermission.deleteMany(
                { user_id: user._id }
            ).exec((err, menu) => {
                if (err) return res.status(400).json({ message: "Error : " + err.message });

                res.json({ status: 'Success', message: 'data berhasil di delete', data: [] })
            })

        });
    } catch (err) {
        res.json({ message: 'server error : ' + err.message })
    }
},

getUsers: async (req, res) => {
    const connectionDB = req.user.database_connection;
    const { type, id } = req.query;
    const company = await Company.findOne({_id: req.user.company_id}).lean()
    const defaultRes = {
        __v: 0
    };

    const user_obj = {};
    user_obj.company_id = company._id;
    user_obj.is_active = 1;
    if(id) user_obj._id = id;
    switch (type) {
        case 'user':
            if (id) {
                await UserV2.find( user_obj , { ...defaultRes, password: 0 }).lean().exec((err, data) => {
                    if (err) return res.json({ status: 'Failed', message: `gagal mendapatkan data ${type}`, data: [] });

                    if (data.length > 0) {
                        return res.json({ status: 'Success', message: `success mendapakan data ${type}`, data: data })
                    } else {
                        return res.json({ status: 'Success', message: `tidak terdapat data ${type}`, data: data })
                    }
                });
            } else {
                await UserV2.find(user_obj, { ...defaultRes, password: 0 }).sort({input_time: -1}).lean().exec((err, data) => {
                    if (err) return res.json({ status: 'Failed', message: `gagal mendapatkan data ${type}`, data: [] });

                    if (data.length > 0) {
                        return res.json({ status: 'Success', message: `success mendapakan data ${type}`, data: data })
                    } else {
                        return res.json({ status: 'Success', message: `tidak terdapat data ${type}`, data: data })
                    }
                });
            }
            break;
        case 'customer':
            const Customer = require('../models/MstCustomer')(connectionManager.getConnection(connectionDB));
            if (id) {
                
                await Customer.find({ _id: id }, { ...defaultRes }).lean().exec((err, data) => {
                    if (err) return res.json({ status: 'Failed', message: `gagal mendapatkan data ${type}`, data: [] });

                    if (data.length > 0) {
                        return res.json({ status: 'Success', message: `success mendapakan data ${type}`, data: data })
                    } else {
                        return res.json({ status: 'Success', message: `tidak terdapat data ${type}`, data: data })
                    }
                });
            } else {
                await Customer.find({is_active: 1}, { ...defaultRes }).sort({input_time: -1}).lean().exec((err, data) => {
                    if (err) return res.json({ status: 'Failed', message: `gagal mendapatkan data ${type}`, data: [] });

                    if (data.length > 0) {
                        return res.json({ status: 'Success', message: `success mendapakan data ${type}`, data: data })
                    } else {
                        return res.json({ status: 'Success', message: `tidak terdapat data ${type}`, data: data })
                    }
                })
            }
            break;
        case 'warehouse':
            const Warehouse = require('../models/MstWarehouse')(connectionManager.getConnection(connectionDB));
            if (id) {
                await Warehouse.find({ _id: id }, { ...defaultRes }).lean().exec((err, data) => {
                    if (err) return res.json({ status: 'Failed', message: `gagal mendapatkan data ${type}`, data: [] });

                    if (data.length > 0) {
                        return res.json({ status: 'Success', message: `success mendapakan data ${type}`, data: data })
                    } else {
                        return res.json({ status: 'Success', message: `tidak terdapat data ${type}`, data: data })
                    }
                })
            } else {
                await Warehouse.find({is_active: 1}, { ...defaultRes }).sort({input_time: -1}).lean().exec((err, data) => {
                    if (err) return res.json({ status: 'Failed', message: `gagal mendapatkan data ${type}`, data: [] });

                    if (data.length > 0) {
                        return res.json({ status: 'Success', message: `success mendapakan data ${type}`, data: data })
                    } else {
                        return res.json({ status: 'Success', message: `tidak terdapat data ${type}`, data: data })
                    }
                })
            }
            break;
        default:
            return res.json({ status: 'Failed', message: `${type} tidak di temukan`, data: [] })
    }

},

addCustomer: async (req, res) => {
    const connectionDB = req.user.database_connection;
    const { type } = req.query;

    switch (type) {
        case 'customer':
            const Customer = require('../models/MstCustomer')(connectionManager.getConnection(connectionDB));
            let newCustomer = new Customer(req.body);
            await newCustomer.save((err, data) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal menyimpan data customer', data: [] });

                if (data) {
                    return res.json({ status: 'Success', message: 'berhasil menyimpan data customer', data: data })
                }
            });
        break;
        default:
            return res.json({ status: 'Failed', message: 'tidak terdapat status', data: [] })
    }
    
},

UpdateCustomer: async (req, res) => {
    const connectionDB = req.user.database_connection;
    const { type } = req.query;
    const update = req.body;
    const updateInput = {};
    switch (type) {
        case 'customer':
            const Customer = require('../models/MstCustomer')(connectionManager.getConnection(connectionDB));
            await Customer.findOneAndUpdate({ _id: req.params.id }, update, { new: true }).exec((err, data) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data customer', data: [] });

                return res.json({ status: 'Success', message: 'berhasil mengupdate data customer', data: data })
            })
            break;
        case 'user':            
            if(!_.isEmpty(update)) {
                updateInput.name = update.name
                updateInput.username = update.username
                updateInput.level_user = update.level_user
                updateInput.is_active = update.is_active
                const salt = await bcrypt.genSalt(10);
                if(update.password) updateInput.password = await bcrypt.hash(update.password, salt);
            } else {
                return res.json({
                    status: "failed",
                    message: "tidak ada update data",
                    data: []
                })
            }


            await UserV2.findOneAndUpdate({ _id: req.params.id }, updateInput, { new: true }).exec((err, data) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data customer', data: [] });

                return res.json({ status: 'Success', message: 'berhasil mengupdate data customer', data: data })
            })
            break;

        case 'warehouse':
            const Warehouse = require('../models/MstWarehouse')(connectionManager.getConnection(connectionDB));
            await Warehouse.findOneAndUpdate({ _id: req.params.id }, update, { new: true }).exec((err, data) => {
                if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data customer', data: [] });

                return res.json({ status: 'Success', message: 'berhasil mengupdate data customer', data: data })
            })
            break;
    }

},

DeleteCustomer: async (req, res) => {
    const connectionDB = req.user.database_connection;
    const Customer = require('../models/MstCustomer')(connectionManager.getConnection(connectionDB));
    await Customer.findOneAndUpdate({ _id: req.params.id }, { is_active: 0 }, { new: true }).exec((err, data) => {
        if (err) return res.json({ status: 'Failed', message: 'gagal mendapatkan data customer', data: [] });

        return res.json({ status: 'Success', message: 'berhasil menghapus data customer', data: [] })
    })
}
}
