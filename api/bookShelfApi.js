
   
const express = require('express')
const router = express.Router()
const { create, read, update, remove } = require('../common/crud')
const book = require('../models/book')
const type = require('../models/type')
const publisher = require('../models/publisher')
const bookShelf = require('../models/bookshelf')


//const { notOnlyMember, notFound } = require('../common/middleware')


router
// .get('/available/:lng/:lat/:page',
// 	nearBy({ available: true }),
// 	read(Restaurant, ['owner'])
// )

//.use(notOnlyMember)

.get('/', read(publisher))
.get('/bs', read(bookShelf,['publisherId','types']))
.post('/', create(book))
.post('/type', create(type))
.put('/:_id', update(book))
.delete('/:_id', remove(book))

module.exports = router
