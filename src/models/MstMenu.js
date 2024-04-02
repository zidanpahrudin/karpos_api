const { Schema, model, createConnection } = require('mongoose');

const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const MstMenuSchema = new Schema({
    menu_name: {
        type: String
    },
    url: {
        type: String
    },
    icon: {
        type: String
    },
    menu_group: {
        type: String
    },
    no: {
        type: Number
    },
    is_active: {
        type: Number
    }

},
    { collection: 'mst_menu', timestamps: true }
);

module.exports = (conn) => {
   
    return conn.model('mst_menu', MstMenuSchema);
}