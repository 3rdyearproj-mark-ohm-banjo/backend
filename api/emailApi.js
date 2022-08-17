const express = require("express");
const router = express.Router();
const nodemailer = require('nodemailer');

router
    .get('/sendemail', async (req, res) => {
        try {
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
            // เริ่มทำการส่งอีเมล
            let info = await transporter.sendMail({
                from: 'sharedmybook <no-reply@sharedmybook.ddns.net>',   // ผู้ส่ง
                to: "punthanat07@gmail.com>",// ผู้รับemail
                subject: "test",                      // หัวข้อ
                text: "test",                         // ข้อความ
                html: "<b>test ครับ</b>"


            })
            console.log('Message sent: %s', info.messageId);
            res.status(200).json({ success: true })

        } catch (error) {
            // console.log("--error catch--")
            errorRes(res, error, error.message, error.code ?? 400);
        }
    })







module.exports = router