const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');

const MstUserSchema = new Schema({
    name: {
        type: String
    },
    username: {
        type: String
    },
    company_id: {
        type: ObjectId
    },
    level_user: {
        type: Number
    },
    password: {
        type: String
    },
    is_active: {
        type: Number
    },
    pic_input: {
        type: String
    },
    input_time: {
        type: Date,
        default: localDate
    },
    url: {
        type: String
    },
    pic_edit: {
        type: String
    },
    edit_time: {
        type: Date,
        default: localDate
    }

},
    { collection: 'mst_user', timestamps: true }
);

MstUserSchema.pre('save', function(next) {
    const user = this;

    if(!user.isModified('password')) return next();

    bcrypt.genSalt(10, function(err, salt) {
        if(err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if(err) return next(err);

            user.password = hash;
            next();
        })
    })
});

MstUserSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

MstUserSchema.methods.generateJWT = function() {
    const today = new Date();
    const expirationDate = new Date(today);

    expirationDate.setDate(today.getDate() + 60);

    let payload = {
        id: this._id,
        level_user: this.level_user
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: parseInt(expirationDate.getTime() / 1000, 10)
    })

};


module.exports = (conn) => {
   
    return conn.model('mst_user', MstUserSchema);
}
