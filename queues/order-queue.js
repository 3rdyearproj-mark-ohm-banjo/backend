const Queue = require('bull')
const {ordersProcess} = require('./orders-queue-consumer')

const orderQueue = new Queue("orderReportNotConfirmReceive",{redis:'redis://localhost:6379'})//defalut redis url

orderQueue.process(ordersProcess)

const createNewOrder = (order) => {
    orderQueue.add(order,
        { delay: 1000 * 60  
        }
        //14 * 1000 * 60 * 60 * 24
    )
}// is promise function ?
module.exports = {createNewOrder, orderQueue}