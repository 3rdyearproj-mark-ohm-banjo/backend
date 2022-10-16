const server = require('./app')
const mongoose = require('mongoose') 
const config = require('config')
const DB_CONFIG = config.get('DB_CONFIG')
const PORT = config.get('PORT') || 5000

mongoose.connect(DB_CONFIG.DB_URI, { useNewUrlParser: true }) // ส่วนนี้เป็น Option ถ้าไม่ใส่จะ warning ว่าการ connect mongodb ด้วย url แบบ string ในอนาคตจะ depreacated แล้ว (ซึ่งไม่ใส่ก็ได้ แต่จะมี warning แค่นั้น)


server.listen(PORT, () => {
  console.log(
    `Start server at port ${PORT}. with mode: ${process.env.NODE_ENV}`
  )
})
