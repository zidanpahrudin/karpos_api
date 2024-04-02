const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');

let total_time = 0;
let session_id = [];
let customer = [];
let index = 0;
const dataArray = [];
let session_id_before = [];
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: '103.187.146.17',
    user: 'userwa',
    password: '123456',
    database: 'whatsapp_server',
});

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + connection.threadId);
});

connection.query('SELECT name FROM device WHERE status="AUTHENTICATED"', function (error, results, fields) {
    if (error) throw error;
    // connected!
    results.forEach(result => {
        session_id.push(result.name);
    });
});

const connection2 = mysql.createConnection({
    host: 'apps.viriya.net.id',
    user: 'root',
    password: 'Viriyasuryaabadi2021?!',
    database: 'db_isp',
});

connection2.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + connection2.threadId);
});

function delayLog(item, timeout) {
    return new Promise((resolve) => {

        const indonesianPhoneRegex = /^(\+62|0)[2-9]\d{7,11}$/;
        function validateIndonesianPhoneNumber(input) {
            return indonesianPhoneRegex.test(input);
        }


        const date_now = new Date();
        const year = date_now.getFullYear();
        const month = ('0' + (date_now.getMonth() + 1)).slice(-2);
        const day = ('0' + date_now.getDate()).slice(-2);
        const hours = ('0' + date_now.getHours()).slice(-2);
        const minutes = ('0' + date_now.getMinutes()).slice(-2);
        const seconds = ('0' + date_now.getSeconds()).slice(-2);

        // Construct formatted date string
        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        // update invoice
        // connection2.query(`UPDATE tr_invoice SET is_send = '1', send_time = '${formattedDate}' WHERE inv_id = '${item.inv_id}'`,
        //     function (error, results, fields) {
        //         if (error) throw error;
        //     });
        function randomNumber(min, max) {
            return Math.random() * (max - min) + min;
        }
        const timeoutRange = Math.ceil(randomNumber(8, 15) * 1000); // Convert seconds to milliseconds
        setTimeout(() => {

            function formatRupiah(number) {
                return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }

            function formatTanggal(tanggal) {
                const date_now = new Date(tanggal.toString());
                const year = date_now.getFullYear();
                const month = ('0' + (date_now.getMonth() + 1)).slice(-2);
                const day = ('0' + date_now.getDate()).slice(-2);
                return `${day}-${month}-${year}`
            }

            const template_pesan = [
                "Pelanggan Yth, tagihan PT Viriya Surya Abadi Anda dengan nama pelanggan " + item.customer_name + " akan segera jatuh tempo pada tanggal " + formatTanggal(item.inv_date) + " . Segera lakukan pembayaran tagihan sebesar Rp " + formatRupiah(item.total) + " agar koneksi internet Anda tidak terhenti. Terima kasih.",
                "Pelanggan " + item.customer_name + " tagihan PT Viriya Surya Abadi Anda dengan nama pelanggan " + item.customer_name + " akan segera jatuh tempo pada tanggal " + formatTanggal(item.inv_date) + " . Segera lakukan pembayaran tagihan sebesar Rp " + formatRupiah(item.total) + " agar koneksi internet Anda tidak terhenti. Terima kasih.",
                "Customer Yth, tagihan PT Viriya Surya Abadi Anda dengan nama pelanggan " + item.customer_name + "akan segera jatuh tempo pada tanggal " + formatTanggal(item.inv_date) + " . Segera lakukan pembayaran tagihan sebesar Rp " + formatRupiah(item.total) + " agar koneksi internet Anda tidak terhenti. Terima kasih.",
                "Pelanggan " + item.customer_name + " Mohon segera melakukan pembayaran tagihan sebesar Rp {jumlah_invoice} agar koneksi internet Anda tidak terhenti. Terima kasih.",
                "Yth " + item.customer_name + " Mohon segera melakukan pembayaran tagihan sebesar Rp {jumlah_invoice} agar koneksi internet Anda tidak terhenti. Terima kasih.",
                "Customer " + item.customer_name + " tagihan PT Viriya Surya Abadi Anda dengan nama pelanggan " + item.customer_name + " akan segera jatuh tempo pada tanggal " + formatTanggal(item.inv_date) + " . Segera lakukan pembayaran tagihan sebesar Rp " + formatRupiah(item.total) + " agar koneksi internet Anda tidak terhenti. Terima kasih.",
                "Pelanggan " + item.customer_name + " Yth, Mohon segera melakukan pembayaran tagihan sebesar Rp " + formatRupiah(item.total) + " agar koneksi internet Anda tidak terhenti. Terima kasih.",
                "Yth Pelanggan " + item.customer_name + " Mohon segera melakukan pembayaran tagihan sebesar Rp " + formatRupiah(item.total) + " agar koneksi internet Anda tidak terhenti. Terima kasih."
            ]

            let session_valid = "";
            let randomIndex = Math.floor(Math.random() * template_pesan.length);

            if (session_id.length > 0) {
                if (typeof session_id_before.currentIndex === 'undefined') {
                    session_id_before.currentIndex = 0;
                }
            
                session_valid = session_id[session_id_before.currentIndex];
                
                session_id_before.currentIndex++; 
                if (session_id_before.currentIndex >= session_id.length) {
                    session_id_before.currentIndex = 0;
                }
            } else {
                session_valid = null;
            }

            
            const formatedPhone = item.nomor.replaceAll("-", "");
            console.log(formatedPhone)
            
            if (validateIndonesianPhoneNumber(formatedPhone)) {
                let valid_format_phone = "";
                let phone_number = formatedPhone;
                if (phone_number.startsWith("0")) {
                    valid_format_phone = "62" + phone_number.slice(1);
                } else {
                    valid_format_phone = phone_number;
                }
                console.log(valid_format_phone)
                let data = JSON.stringify({
                    "jid": valid_format_phone + "@s.whatsapp.net",  // "jid": "628950xxxxx-1631xxxx@g.us", //item.nomor //"6287781382993"+"@s.whatsapp.net"
                    "type": "number",
                    "message": {
                        "text": template_pesan[randomIndex]
                    }
                });
                console.log(data)
                // let config = {
                //     method: 'post',
                //     maxBodyLength: Infinity,
                //     url: 'http://103.187.146.17:3001/wa_laravel/api/' + session_valid + '/messages/send',
                //     headers: {
                //         'Content-Type': 'application/json'
                //     },
                //     data: data
                // };
    
                // axios.request(config)
                //     .then((response) => {
                //         console.log(JSON.stringify(response.data));
                //     })
                //     .catch((error) => {
                //         console.log(error);
                //     });
            }


            resolve();
        }, timeoutRange);

    });
}

