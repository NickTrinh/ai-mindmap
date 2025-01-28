import connectDB from '../../lib/mongoose';
import MindMap from '../../models/MindMap';

export async function GET() {
  try {
    await connectDB();
    const mindMaps = await MindMap.find({}).sort({ createdAt: -1 });
    return Response.json(mindMaps);
  } catch (error) {
    console.error('Error fetching mind maps:', error);
    return Response.json(
      { error: 'Failed to fetch mind maps' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    await connectDB();

    const mindMap = new MindMap({
      title: data.title,
      nodes: data.nodes,
    });

    await mindMap.save();
    return Response.json(mindMap);
  } catch (error) {
    console.error('Error creating mind map:', error);
    return Response.json(
      { error: 'Failed to create mind map' },
      { status: 500 }
    );
  }
}
