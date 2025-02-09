import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import MindMap from '@/app/models/MindMap';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const importData = await request.json();

    const mindMap = await MindMap.findByIdAndUpdate(
      id,
      {
        $set: {
          title: importData.title,
          nodes: importData.nodes.map(node => ({
            id: node.id,
            content: node.data.label,
            type: node.type,
            parentId: node.parentNode,
            position: node.position,
          })),
        },
      },
      { new: true }
    );

    if (!mindMap) {
      return NextResponse.json(
        { error: 'Mind map not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, mindMap });
  } catch (error) {
    console.error('Error importing mindmap:', error);
    return NextResponse.json(
      { error: 'Failed to import mindmap' },
      { status: 500 }
    );
  }
}
