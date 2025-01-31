import connectDB from '../../../lib/mongoose';
import MindMap from '../../../models/MindMap';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const mindMap = await MindMap.findById(id);

    if (!mindMap) {
      return Response.json({ error: 'Mind map not found' }, { status: 404 });
    }

    return Response.json(mindMap);
  } catch (error) {
    console.error('Error fetching mind map:', error);
    return Response.json(
      { error: 'Failed to fetch mind map' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const updates = await request.json();

    const mindMap = await MindMap.findByIdAndUpdate(
      params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!mindMap) {
      return Response.json({ error: 'Mind map not found' }, { status: 404 });
    }

    return Response.json(mindMap);
  } catch (error) {
    console.error('Error updating mind map:', error);
    return Response.json(
      { error: 'Failed to update mind map' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const result = await MindMap.findByIdAndDelete(id);

    if (!result) {
      return Response.json({ error: 'Mind map not found' }, { status: 404 });
    }

    return Response.json({ message: 'Mind map deleted' });
  } catch (error) {
    console.error('Error deleting mind map:', error);
    return Response.json(
      { error: 'Failed to delete mind map' },
      { status: 500 }
    );
  }
}
