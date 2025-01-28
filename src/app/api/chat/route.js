// src/app/api/chat/route.js
import { Anthropic } from '@anthropic-ai/sdk';
import connectDB from '../../lib/mongoose';
import FlashcardSet from '../../models/FlashcardSet';
import MindMap from '../../models/MindMap';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI tutor helping students learn.
When a user asks to create flashcards, you MUST use the create_flashcard_set tool - do not respond with text.
The create_flashcard_set tool is the only way to create flashcards.
For all other questions, respond normally.
Do not hallucinate or make things up.`;

const tools = [
  {
    name: 'create_flashcard_set',
    description:
      'REQUIRED tool for creating flashcard sets. You MUST use this tool whenever the user wants to create, generate, or make flashcards. Do not respond with text for flashcard creation requests.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the flashcard set.',
        },
        cards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: {
                type: 'string',
                description: 'Questions on the topic.',
              },
              definition: {
                type: 'string',
                description: 'Answer to the question.',
              },
            },
            required: ['term', 'definition'],
          },
        },
      },
      required: ['title', 'cards'],
    },
  },
  {
    name: 'create_mind_map',
    description:
      'REQUIRED tool for creating mind maps from study materials. Use this tool whenever the user wants to generate or create a mind map.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the mind map',
        },
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique identifier for the node',
              },
              text: {
                type: 'string',
                description: 'Content of the node',
              },
              parentId: {
                type: 'string',
                description: 'ID of parent node (null for root)',
              },
            },
            required: ['id', 'text'],
          },
        },
      },
      required: ['title', 'nodes'],
    },
  },
];

async function saveFlashcardSet(data) {
  console.log('Save flashcard set:', data);
  try {
    await connectDB();
    const flashcardSet = new FlashcardSet({
      title: data.title,
      cards: data.cards,
    });
    await flashcardSet.save();
    return {
      id: flashcardSet._id.toString(),
      title: flashcardSet.title,
      cardCount: flashcardSet.cards.length,
    };
  } catch (error) {
    console.error('MongoDB save error:', error);
    throw error;
  }
}

async function saveMindMap(data) {
  try {
    await connectDB();
    const mindMap = new MindMap({
      title: data.title,
      nodes: data.nodes,
    });
    await mindMap.save();
    return {
      id: mindMap._id.toString(),
      title: mindMap.title,
      nodeCount: mindMap.nodes.length,
    };
  } catch (error) {
    console.error('MongoDB save error:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const { messages } = await request.json();

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 4096,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      tools: tools,
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
      }

      if (toolCall === 'create_mind_map') {
        const savedMap = await saveMindMap(toolInput);
        return Response.json({
          message: `Created mind map: ${toolInput.title} with ${toolInput.nodes.length} nodes`,
          mindMap: savedMap,
        });
      }
    }

    return Response.json({
      message: response.content[0].text,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    if (error.status === 400) {
      return Response.json(
        { error: `Invalid request: ${error.message}` },
        { status: 400 }
      );
    }
    return Response.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
