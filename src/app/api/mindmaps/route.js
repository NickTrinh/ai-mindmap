import connectDB from '../../lib/mongoose';
import MindMap from '../../models/MindMap';

export async function GET() {
  try {
    await connectDB();

    const mindMaps = await MindMap.find()
      .select('title nodes')
      .sort('-createdAt');

    return Response.json(
      mindMaps.map(map => ({
        id: map._id.toString(),
        title: map.title,
        nodeCount: map.nodes.length,
      }))
    );
  } catch (error) {
    console.error('Error fetching mind maps:', error);
    return Response.json(
      { error: 'Failed to fetch mind maps' },
      { status: 500 }
    );
  }
}
