const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const bookShelfSchema = new Schema({
  _id: ObjectId,
  bookName: { type: String, required: true },
  ISBN: { type: String, required: true ,unique:true},
  author:{ type: String, required: true },
  imageCover:{ type: String, required: true},
  publisherId:{ type: ObjectId, ref: 'publishers' ,required: true } ,
  totalBorrow: { type: Number, required: true},// can count from book history  
  totalQuantity: { type: Number, required: true},// can count
  totalAvailable: { type: Number, required: true},//can count 
  types:[{type: ObjectId ,ref:'types' , required:true }],
  booksObjectId: [{type: ObjectId ,ref:'books' , required:true }], // add status to this 
  queues:{type:[ObjectId],ref:"queues"}
  // add queue filed 
});
// bookShelfSchema.path('ISBN').validate( (value,done) => {
//   this.model("bookShelf").count({ISBN: value}, function(err, count) {
//     if (err) return err;
//     return !count;
//   });
// }, 'ISBN already exists');
//const bookshelves = mongoose.model('bookshelves', bookShelfSchema );
module.exports = mongoose.model('bookshelves', bookShelfSchema );