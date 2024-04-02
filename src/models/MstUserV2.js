const { Schema, model, createConnection } = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const db_users = process.env.database_User;
const Company = require("./MstCompany");
// const connectionUser = createConnection(db_users, { maxPoolSize: 10 });
const decryptString = require("../utils/decryptString")


const MstUserSchemav2 = new Schema({
    name: {
        type: String
    },
    username: {
        type: String,
        unique: true,
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
    company_id: {
        type: ObjectId
    },
    pic_edit: {
        type: String
    },
    edit_time: {
        type: Date,
        default: localDate
    }

},
    { collection: 'user', timestamps: true }
);

MstUserSchemav2.index({ is_active: 1, username: 1 });

MstUserSchemav2.pre('save', function(next) {
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

MstUserSchemav2.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

MstUserSchemav2.methods.generateJWT = async function() {
    const today = new Date();
    const expirationDate = new Date(today);

    expirationDate.setDate(today.getDate() + 60);
    const company = await Company.findOne({is_active: 1, _id: this.company_id}, {db_connection: 1}).lean();
    console.log("company")
    console.log(company)
    let databaseConnection = "";
    if(company) databaseConnection = decryptString(company.db_connection)
    
    let payload = {
        id: this._id,
        level_user: this.level_user,
        company_id: company._id,
        database_connection: databaseConnection,
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: parseInt(expirationDate.getTime() / 1000, 10)
    })

};


// Construct MongoDB connection string
const { 
    MONGODB_USERNAME, 
    MONGODB_PASSWORD, 
    MONGODB_HOST, 
    MONGODB_PORT, 
    MONGODB_DATABASE, 
    MONGODB_AUTH_SOURCE,
    ENVIRONMENT
} = process.env;

let conn = "";
if(ENVIRONMENT === "local") {
    conn = createConnection(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`);
} 
else {
    const encodedPassword = encodeURIComponent(MONGODB_PASSWORD);
    conn = createConnection(`mongodb://${MONGODB_USERNAME}:${encodedPassword}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=${MONGODB_AUTH_SOURCE}`);
}


module.exports = MstUser = conn.model('mst_user', MstUserSchemav2);