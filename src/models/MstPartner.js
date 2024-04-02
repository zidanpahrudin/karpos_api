const mongoose = require('mongoose');
const { Schema, model, createConnection } = require('mongoose');
require('mongoose-double')(mongoose);
const localDate = require('../middleware/localDate');
const SchemaTypes = mongoose.Schema.Types;
 const bcrypt = require("bcrypt");
 const jwt = require('jsonwebtoken');
const config = require('config');

const MstPartnerSchema = new Schema({
    partner_name: {
        type: String
    },
    phone: {
        type: String,
        unique: true,
    },
    password: {
        type: String
    },
    partner_pic: {
        type: String,
        default: ""
    },
    tautan: {
        type: String,
        default: ""
    },
    url_transaction: {
        type: String
    },
    level_user: {
        type: Number
    },
    is_active: {
        type: Number,
        default: 1
    }
},
    { collection: 'mst_partner', timestamps: true }
);

MstPartnerSchema.pre('save', function(next) {
    const partner = this;

    if(!partner.isModified('password')) return next();

    bcrypt.genSalt(10, function(err, salt) {
        if(err) return next(err);

        bcrypt.hash(partner.password, salt, function(err, hash) {
            if(err) return next(err);

            partner.password = hash;
            next();
        })
    })
});


MstPartnerSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

MstPartnerSchema.methods.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today);

    expirationDate.setDate(today.getDate() + 60);

    let payload = {
        id: this._id,
        level_user: this.level_user
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: parseInt(process.env.JWT_EXPIRED)
    })

};

module.exports = (conn) => {
   
    return conn.model('mst_partner', MstPartnerSchema);
}
