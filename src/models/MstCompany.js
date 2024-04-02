const { Schema, model, createConnection } = require('mongoose');
const dotenv = require('dotenv');
const config = require('config');
const db_users = process.env.database_User;

// const connectionUser = createConnection(db_users, { maxPoolSize: 10 });

const MstCompanySchema = new Schema({
    pt_name: {
        type: String
    },
    is_active: {
        type: Number
    },
    npwp: {
        type: String
    },
    address: {
        type: String
    },
    url: {
        type: String
    },
    logo: {
        type: String
    },
    db_connection: {
        type: String
    },
    rekening: [
        {
            is_select: {
                type: Number
            },
            is_active: {
                type: Number
            },
            rek_name: {
                type: String
            },
            rek_no: {
                type: String
            }
        }
    ],
    tautan: {
        type: String,
        default: "/web/images/company"
    }
},
    { collection: 'mst_company', timestamps: true }
);

MstCompanySchema.index({ is_active: 1 });

dotenv.config();

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

const encodedPassword = encodeURIComponent(MONGODB_PASSWORD);
let con = "";
if(ENVIRONMENT === "local") {
    conn = createConnection(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}`);
} 
else {
    conn = createConnection(`mongodb://${MONGODB_USERNAME}:${encodedPassword}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=${MONGODB_AUTH_SOURCE}`);
}

module.exports = MstCompany = conn.model('mst_company', MstCompanySchema);