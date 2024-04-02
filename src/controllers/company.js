const decryptString = require("../utils/decryptString");
const UserV2 = require('../models/MstUserV2');
const Company = require("../models/MstCompany");
//const User = require('../models/MstUser');
//const MstPartner = require('../models/MstPartner');
const connectionManager = require("../middleware/db");

module.exports = {
    /**
     * controller company/list
     * @return {Object} - mendapatkan izin akses user
     */
    listCompany: async (req, res) => {
        try {
            const search = req.query.search;
            const company_pipeline = {};
            if(search && search['status']) {
                company_pipeline.is_active = search['status']
            };
            const company = await Company.find({company_pipeline}).sort({pt_name: 1}).lean();
            if(company.length < 0) {
                return res.json({
                    status: "failed",
                    message: "company tidak tersedia",
                    data: company
                })
            }

            return res.json({
                status: "success",
                message: "data list company",
                data: company
            });
        } catch (err) {
            res.json({
                status: "failed",
                message: 'server error : ' + err.message,
                data: [],
            })
        }
    },


}