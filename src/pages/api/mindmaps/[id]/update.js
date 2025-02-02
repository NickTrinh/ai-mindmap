import MindMap from '@/app/models/MindMap';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id } = req.query;
    const { nodeId, position, content, source, target } = req.body;

    try {
      const mindMap = await MindMap.findById(id);

      if (nodeId && position) {
        // Update node position
        const node = mindMap.nodes.find(n => n.id === nodeId);
        node.position = position;
      } else if (nodeId && content) {
        // Update node content
        const node = mindMap.nodes.find(n => n.id === nodeId);
        node.content = content;
      } else if (source && target) {
        // Create new edge
        mindMap.nodes.push({ source, target });
      }

      await mindMap.save();
      res.status(200).json({ message: 'Mind map updated successfully' });
    } catch (error) {
      console.error('Error updating mind map:', error);
      res.status(500).json({ error: 'Failed to update mind map' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
