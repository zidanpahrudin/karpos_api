const { createConnection } = require("mongoose");
const dotenv = require('dotenv');
// Connection manager to handle multi-tenant connections
dotenv.config();

class ConnectionManager {
    
    constructor() {
        this.connections = new Map();
    }

    getConnection(tenantId) {
        if (this.connections.has(tenantId)) {
            return this.connections.get(tenantId);
        }

        
        // Construct MongoDB connection string
        const {
            MONGODB_USERNAME,
            MONGODB_PASSWORD,
            MONGODB_HOST,
            MONGODB_PORT,
            MONGODB_AUTH_SOURCE,
            ENVIRONMENT
        } = process.env;
        const encodedPassword = encodeURIComponent(MONGODB_PASSWORD);
        let conn = "";
        if (ENVIRONMENT === "local") {
            conn = createConnection(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${tenantId}`);
        }
        else {
            conn = createConnection(`mongodb://${MONGODB_USERNAME}:${encodedPassword}@${MONGODB_HOST}:${MONGODB_PORT}/${tenantId}?authSource=${MONGODB_AUTH_SOURCE}`);
        }

        // Cache the connection for future use
        this.connections.set(tenantId, conn);
        return conn;
    }

    closeConnection(tenantId) {
        if (this.connections.has(tenantId)) {
            const conn = this.connections.get(tenantId);
            conn.close();
            this.connections.delete(tenantId);
        }
    }
}

module.exports = new ConnectionManager();