const { Schema, model, createConnection } = require('mongoose');
const mongoose = require('mongoose');
const localDate = require('../middleware/localDate');
const ObjectId = Schema.ObjectId;
const Double = Schema.Types.Double;
const MstMenuPermissionSchema = new Schema({
    user_id: {
        type: ObjectId
    },
    menu_id: {
        type: ObjectId
    }

},
    { collection: 'mst_menu_permission', timestamps: true }
);

module.exports = (conn) => {
    
    return conn.model('mst_menu_permission', MstMenuPermissionSchema);
}