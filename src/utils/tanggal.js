const moment = require("moment");
const config = require("config");
// Function for Date Local Jakarta
const tanggal = (string) => {
    let hari;
    let angka = moment(string).isoWeekday();
    let date = moment(string).format('D MMM YYYY');
    if(angka === 1){
        hari = 'Senin';
    }else if(angka === 2){
        hari = 'Selasa';
    }else if(angka === 3){
        hari = 'Rabu';
    }else if(angka === 4){
        hari = 'Kamis';
    }else if(angka === 5){
        hari = 'Jumat';
    }else if(angka === 6){
        hari = 'Sabtu';
    }else if(angka === 7){
        hari = 'Minggu';
    }

    return hari + ', ' + date;
};
// Exporting Function
module.exports = tanggal;
