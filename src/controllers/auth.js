const decryptString = require("../utils/decryptString");
const UserV2 = require('../models/MstUserV2');
const Company = require("../models/MstCompany");
//const User = require('../models/MstUser');
//const MstPartner = require('../models/MstPartner');
const connectionManager = require("../middleware/db");

module.exports = {
    /*
        @route POST api/auth/register
        @desc Register user
        @access Public
    */
    
    register: async (req, res) => {
        try {
            await UserV2.findOne({ username: req.body.username, company_id: req.user.company_id }).exec(async(err, data) => {
 
                if (err) return res.status(400).json({ message: 'failed' })
    
                if (data) {
                    return res.json({
                        status: "failed",
                        message: 'email sudah terdaftar',
                        data: []
                    })
                }
                const company = await Company.findOne({_id: req.user.company_id}).lean();
                const obj_user = {};
                obj_user.username = req.body.username;
                obj_user.password = req.body.password;
                obj_user.name = req.body.name;
                obj_user.is_active = req.body.is_active;
                obj_user.level_user = 2;
                obj_user.company_id = company._id,
                
                newUser = new UserV2(obj_user);
                newUser.save()
                    .then(user => res.status(200).json({
                        status: "success",
                        message: 'Username sudah terdaftar',
                        data: []
                    }))
                    .catch(err => res.status(500).json({ message: err.message }));
            })
        } catch (err) {
            res.json({ message: 'server error : ' + err.message })
        }
    
    },
    
    /*
        @route POST api/auth/login
        @desc Login user
        @access Public
    */
    login: async (req, res) => {
        try {
            const {username, password} = req.body;
            const {isMobile} = req.query;
            let user;
            if(isMobile === "1") {
                user = await MstPartner.findOne({ phone: username, is_active: 1 })
            } else {
                user = await User.findOne({ username: username, is_active: 1 })
            }
    
            if (!user) return res.status(401).json({ msg: 'email' + ' belum terdaftar' });
    
            //validate password
            if (!user.comparePassword(password)) return res.status(401).json({ message: 'Invalid email or password' });
    
            res.status(200).json({ 
                status: "success",
                message: "success", 
                data: user.generateJWT(), 
                user: user 
            });
        } catch (err) {
            res.json({ message: 'server error : ' + err.message })
        }
    },
    
    loginMobile: async (req, res) => {
        try {
            const {
                username,
                password
            } = req.body;
            const user = await MstPartner.findOne(
                { phone: username, is_active: 1 }
            )
            if (!user) {
                return res.json({ 
                    status: "failed", 
                    message: 'email' + ' belum terdaftar', 
                    data: []
                });
            } 
    
            //validate password
            if (!user.comparePassword(password)) return res.json({
                status: "failed",
                message: 'Invalid email or password',
                data: []
            }
            );
    
            const objResult = {};
            objResult.phone = user.phone;
            objResult.partner_name = user.partner_name;
            objResult.token = user.generateJWT();
            objResult.partner_pic = user.partner_pic;
            res.status(200).json({ 
                status: "success",
                message: "success login", 
                url_transaction: user?.url_transaction,
                data: objResult
            });
        } catch (err) {
            res.json({
                status: "failed",
                message: 'server error : ' + err.message,
                data: [],
            })
        }
    },
    
    loginMobileV2: async (req, res) => {

        const {
            username,
            password
        } = req.body;
        const user_obj = {};
        const user = await UserV2.findOne(
            {is_active: 1, username: username}
            );

        if(!user) {
            return res.json({
                status: "failed",
                message: "user belum terdaftar / belum aktif",
                data: []
            })
        }
        if (!user.comparePassword(password)) {
            return res.json({
                status: "failed", 
                message: 'username atau password salah',
                data: [] 
            });
        }

        user_obj.phone = user.username;
        user_obj.partner_name = user.name;
        user_obj.partner_pic = user.pic_input ? user.pic_input : "";

        // get url from company
        const company = await Company.findOne(
            {_id: user.company_id, is_active: 1}
            )


        if(!company) {
            return res.json({
                status: "failed",
                message: "perusahaan tidak terdaftar",
                data: []
            })
        }

        // decrypt database url
        user_obj.token = await user.generateJWT();
        user_obj.company_id = user.company_id;
        user_obj.url_transaction = "";
        const encryptedString = require("../utils/encryptedString");

        res.json({
            status: "success",
            message: "user berhasil login",
            url_transaction: "https://karboe.tech/api/" + "mobile",
            data: user_obj
        })
    },

    loginv2: async (req, res) => {
        try {
            const {username, password} = req.body;
            const user_obj = {};
            const menu_array =  [];
            let token = "";
            const user_admin = await UserV2.findOne({username: username});
            if (!user_admin) return res.status(401).json({ msg: 'email' + ' belum terdaftar' });

            if(user_admin) {
                if (!user_admin.comparePassword(password)) return res.status(401).json({ message: 'Invalid email or password' });
                let company = await Company.findById(user_admin.company_id);
                user_obj._id = user_admin._id;
                user_obj.url = company.url;
                user_obj.company_id = company._id;
                user_obj.company_name = company.pt_name;
                user_obj.username = user_admin.username
                user_obj.name = user_admin.name
                user_obj.level_user = user_admin.level_user;
                user_obj.is_active = user_admin.is_active;
                user_obj.input_time = user_admin.input_time;
                user_obj.edit_time = user_admin.edit_time;
                user_obj.createdAt = user_admin.createdAt;
                user_obj.updatedAt = user_admin.updatedAt;
                const MenuPermission = require('../models/MstMenuPermission')(connectionManager.getConnection(decryptString(company.db_connection)));
                const Menu = require('../models/MstMenu')(connectionManager.getConnection(decryptString(company.db_connection)));
                let menuPermissionv2 = await MenuPermission.find({ user_id: user_admin._id })
                
                let resultMenu = [];
                if (menuPermissionv2) {
                    if (menuPermissionv2) {
                        for await (const menu of menuPermissionv2) {

                            resultMenu.push(menu.menu_id)
                        }
                        const list_menu = await Menu.find({ _id: {$in: resultMenu} }).lean();
                        user_obj.menu = list_menu;
                    }
                }

                token = await user_admin.generateJWT();
//            connectionManager.closeConnection(decryptString(company.db_connection));
            }


            res.status(200).json({ 
                status: "success",
                message: "success", 
                data: token, 
                user: user_obj
            });
        }
        catch (err) {
            res.json({ message: 'server error : ' + err.message })
        }
    },

    loginSendToken: async (req, res) => {
        try {
            const {username, password, token} = req.body;
    
            // let user = await MstPartner.findOne({ phone: username, is_active: 1 })
            let user = await MstPartner.findOne(
                { phone: username, is_active: 1 }
    
            )
    
            if (!user) return res.json(
                { status: "failed", message: 'email' + ' belum terdaftar', data: []
            });
    
            //validate password
            if (!user.comparePassword(password)) return res.json({
                status: "failed",
                message: 'Invalid email or password',
                data: []
            }
            );
    
            const objResult = {};
            // objResult._id = user._id;
            objResult.phone = user.phone;
            objResult.partner_name = user.partner_name;
            objResult.token = user.generateJWT();
            objResult.partner_pic = user.partner_pic;
            // objResult.is_active = user.is_active;
            // objResult.tautan = user.tautan;
            res.status(200).json({ 
                status: "success",
                message: "success login", 
                data: objResult
            });
        } catch (err) {
            res.json({ message: 'server error : ' + err.message })
        }
    },
    
    /**
     * controller admin/permisson_menu/:user_id.
     * @return {Object} - mendapatkan izin akses user
     */
    menuPermission: async (req, res) => {
        try {
            const { id } = req.params;
            const { url } = req.body;
            const user = await User.findOne(
                { _id: id, is_active: 1 },
                { _id: 1 }
            ).lean();
            if(!user) {
                return res.json({
                    status: "failed",
                    message: "user tidak di temukan",
                    data: false
                })
            }
            const menuPermissionPipeline = [
                { $match: { 'user_id': user._id } },
                {
                    $graphLookup: {
                        from: 'mst_menu',
                        startWith: '$menu_id',
                        connectFromField: '_id',
                        connectToField: '_id',
                        as: 'menu'
                    }
                },
                { $unwind: '$menu' },
                {
                    $project: {
                        'menu': '$menu'
                    }
                },
                { $match: { "menu.url": url } }
            ]
                const menu_permission = await MenuPermission.aggregate(menuPermissionPipeline);
                if (menu_permission.length <= 0) {
                    return res.json({
                        status: "failed",
                        message: "menu permission tidak di temukan",
                        data: false,
                    })
                }
            res.json({
                status: "success",
                message: "user have access to access menu",
                data: true,
            })
            
    
        } catch (err) {
            res.json({
                status: "failed",
                message: 'server error : ' + err.message,
                data: [],
            })
        }
    },

    logout: async (req, res) => {
        try {
            if(req.session.connection_db) {
                req.session.connection_db = null;
            }
            res.json({
                status: "success",
                message: "success logout, session database berakhir",
                data: []
            })
        } catch (err) {
            res.json({
                status: "failed",
                message: "server error cause, " + err.message,
                data: []
            })
        }
    }

}