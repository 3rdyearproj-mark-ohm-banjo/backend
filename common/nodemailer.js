const nodemailer = require('nodemailer')
const UserModel = require('../models/user')

function mapContent(username, method) {
  switch (method) {
    case 'sendConfirm':
      return [
        'ยืนยันการส่ง',
        `<b>คุณ ${username} ได้ทำการยืนยันการส่งแล้ว</b><br /><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>`,
      ]
    case 'receive':
      return [
        'เตรียมตัวรับหนังสือ',
        `<b>ผู้ส่งยืนยันที่จะส่งหาคุณ ${username} แล้ว เตรียมตัวรับหนังสือได้เลยครับ</b><br /><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>`,
      ]
    case 'inQueue':
      return [
        'กำลังอยู่ในคิว',
        `<b>ขณะนี้คุณ ${username} กำลังอยู่ในคิว สามารถตรวจสอบสถานะได้จากเว็บไซต์</b><br /><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>`,
      ]
    case 'getQueue':
      return [
        'มีคิวที่รออยู่',
        `<b>ขณะนี้คุณ ${username} มีคิวที่รอให้คุณส่งหนังสืออยู่ สามารถตรวจสอบสถานะได้จากเว็บไซต์</b><br /><b>โปรดอย่าตอบกลับ email ฉบับนี้</b>`,
      ]
    default:
      return [
        'ทำรายการไม่สำเร็จ',
        `<b>ทำรายการไม่สำเร็จโปรดติดต่อเจ้าหน้าที่</b>`,
      ]
  }
}

async function sendMail(payload, method) {
  const userdata = await UserModel.find({email: payload.email})
  const methodArray = mapContent(userdata[0].username, method)

  // สร้างออปเจ็ค transporter เพื่อกำหนดการเชื่อมต่อ SMTP และใช้ตอนส่งเมล
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      // ข้อมูลการเข้าสู่ระบบ ผู้ส่งemail
      user: 'punthanat.banjo@mail.kmutt.ac.th', //email user ของเรา
      pass: '@Banjo0709', // email password
    },
  })
  // console.log(userdata)
  //   if (method == 'sendConfirm') {
  //     methodArray = sendConfirm
  //   } else if (method == 'receive') {
  //     methodArray = receive
  //   } else if (method == 'inQueue') {
  //     methodArray = inQueue
  //   } else if (method == 'getQueue') {
  //     methodArray = getQueue
  //   } else {
  //     methodArray = errorEmail
  //   }
  // เริ่มทำการส่งอีเมล ได้ทั้ง gmail และ hotmail แต่เหมือน gmail จะดูง่ายกว่า
  transporter.sendMail({
    from: 'sharedmybook <no-reply@sharedmybook.ddns.net>', // ผู้ส่ง
    to: payload.email, // ผู้รับemail
    subject: methodArray[0], // หัวข้อ
    html: methodArray[1],
  })
  // console.log('Message sent: %s', info.messageId);
  // console.log('methodArray: ', methodArray);
  // console.log('sendConfirm: ', errorEmail);
}

module.exports = {
  sendMail,
}
