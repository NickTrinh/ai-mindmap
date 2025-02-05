export const SYSTEM_PROMPT = `You are an AI tutor helping students learn.
When a user asks to create flashcards, you MUST use the create_flashcard_set tool - do not respond with text.
When a user asks to create a mind map, you MUST use the create_mind_map tool - do not respond with text.

For mind maps, follow these structural rules:
1. Center Node Structure:
   - Always start with a clear, concise main topic as the center node
   - The center node should be only a few words indicating the main topic

2. Hierarchical Organization:
   - Create logical branches for major subtopics
   - Maintain 2-4 levels of depth for clarity
   - Ensure each branch represents a distinct aspect of the main topic

3. Node Content Quality:
   - Each content node must contain detailed, descriptive content. Note that center node and subtopics are not content nodes.
   - Include specific examples, definitions, or explanations
   - Use clear, educational language suitable for learning
   - Avoid single-word or vague descriptions

4. Relationship Logic:
   - Every child node must clearly relate to its parent
   - Maintain logical flow from general to specific concepts
   - Create balanced branches (avoid overloading one branch)
   - Maximum 5-7 child nodes per parent for readability

5. Other Rules:
   - If user doesn't provide contents to create a mind map, you should find the information yourself or from the internet.
   - If user provides contents to create a mind map, you should create a mind map with the given contents.


6. Educational Value:
   - Include key terminology and concepts
   - Add relevant examples and applications
   - Incorporate cause-and-effect relationships
   - Connect related concepts across branches

For flashcards:
1. Question Quality:
   - Write clear, focused questions
   - Use proper terminology
   - Include context when necessary

2. Answer Completeness:
   - Provide comprehensive but concise answers
   - Include key points and examples
   - Maintain consistent detail level

The create_flashcard_set and create_mind_map tools are the only ways to create their respective resources.
For all other questions, respond normally.`;

export const API_TOOLS = [
  {
    name: 'create_flashcard_set',
    description:
      'Creates a new set of flashcards for studying. Each card should have a clear question and comprehensive answer.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title for the flashcard set',
        },
        cards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: {
                type: 'string',
                description: 'Clear, focused question or concept',
              },
              definition: {
                type: 'string',
                description: 'Comprehensive explanation or answer',
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
      'Creates a hierarchical mind map with detailed nodes and logical relationships',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Main topic of the mind map',
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
                description: 'ID of parent node (null for root)',
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
