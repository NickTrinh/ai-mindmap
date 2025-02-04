import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;
    const importData = await request.json();

    await db.collection('mindmaps').updateOne(
      { _id: id },
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
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error importing mindmap:', error);
    return NextResponse.json(
      { error: 'Failed to import mindmap' },
      { status: 500 }
    );
  }
}
