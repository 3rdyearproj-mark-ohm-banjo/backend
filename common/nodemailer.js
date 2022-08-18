const nodemailer = require('nodemailer');

let sendComfirm = "ยืนยันการส่ง <b>คุณได้ทำการยืนยันการส่งแล้ว</b><br><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>"
let prepare = "เตรียมตัวรับหนังสือ <b>ผู้ส่งยืนยันที่จะส่งแล้ว เตรียมตัวรับหนังสือได้เลยครับ</b><br><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>"
let inQueue = "กำลังอยู่ในคิว <b>ขณะนี้คุณกำลังอยู่ในคิว สามารถตรวจสอบสถานะได้จากเว็บไซต์</b><br><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>"


function sendMail(payload) {
    // let sendComfirm = "<b>คุณได้ทำการยืนยันการส่งแล้ว</b><br><b>โปรดอย่าตอบกลับ email นี้</b>"
    // สร้างออปเจ็ค transporter เพื่อกำหนดการเชื่อมต่อ SMTP และใช้ตอนส่งเมล
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        // host: "smtp.email.com",
        // service: 'hotmail',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {   // ข้อมูลการเข้าสู่ระบบ ผู้ส่งemail
            user: 'punthanat.banjo@mail.kmutt.ac.th', //email user ของเรา
            pass: '@Banjo0709',  // email password
        },
    });
    // เริ่มทำการส่งอีเมล ได้ทั้ง gmail และ hotmail แต่เหมือน gmail จะดูง่ายกว่า
    let info = await transporter.sendMail({
        from: 'sharedmybook <no-reply@sharedmybook.ddns.net>',   // ผู้ส่ง
        to: payload.email,// ผู้รับemail
        subject: "ยืนยันการส่ง",                      // หัวข้อ
        // text: "test11",                         // ข้อความ
        html: "<b>คุณได้ทำการยืนยันการส่งแล้ว</b><br><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>"


    })
}


module.exports = {
    sendMail
}


