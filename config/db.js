const mongoose = require('mongoose');



module.exports = async function connectDB() {
const encodedPassword = encodeURIComponent("StdPwdDBPOSProd2023?!");
  try {
    await mongoose.connect(`mongodb://0.0.0.0:27017/db_user_pos_prod`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
}

