const passport = require('passport');
const mongoose = require("mongoose");
const Company = require("../models/MstCompany");
const decryptString = require("../utils/decryptString");
const cache = require('memory-cache');
require('../middleware/jwtMobile')(passport)

module.exports = (req, res, next) => {
    passport.authenticate('jwt', async function(err, user, info) {
        if(err) return next(err);

        if(!user) return res.status(401).json({message: 'Unauthorized Access - No Token Provided!'});
        req.user = user;
        next();
    })(req, res, next)
}