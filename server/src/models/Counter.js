const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

const Counter = mongoose.model('Counter', counterSchema);

const getNextSequence = async (name, prefix = '', padLength = 3) => {
  const counter = await Counter.findOneAndUpdate(
    { id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const formattedSeq = String(counter.seq).padStart(padLength, '0');
  return prefix ? `${prefix}-${formattedSeq}` : formattedSeq;
};

module.exports = {
  Counter,
  getNextSequence
};
