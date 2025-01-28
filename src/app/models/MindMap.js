import mongoose from 'mongoose';

const nodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  parentId: {
    type: String,
    default: null,
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  style: {
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#000000' },
    fontSize: { type: Number, default: 14 },
  },
});

const mindMapSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  nodes: [nodeSchema],
  theme: {
    type: String,
    default: 'default',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

mindMapSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const MindMap =
  mongoose.models.MindMap || mongoose.model('MindMap', mindMapSchema);

export default MindMap;
