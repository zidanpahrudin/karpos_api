const config = require("config");

// Function for Date Local Jakarta
const localDate = (string) => {
  var utc = new Date();

  //return utc.setHours(utc.getHours() + 7);
  return utc.setHours(parseFloat(utc.getHours()) + parseFloat(process.env.UTC));
};
// Exporting Function
module.exports = localDate;
