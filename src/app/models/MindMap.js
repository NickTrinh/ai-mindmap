import mongoose from 'mongoose';

const nodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  content: {
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
});

const mindMapSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  nodes: [nodeSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MindMap =
  mongoose.models.MindMap || mongoose.model('MindMap', mindMapSchema);

export default MindMap;