async function sliceArrayWithInterval(arr, timeout) {
    const sliceAsync = async () => {
        for (const item of arr) {
            await delayLog(item, timeout);
            // await new Promise((resolve) => setTimeout(resolve, timeout)); // Introduce delay
        }
    };

    // Run sliceAsync in the background
    setTimeout(sliceAsync, 0);

    // Return immediately
    return 'Processing started in the background';
}

router.post('/', async (req, res) => {
    try {
        const { data, date_send, interval_time } = req.body;

        // if (!data) {
        //     return res.status(400).json({
        //         status: 'failed',
        //         message: 'Data is required',
        //         data: [],
        //     });
        // }

        const intervalTime = interval_time || 5000;

        

        // Execute the database query to fetch invoice data
        connection2.query(`SELECT a.*,b.phone_1,b.customer_name FROM tr_invoice a LEFT JOIN mt_customer b ON a.customer_id=b.customer_id WHERE a.inv_date="${date_send}" AND (a.is_send IS NULL OR a.is_send='0') AND a.inv_status='Waiting Payment'`, function (error, results, fields) {
            if (error) throw error;

            // Process the results and populate dataArray with valid phone numbers
            // console.log(results)
            results.forEach(result => {
                index += 1;
                dataArray.push({
                    inv_id: result.inv_id,
                    customer_name: result.customer_name,
                    nomor: result.phone_1,
                    inv_no: result.inv_no,
                    total: result.total,
                    inv_date: result.inv_date,
                    pesan: "",
                    index: index,
                });
            });
            // Once dataArray is populated, start processing it with interval
            sliceArrayWithInterval(dataArray, intervalTime)
                .then(() => {
                    res.json({
                        status: 'success',
                        message: 'Arrays are being sliced with intervals',
                        data: [],
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        status: 'failed',
                        message: 'Error processing arrays: ' + err.message,
                        data: [],
                    });
                });
        });
    } catch (err) {
        res.status(500).json({
            status: 'failed',
            message: 'Server error: ' + err.message,
            data: [],
        });
    }
});

module.exports = router;