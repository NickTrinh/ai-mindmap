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
When a user asks to create a mind map, you MUST use the create_mind_map tool - do not respond with text.
The create_flashcard_set and create_mind_map tools are the only ways to create their respective resources.
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
      'REQUIRED tool for creating mind maps. You MUST use this tool whenever the user wants to create, generate, or make a mind map. Do not respond with text for mind map creation requests.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the mind map (central node).',
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
              content: {
                type: 'string',
                description: 'Content of the node',
              },
              parentId: {
                type: 'string',
                description: 'ID of the parent node. null for root node.',
              },
            },
            required: ['id', 'content'],
          },
        },
      },
      required: ['title', 'nodes'],
    },
  },
];

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
      tools: tools,
    });

    // Check if Claude wants to use a tool
    if (response.stop_reason === 'tool_use') {
      const toolCall = response.content[1]?.name || response.content[0]?.name;

      if (toolCall === 'create_flashcard_set') {
        // Execute tool and get result
        const sets = response.content[1]?.input || response.content[0]?.input;
        const savedSet = await saveFlashcardSet(sets);

        return Response.json({
          message: `Created flashcard set: ${sets.title} with ${sets.cards.length} cards`,
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
