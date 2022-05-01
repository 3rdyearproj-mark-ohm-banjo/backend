const express = require('express');
const bodyParser = require('body-parser');
// const path = require('path');
// const logger = require('morgan');
const api = require('./api/test');
const bSApi = require('./api/bookShelfApi');

const { notFound } = require('./common/middleware')
// const cors = require('cors')
//const multer = require('multer')
//const upload = multer()
const app = express();

app
// .use(cors())

// .use(logger('dev'))
.use(express.json())
//.use(upload.array())
// .use(bodyParser.json())
// .use(bodyParser.urlencoded({
//     extended:true
// }))

.use('/api/bookShelf', bSApi)
.use('/api/book', api)

.use(notFound)

module.exports = app;