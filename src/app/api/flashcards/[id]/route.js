import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import FlashcardSet from '@/app/models/FlashcardSet';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const set = await FlashcardSet.findById(id);

    if (!set) {
      return NextResponse.json(
        { error: 'Flashcard set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(set);
  } catch (error) {
    console.error('Error fetching flashcard set:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcard set' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const result = await FlashcardSet.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Flashcard set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Flashcard set deleted' });
  } catch (error) {
    console.error('Error deleting flashcard set:', error);
    return NextResponse.json(
      { error: 'Failed to delete flashcard set' },
      { status: 500 }
    );
  }
}
