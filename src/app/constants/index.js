export const SYSTEM_PROMPT = `You are an AI tutor helping students learn.
When a user asks to create flashcards, you MUST use the create_flashcard_set tool - do not respond with text.
When a user asks to create a mind map, you MUST use the create_mind_map tool - do not respond with text.
The create_flashcard_set and create_mind_map tools are the only ways to create their respective resources.
For all other questions, respond normally.
Do not hallucinate or make things up.`;

export const API_TOOLS = [
  {
    name: 'create_flashcard_set',
    description: 'Creates a new set of flashcards for studying',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        cards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              definition: { type: 'string' },
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
    description: 'Creates a new mind map for visual learning',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              parentId: { type: 'string' },
            },
            required: ['id', 'content'],
          },
        },
      },
      required: ['title', 'nodes'],
    },
  },
];
