const jwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const config = require('config');
const secretConfig = process.env.JWT_SECRET;
const MstPartner = require("../models/MstPartner");
const UserV2 = require('../models/MstUserV2');
const mongoose = require("mongoose")
const opts = {
    jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secretConfig
};

module.exports = passport => {
    passport.use(
        new jwtStrategy(opts, (jwt_payload, done) => {

            if(jwt_payload) done(null, jwt_payload)
        })
    )
};