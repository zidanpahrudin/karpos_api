const MongoStore = require('connect-mongo');

module.exports = {
    sessionConnect: MongoStore.create({
        // MongoDB connection options
        mongoUrl: 'mongodb+srv://zidan4:aKB6ayWB7ZE7trBQ@server-apps.tzwcg.mongodb.net/db_user_POS', // Replace with your MongoDB connection URI
        // collection: 'db_user_POS', // Name of the collection to store session data
    })
}