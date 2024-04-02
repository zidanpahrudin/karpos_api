const jwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const config = require('config');
const secretConfig = process.env.JWT_SECRET;
const User = require('../models/MstUser');
const UserV2 = require('../models/MstUserV2');


const opts = {
    jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secretConfig
};

module.exports = passport => {
    passport.use(
        new jwtStrategy(opts, (jwt_payload, done) => {
            UserV2.findById(jwt_payload.id)
            .then(user => {
                if(user) return done(null, user);
                return done(null, false);
            })
            .catch(err => {
                return done(err, false, {message: 'Server Error'})
            });
        })
    )
};