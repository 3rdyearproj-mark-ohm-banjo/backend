const Queue = require('bull')
const config = require('config')

const {ordersProcess} = require('./orders-queue-consumer')
const REDIS_URL = config.get('REDIS_URL')

// const orderQueue = new Queue("orderReportNotConfirmReceive",{redis:REDIS_URL})//defalut redis url
// const orderQueue = new Queue("orderReportNotConfirmReceive",{redis:{ host: '127.0.0.1', port: 6379 }})//defalut redis url
const orderQueue = new Queue("orderReportNotConfirmReceive",'redis://127.0.0.1:6379')//defalut redis url

orderQueue.process(ordersProcess)

const createNewOrder = (order) => {
    orderQueue.add(order,
        { delay: 1000 * 60  
        }
        //14 * 1000 * 60 * 60 * 24
    )
}// is promise function ?
module.exports = {createNewOrder, orderQueue}