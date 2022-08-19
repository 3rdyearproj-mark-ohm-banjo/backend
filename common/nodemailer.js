const nodemailer = require('nodemailer');
const UserModel = require('../models/user')


async function sendMail(payload, method) {
    const userdata = await UserModel.find({ email: payload.email })
    let sendConfirm = ["ยืนยันการส่ง", `<b>คุณ ${userdata[0].username} ได้ทำการยืนยันการส่งแล้ว</b><br><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>`]
    let prepare = ["เตรียมตัวรับหนังสือ", `<b>ผู้ส่งยืนยันที่จะส่งหาคุณ ${userdata[0].username} แล้ว เตรียมตัวรับหนังสือได้เลยครับ</b><br><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>`]
    let inQueue = ["กำลังอยู่ในคิว", `<b>ขณะนี้คุณ ${userdata[0].username} กำลังอยู่ในคิว สามารถตรวจสอบสถานะได้จากเว็บไซต์</b><br><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>`]
    // let errorEmail = ["Error", `<b>Error from code, Sorry</b>`]
    let errorEmail = ["ทำรายการไม่สำเร็จ", `<b>ทำรายการไม่สำเร็จโปรดติดต่อเจ้าหน้าที่</b>`]
    let methodArray = []

    // สร้างออปเจ็ค transporter เพื่อกำหนดการเชื่อมต่อ SMTP และใช้ตอนส่งเมล
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {   // ข้อมูลการเข้าสู่ระบบ ผู้ส่งemail
            user: 'punthanat.banjo@mail.kmutt.ac.th', //email user ของเรา
            pass: '@Banjo0709',  // email password
        },
    });
    console.log(userdata)
    if (method == "sendConfirm") {
        methodArray = sendConfirm
    } else if (method == "prepare") {
        methodArray = prepare
    } else if (method == "inQueue") {
        methodArray = inQueue
    } else {
        methodArray = errorEmail
    }
    // เริ่มทำการส่งอีเมล ได้ทั้ง gmail และ hotmail แต่เหมือน gmail จะดูง่ายกว่า
    let info = await transporter.sendMail({
        from: 'sharedmybook <no-reply@sharedmybook.ddns.net>',   // ผู้ส่ง
        to: payload.email,// ผู้รับemail
        subject: methodArray[0],                      // หัวข้อ
        html: methodArray[1]

    })
    console.log('Message sent: %s', info.messageId);
    console.log('methodArray: ', methodArray);
    console.log('sendConfirm: ', errorEmail);
}


module.exports = {
    sendMail
}


