const app = require('./app')
const mongoose = require('mongoose') // อาจเกิด error
const config = require('config')
const DB_CONFIG = config.get('DB_CONFIG')
const PORT = config.get('PORT')

mongoose.connect(DB_CONFIG.DB_URI, { useNewUrlParser: true }) // ส่วนนี้เป็น Option ถ้าไม่ใส่จะ warning ว่าการ connect mongodb ด้วย url แบบ string ในอนาคตจะ depreacated แล้ว (ซึ่งไม่ใส่ก็ได้ แต่จะมี warning แค่นั้น)
PORT = PORT || 5000

app.listen(PORT, () => {
  console.log(
    `Start server at port ${PORT}. with mode: ${process.env.NODE_ENV}`
  )
})
