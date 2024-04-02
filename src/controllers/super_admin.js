// package
const fs = require('fs');
const path = require('path');
const { ObjectId } = require("mongodb");
const connectionManager = require("../middleware/db");
// models
const User = require("../models/MstUserV2");
const Company = require("../models/MstCompany");

exports.getList = async (req, res) => {
    try {
        const {
            search
        } = req.query;
        
        res.json({
            status: "success",
            message: "list di temukan",
            data: []
        })

    } catch (err) {
        res.json(
            {
                status: "failed",
                message: 'server error : ' + err.message,
                data: []
            }
        )
    }
}

exports.registerAdmin = async (req, res) => {
    try {
        const {
            name,
            username,
            level_user,
            password,
            input_time,
            company_id
        } = req.body;
        
        const obj_user = {};
        obj_user.name = name;
        obj_user.username = username;
        obj_user.level_user = level_user;
        obj_user.password = password;
        // if (req.user.id) obj_user.pic_input = ObjectId(req.user.id);
        if (input_time) obj_user.input_time = input_time;
        if (company_id) obj_user.company_id = ObjectId(company_id);

        let new_user = new User(obj_user);

        await new_user.save();

        res.json({
            status: "success",
            message: "berhasil mendaftar kan admin",
            data: []
        });

    } catch (err) {
        res.json(
            {
                status: "failed",
                message: 'server error : ' + err.message,
                data: []
            }
        )
    }
};

exports.registerPT = async (req, res) => {
    try {
        const {
            pt_name,
            npwp,
            url,
            address,
            tautan
        } = req.body;

        const obj_pt = {};
        obj_pt.pt_name = pt_name;
        obj_pt.npwp = npwp;
        obj_pt.address = address;
        obj_pt.url = url;
        

        if (req.file && req.file.filename) {
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

                obj_pt.logo = req.file.filename;
                if(tautan) obj_pt.tautan = tautan;
        }
        let new_pt = new Company(obj_pt);

        await new_pt.save();

        res.json({
            status: "success",
            message: "berhasil mendaftarkan pt",
            data: []
        })

    } catch (err) {
        res.json(
            {
                status: "failed",
                message: 'server error : ' + err.message,
                data: []
            }
        )
    }
};