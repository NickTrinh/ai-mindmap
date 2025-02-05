// src/app/api/chat/route.js
import { Anthropic } from '@anthropic-ai/sdk';
import connectDB from '../../lib/mongoose';
import FlashcardSet from '../../models/FlashcardSet';
import MindMap from '../../models/MindMap';
import { SYSTEM_PROMPT, API_TOOLS } from '../../constants';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function saveFlashcardSet(data) {
  try {
    const flashcardSet = new FlashcardSet(data);
    await flashcardSet.save();
    return {
      tool: 'create_flashcard_set',
      id: flashcardSet._id.toString(),
      title: flashcardSet.title,
      cardCount: flashcardSet.cards.length,
    };
  } catch (error) {
    console.error('Error saving flashcard set:', error);
    throw error;
  }
}

async function saveMindMap(data) {
  try {
    await connectDB();
    const mindMap = new MindMap(data);
    await mindMap.save();
    return {
      tool: 'create_mind_map',
      id: mindMap._id.toString(),
      title: mindMap.title,
      nodeCount: mindMap.nodes.length,
    };
  } catch (error) {
    console.error('Error saving mind map:', error);
    throw error;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages } = body;

    await connectDB();

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 4096,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      tools: API_TOOLS,
    });

    if (response.stop_reason === 'tool_use') {
      const toolCall = response.content[1]?.name || response.content[0]?.name;
      const toolInput =
        response.content[1]?.input || response.content[0]?.input;

      if (toolCall === 'create_flashcard_set') {
        const savedSet = await saveFlashcardSet(toolInput);
        return Response.json({
          message: `Created flashcard set: ${toolInput.title} with ${toolInput.cards.length} cards`,
          flashcardSet: savedSet,
        });
      } else if (toolCall === 'create_mind_map') {
        const maps = response.content[1]?.input || response.content[0]?.input;
        const savedMap = await saveMindMap(maps);
        return Response.json({
          message: `Created mind map: ${maps.title} with ${maps.nodes.length} nodes`,
          mindMap: savedMap,
        });
      }
    }

    // Regular response if no tool was used
    return Response.json({
      message: response.content[0].text,
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
