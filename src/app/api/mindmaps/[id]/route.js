import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import MindMap from '@/app/models/MindMap';

export async function GET(request) {
  const id = request.nextUrl.pathname.split('/').pop();

  try {
    await connectDB();
    const mindMap = await MindMap.findById(id);

    if (!mindMap) {
      return NextResponse.json(
        { error: 'Mind map not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mindMap);
  } catch (error) {
    console.error('Error fetching mind map:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mind map' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const id = request.nextUrl.pathname.split('/').pop();

  try {
    await connectDB();
    const updates = await request.json();

    const mindMap = await MindMap.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!mindMap) {
      return NextResponse.json(
        { error: 'Mind map not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mindMap);
  } catch (error) {
    console.error('Error updating mind map:', error);
    return NextResponse.json(
      { error: 'Failed to update mind map' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const id = request.nextUrl.pathname.split('/').pop();

  try {
    await connectDB();
    const result = await MindMap.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Mind map not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Mind map deleted' });
  } catch (error) {
    console.error('Error deleting mind map:', error);
    return NextResponse.json(
      { error: 'Failed to delete mind map' },
      { status: 500 }
    );
  }
}
