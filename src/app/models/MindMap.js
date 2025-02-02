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
  // Store position for manual arrangements
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  // Visual customization
  style: {
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#000000' },
    borderColor: { type: String, default: '#000000' },
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
  // Theme settings for the entire mind map
  theme: {
    backgroundColor: { type: String, default: '#ffffff' },
    connectionColor: { type: String, default: '#000000' },
    connectionStyle: { type: String, default: 'curved' }, // curved, straight, etc.
  },
});

const MindMap =
  mongoose.models.MindMap || mongoose.model('MindMap', mindMapSchema);

export default MindMap;
