import MindMap from '@/app/models/MindMap';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id } = req.query;
    const { nodes, edges } = req.body;

    try {
      const mindMap = await MindMap.findById(id);
      mindMap.nodes = nodes;
      mindMap.edges = edges;
      await mindMap.save();
      res.status(200).json({ message: 'Mind map saved successfully' });
    } catch (error) {
      console.error('Error saving mind map:', error);
      res.status(500).json({ error: 'Failed to save mind map' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
