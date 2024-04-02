const multer = require('multer');
const path = require("path")
const fs = require("fs");

const DIR_UPLOADS_ROOT = process.env.ROOT_UPLOADS;
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = `${DIR_UPLOADS_ROOT}/images/incomingstock01`;
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, "./public/images/incomingstock01");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    },
});

const upload = multer({
    storage: storage,
});

module.exports.send = (req, res, next) => {
    return upload.single('att_file')(req, res, () => {
        try {
            if(req.file) {
                console.log("file uploaded")
            } else {
                console.log("file not upload")
            }
            next()
        } catch(err) {
            next()
            console.log(err.message)
        }
    })
}

const storageSignImg = multer.diskStorage({
    destination: function (req, res, cb) {
        const dir = `${DIR_UPLOADS_ROOT}/images/sign`;
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, "./public/images/sign");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
})

const uploadSignImg = multer({
    storage: storageSignImg
})

module.exports.signImg = (req, res, next) => {
    return uploadSignImg.single('sign_img')(req, res, () => {
        if (!req.file) return res.json({ error: "err.message" })
        next()
    })
}


const storagePartnePict = multer.diskStorage({
    destination: function (req, res, cb) {
        var dir = './public/api/mobile/images/partner';
    
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, "./public/api/mobile/images/partner");
    },
    filename: function (req, file, cb) {
        let extfile = path.extname(file.originalname);
        cb(null, Date.now() + "-" + req.user.id + extfile);
    }
})

const uploadPartnerPict = multer({
    storage: storagePartnePict
})

module.exports.partnerPict = (req, res, next) => {
    return uploadPartnerPict.single('partner_pict')(req, res, () => {
        if (!req.file) return res.json({ error: "err.message" })
        next()
    })
}


const storageLogoCompany = multer.diskStorage({
    destination: function (req, res, cb) {
        const dir = `${DIR_UPLOADS_ROOT}/web/images/company`;
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, "./public/web/images/company");
    },
    filename: function (req, file, cb) {
        let extfile = path.extname(file.originalname);
        cb(null, Date.now() + "-" + file.originalname + extfile);
    }
})

const uploadLogoCompany = multer({
    storage: storageLogoCompany
})

module.exports.logoPict = (req, res, next) => {
    return uploadLogoCompany.single('logo_company')(req, res, () => {
        if (!req.file) return res.json({ error: "err.message" })
        next()
    })
}



