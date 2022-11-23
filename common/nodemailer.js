const nodemailer = require('nodemailer')
const config = require('config')
const frontendUrl = config.get('FRONT_END_URL')
const UserModel = require('../models/user')
const {
  container,
  title,
  description,
  contact,
  footer,
  warning,
  button,
  contentWrapper,
} = require('./mailStyle')

function mapContent(payload, method, bookShelf, queuePosition, data, hashId) {
  const webLink =frontendUrl
  const contactMail = 'sharemybook.sit2@gmail.com'
  switch (method) {
    case 'sendConfirm':
      return [
        'ยืนยันการส่ง',
        `
        <div style="${contentWrapper}">
        <div style="${container}">
        <h2 style="${title}">คุณได้ยืนยันการส่งหนังสือ ${bookShelf.bookName} เรียบร้อยแล้ว</h2>
        <p style="${description}">ขอบคุณที่ร่วมเป็นแบ่งปันหนังสือของเราเพื่อส่งต่อให้กับผู้อื่นได้นำไปใช้ประโยชน์เพิ่มเติมต่อไป :)<br />
        <div style="${contact}">หากมีข้อสงสัยติดต่อเราได้ที่ ${contactMail}</div>
        <footer style="${footer}">Share my Book</footer>
        </div>
        </div>
        `,
      ]
    case 'receive':
      return [
        'เตรียมตัวรับหนังสือ',
        `
        <div style="${contentWrapper}">
        <div style="${container}">
        <h2 style="${title}">หนังสือ: ${bookShelf.bookName} ที่คุณได้ทำการขอยืมถูกจัดส่งเรียบร้อยแล้ว เตรียมตัวรับหนังสือได้เลยครับ</h2>
        <p style="${description}">หนังสือ ${bookShelf.bookName} ที่คุณได้ทำการขอยืมได้ถูกจัดส่งเรียบร้อยแล้ว<br />
        <span style="${warning}">**เมื่อได้รับหนังสือแล้ว อย่าลืมกดยืนยันว่าคุณได้รับหนังสือแล้วด้วยนะ เพื่อให้พวกเราทราบว่าคุณได้รับหนังสือแล้ว</span></p>
        <a href="${webLink}/profile/bookrequest"  style="${button}">ไปที่เว็บไซต์</a>
        <div style="${contact}">หากมีข้อสงสัยติดต่อเราได้ที่ ${contactMail}</div>
        <footer style="${footer}">Share my Book</footer>
        </div>
        </div>`,
      ]
    case 'inQueue':
      return [
        'กำลังอยู่ในคิว',
        `
        <div style="${contentWrapper}">
        <div style="${container}">
        <h2 style="${title}">คุณได้เข้าคิวเพื่อรอยืมหนังสือ:  ${
          bookShelf.bookName
        } เรียบร้อยแล้ว</h2>
        <p style="${description}">ขณะนี้คุณอยู่คิวที่ ${
          queuePosition + 1
        } ของการยืมหนังสือนี้<br />
        <span style="${warning}">**เมื่อหนังสือที่คุณเข้าคิวถูกจัดส่งแล้วเราจะทำการแจ้งเตือนให้คุณทราบอีกครั้ง</span></p>
        <a href="${webLink}/profile/bookrequest" style="${button}">ไปที่เว็บไซต์</a>
        <div style="${contact}">หากมีข้อสงสัยติดต่อเราได้ที่ ${contactMail}</div>
        <footer style="${footer}">Share my Book</footer>
        </div>
        </div>`,
      ]
    case 'getQueue':
      return [
        'มีคิวที่รออยู่',
        `
        <div style="${contentWrapper}">
        <div style="${container}">
        <h2 style="${title}">ขณะนี้มีคนสนใจยืมหนังสือเรื่อง  ${bookShelf.bookName} ต่อจากคุณ สามารถตรวจสอบสถานะได้จากเว็บไซต์</h2>
        <p style="${description}">ขณะนี้หนังสือที่คุณขอยืมอยู่มีผู้ที่สนใจมายืมต่อจากคุณแล้ว<br />
        <span style="${warning}">**เมื่อคุณทำการส่งหนังสือเรียบร้อยแล้ว โปรดกดปุ่ม ยืนยันการส่งผ่านเว็บไซต์ เพื่อแจ้งให้ผู้ที่รอหนังสือทราบ</span></p>
        <a href="${webLink}/profile/forwarding" style="${button}">ไปที่เว็บไซต์</a>
        <div style="${contact}">หากมีข้อสงสัยติดต่อเราได้ที่ ${contactMail}</div>
        <footer style="${footer}">Share my Book</footer>
        </div>
        </div>
        `,
      ]
    case 'AdminSendAddressToReporter':
      return [
        'ส่่งหนังสือที่ไม่สามารถอ่านได้มาที่adminคนนี้',
        `
          <div style="${contentWrapper}">
          <div style="${container}">
          <h2 style="${title}">ขณะนี้มีแอดมินมารับเรื่องเรียบร้อยแล้วโปรดส่งหนังสือ: ${bookShelf.bookName}   มาตามที่อยู่ที่กำหนด  </h2>
          <p style="${description}">ที่อยู่:${data.address}<br />
          <span style="${warning}">**ส่งตามที่อยู่ในเมล</span></p>
          <div style="${contact}">หากมีข้อสงสัยติดต่อเราได้ที่ ${contactMail}</div>
          <footer style="${footer}">Share my Book</footer>
          </div>
          </div>
          `,
      ]
    case 'forgotPassword':
      return [
        'คุณมีคำขอเปลี่ยนรหัสผ่าน',
        `
        <div style="${contentWrapper}">
        <div style="${container}">
        <h2 style="${title}">คุณได้มีคำขอเปลี่ยนรหัสผ่าน</h2>
        <p style="${description}">คลิกที่ปุ่มด้านล่างเพื่อทำการเปลี่ยนรหัสผ่านของคุณ</p><br />
        <a href="${
          webLink + '/resetpassword/' + payload?.hashId
        }" style="${button}">เปลี่ยนรหัสผ่าน</a>
        <div style="${contact}">หากมีข้อสงสัยติดต่อเราได้ที่ ${contactMail}</div>
        <footer style="${footer}">Share my Book</footer>
        </div>
        </div>
            `,
      ]
    case 'verifyEmail':
      return [
        'คุณได้ส่งคำยืนยันอีเมลสำหรับบัญชีของคุณ',
        `
        <div style="${contentWrapper}">
        <div style="${container}">
        <h2 style="${title}">ยืนยันอีเมลของคุณ เพื่อใช้งานระบบ</h2>
        <p style="${description}">ยืนยันอีเมลเพื่อทำการใช้งานระบบยืมและบริจาค</p><br />
        <a href="${
          webLink + '/verifyemail/' + payload?.hashId
        }" style="${button}">ยืนยันอีเมล</a>
        <div style="${contact}">หากมีข้อสงสัยติดต่อเราได้ที่ ${contactMail}</div>
        <footer style="${footer}">Share my Book</footer>
        </div>
        </div>
            `,
      ]
    default:
      return [
        'ทำรายการไม่สำเร็จ',
        `
        <div style="${contentWrapper}">
        <div style="${container}">
        <h2 style="${title}">เกิดข้อผิดพลาด</h2>
        <p style="${description}">ทำรายการไม่สำเร็จ</p><br />
        <a href="${webLink}" style="${button}">ไปที่เว็บไซต์</a>
        <div style="${contact}">หากมีข้อสงสัยติดต่อเราได้ที่ ${contactMail}</div>
        <footer style="${footer}">Share my Book</footer>
        </div>
        </div>`,
      ]
  }
}

async function sendMail(payload, method, bookShelf, queuePosition, data = '') {
  const methodArray = mapContent(
    payload,
    method,
    bookShelf,
    queuePosition ?? 0,
    data,
  )

  // สร้างออปเจ็ค transporter เพื่อกำหนดการเชื่อมต่อ SMTP และใช้ตอนส่งเมล
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      // ข้อมูลการเข้าสู่ระบบ ผู้ส่งemail
      user: 'sharemybook.sit2@gmail.com', //email user ของเรา
      pass: 'nvxgqvyasouvatef', // Gen app password
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
    from: 'no-reply-sharemybook <no-reply@sharemybook.ddns.net>', // ผู้ส่ง
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
