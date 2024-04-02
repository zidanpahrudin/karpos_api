// package
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
// models
const connectionManager = require("../middleware/db");



module.exports = {

    getPartner: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Partner = require('../models/MstPartner')(connectionManager.getConnection(connectionDB));
            const { id } = req.query;
            if (id) {
                await Partner.findById(id).exec(async (err, data) => {
                    if (err) return res.status(400).json({ message: "Error : " + err.message })
                    if (!data) {
                        return res.json({ status: 'Success', message: 'tidak terdapat data partner', data: data })
                    }
                    res.json({ status: 'Success', message: 'berhasil mendapatkan data partner', data: data })
                });
            } else {
                await Partner.find({ is_active: 1 }).sort({ input_time: -1 }).exec(async (err, data) => {
                    if (err) return res.status(400).json({ message: "Error : " + err.message })
                    if (!data.length > 0) {
                        return res.json({ status: 'Success', message: 'tidak terdapat data partner', data: data })
                    }
                    res.json({ status: 'Success', message: 'berhasil mendapatkan data partner', data: data })
                });
            }
    
        } catch (err) {
            res.json({ message: 'server error : ' + err.message })
        }
    
    },
    
    addPartner: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Partner = require('../models/MstPartner')(connectionManager.getConnection(connectionDB));
            const UserV2 = require("../models/MstUserV2");
            const Company = require("../models/MstCompany");
            const {
                partner_name,
                phone,
                pic_input
            } = req.body;
            const partner_obj = {};
            const user = await UserV2.findOne(
                { is_active: 1, _id: pic_input }
            ).lean();
            if (!user) {
                return res.json({
                    status: "failed",
                    message: "user tidak di temukan",
                    data: []
                })
            }
            const company = await Company.findOne(
                { is_active: 1, _id: user.company_id }
            )
    
            if (!company) {
                return res.json({
                    status: "failed",
                    message: "company / perusahaan tidak ditemukan",
                    data: []
                })
            }
    
            const partner_phone = await UserV2.findOne(
                { is_active: 1, username: phone }
            ).lean();
            if (partner_phone) {
                return res.json({
                    status: "failed",
                    message: "no handphone telah di daftarkan",
                    data: []
                })
            }
    
            let newPartner = new Partner({
                partner_name,
                phone,
                level_user: 2,
                company_id: company._id,
                url_transaction: company.url + "mobile",
                password: phone,
            });
    
            const partner = await newPartner.save();
    
            partner_obj._id = partner._id;
            partner_obj.level_user = partner.level_user,
            partner_obj.name = partner_name;
            partner_obj.username = phone;
            partner_obj.password = phone;
            partner_obj.is_active = 1;
            partner_obj.pic_input = pic_input;
            partner_obj.company_id = company._id;
    
            const newUserV2 = new UserV2(partner_obj);
            await newUserV2.save();
    
            res.json({ status: 'Success', message: 'data berhasil di simpan', data: partner_obj })
    
        } catch (err) {
            res.json({ message: 'server error : ' + err.message })
        }
    },
    
    updatePartner: async (req, res) => {
        try {
            let { partner_name, phone, pic_edit } = req.body;
            const partner_obj = {};
            const user_obj = {};

            partner_obj.partner_name = partner_name;
            partner_obj.phone = phone;
            partner_obj.pic_edit = pic_edit;
            
            user_obj.name = partner_name;
            user_obj.username = phone;
            user_obj.pic_edit = pic_edit;

            const connectionDB = req.user.database_connection;
            const Partner = require('../models/MstPartner')(connectionManager.getConnection(connectionDB));
            const UserV2 = require("../models/MstUserV2");
    
    
            await Partner.findOneAndUpdate({ _id: req.params.id }, partner_obj)
            
            await UserV2.findOneAndUpdate({_id: req.params.id}, user_obj);
            res.json({
                status: "success",
                message: "success update user",
                data: []
            })
    
        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },
    
    mobilePartnerUpdate: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Partner = require('../models/MstPartner')(connectionManager.getConnection(connectionDB));
            const UserV2 = require("../models/MstUserV2")(connectionManager.getConnection(connectionDB));
            const Company = require("../models/MstCompany")(connectionManager.getConnection(connectionDB));
            const { partner_pict } = req.body;
    
            fs.writeFile(path.join(__dirname + "../../../" + "public/mobile/images/partner/" + req.user.id + ".jpg"), partner_pict, { encoding: 'base64' }, function (err) {
                if (err) {
                    return res.json({
                        status: "failed",
                        message: "upload foto tidak berhasil",
                        data: []
                    })
                }
    
            });
    
            let partner = await Partner.findOneAndUpdate({
                _id: req.user.id
            },
                {
                    $set:
                    {
                        partner_pic: req.user.id + ".jpg",
                        tautan: "/images/partner"
                    },
                }
            )
    
            res.json({
                status: "success",
                message: "berhasil menyimpan foto",
                data: partner
            })
    
            // if (req.file !== undefined) {
    
    
            //     if (req.file.filename !== undefined) {
            //         let extfile = path.extname(req.file.originalname);
            //         if (
            //           extfile !== ".jpeg" &&
            //           extfile !== ".jpg" &&
            //           extfile !== ".JPG" &&
            //           extfile !== ".png" &&
            //           extfile !== ".PNG"
            //         ) {
    
            //           fs.unlinkSync(req.file.path);
    
            //           return res.status(400).json({
            //             status: "failed",
            //             message:
            //               "Photo attach file hanya format .png, .jpg and .jpeg yang diperbolehkan!",
            //             data: [],
            //           });
            //         }   
    
            //         if (req.file !== undefined) {
            //             att_file_image = req.file.filename;
            //             att_file_tautan = "/images/partner";
            //           }
    
            //           let partner = await Partner.findOneAndUpdate({
            //             _id: req.user.id
            //           },
            //           {
            //             partner_pic: att_file_image,
            //             tautan: att_file_tautan
            //           },
            //           )
    
    
            //           res.json({
            //             status: "success",
            //             message: "berhasil menyimpan foto",
            //             data: partner
            //           })
            //       }
            // }
        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },
    
    mobilePartnerUpdatev2: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Partner = require('../models/MstPartner')(connectionManager.getConnection(connectionDB));
            const UserV2 = require("../models/MstUserV2")(connectionManager.getConnection(connectionDB));
            const Company = require("../models/MstCompany")(connectionManager.getConnection(connectionDB));
            let att_file_image = "";
            let att_file_tautan = "";
    
    
            if (req.file !== undefined) {
    
    
                if (req.file.filename !== undefined) {
                    let extfile = path.extname(req.file.originalname);
                    if (
                        extfile !== ".jpeg" &&
                        extfile !== ".jpg" &&
                        extfile !== ".JPG" &&
                        extfile !== ".png" &&
                        extfile !== ".PNG"
                    ) {
    
                        fs.unlinkSync(req.file.path);
    
                        return res.status(400).json({
                            status: "failed",
                            message:
                                "Photo attach file hanya format .png, .jpg and .jpeg yang diperbolehkan!",
                            data: [],
                        });
                    }
    
                    if (req.file !== undefined) {
                        att_file_image = req.file.filename;
                        att_file_tautan = "/images/partner";
                    }
    
                    let partner = await Partner.findOneAndUpdate({
                        _id: req.user.id
                    },
                        {
                            $set: {
                                partner_pic: att_file_image,
                                tautan: att_file_tautan
                            },
    
                        }
                    )
    
    
                    res.json({
                        status: "success",
                        message: "berhasil menyimpan foto",
                        data: partner
                    })
                }
            }
        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },
    
    mobileGetProfile: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Partner = require('../models/MstPartner')(connectionManager.getConnection(connectionDB));
            let partner = await Partner.findById(req.user.id).lean();
    
            if (!partner) {
                return res.json({
                    status: "failed",
                    message: "partner tidak di temukan",
                    data: []
                })
            }
    
            const objectProfile = {};
    
            objectProfile._id = partner._id
            objectProfile.avatar = partner.tautan + "/" + partner.partner_pic
    
    
            res.json({
                status: "success",
                message: "partner berhasil ditemukan",
                data: objectProfile
            })
        } catch (err) {
            res.json({
                status: "failed",
                message: "server error cause, " + err.message,
                data: []
            })
        }
    },
    
    deletePartner: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Partner = require('../models/MstPartner')(connectionManager.getConnection(connectionDB));
            const UserV2 = require("../models/MstUserV2");
            if (req.params.id === "63843cc7d0d5d5a1b96aea2e") {
                return res.json({
                    status: 'failed',
                    message: 'partner tidak di izinkan delete',
                    data: []
                })
            }
            await Partner.findOneAndUpdate({ _id: req.params.id }, { is_active: 0 })
    
            await UserV2.findOneAndUpdate({_id: req.params.id}, { is_active: 0 }, {new: true});

            res.json({
                status: "failed",
                message: "user berhasil di hapus",
                data: []
            })

        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },
    
    /**
     * controller mobile/partner/change_password
     * @return {Object} - merubah password partner
     */
    changePassword: async (req, res) => {
        try {
            const connectionDB = req.user.database_connection;
            const Partner = require('../models/MstPartner')(connectionManager.getConnection(connectionDB));
            const UserV2 = require("../models/MstUserV2")(connectionManager.getConnection(connectionDB));
            const Company = require("../models/MstCompany")(connectionManager.getConnection(connectionDB));
            const {
                old_password,
                new_password,
                confirm_password
            } = req.body;
    
            if (new_password !== confirm_password) {
                return res.json({
                    status: "failed",
                    message: "password tidak sama",
                    data: []
                })
            }
    
            let partner = await Partner.findOne(
                { is_active: 1, _id: req.user.id },
                { password: 1 }
            ).lean();
    
            if (!partner) {
                return res.json({
                    status: "failed",
                    message: "partner tidak di temukan",
                    data: []
                })
            }
    
            let isPasswordMatch = bcrypt.compareSync(old_password, partner.password);
            if (!isPasswordMatch) {
                return res.json({
                    status: "failed",
                    message: "password lama tidak sama",
                    data: []
                })
            }
    
            bcrypt.genSalt(10, function (err, salt) {
                if (err) {
                    return res.json({
                        status: "failed",
                        message: "gagal merubah password",
                        data: []
                    })
                }
    
                bcrypt.hash(confirm_password, salt, async function (err, hash) {
                    if (err) return next(err);
                    let updatePassword = await Partner.findByIdAndUpdate(req.user.id, {
                        password: hash
                    })

                    await UserV2.findOneAndUpdate(req.user.id, {
                        password: hash
                    });
    
                    if (!updatePassword) {
                        return res.json({
                            status: "failed",
                            message: "gagal merubah password",
                            data: []
                        })
                    }
                })
            })
    
    
            return res.json({
                status: "success",
                message: "berhasil merubah password",
                data: []
            })
    
        } catch (err) {
            return res.json({ message: 'server error : ' + err.message })
        }
    },
}

