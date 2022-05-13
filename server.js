const app = require('./app')
const mongoose = require('mongoose') // อาจเกิด error
mongoose.connect(
  //'mongodb://thasuohm:AHG3KpdHlkBNgjhb@int365-shard-00-00.lufhw.mongodb.net:27017,int365-shard-00-01.lufhw.mongodb.net:27017,int365-shard-00-02.lufhw.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-mz4k34-shard-0&authSource=admin&retryWrites=true&w=majority',
  //'mongodb://localhost:27017/Share_My_Book',
  'mongodb://localhost:27017/test',
  {useNewUrlParser: true}
) // ส่วนนี้เป็น Option ถ้าไม่ใส่จะ warning ว่าการ connect mongodb ด้วย url แบบ string ในอนาคตจะ depreacated แล้ว (ซึ่งไม่ใส่ก็ได้ แต่จะมี warning แค่นั้น)
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Start server at port ${PORT}.`)
})

// const express = require('express')
// const app = express()

// app.get('/', (req, res) => {
//   res.send('Hello World')
// })

// app.listen(3000, () => {
//   console.log('Start server at port 3000.')
// })
