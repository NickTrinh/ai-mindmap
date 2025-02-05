export const DB_CONFIG = {
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
};

export const MINDMAP_CONFIG = {
  layouts: {
    dagre: {
      rankdir: 'LR',
      nodesep: 80,
      ranksep: 120,
    },
    tree: {
      nodeSize: [150, 100],
      separation: {
        siblings: 1,
        nonSiblings: 2,
      },
    },
  },
  nodeTypes: {
    mindmap: {
      color: '#10B981',
      borderColor: '#059669',
    },
    process: {
      color: '#6366F1',
      borderColor: '#4F46E5',
    },
    diamond: {
      color: '#EC4899',
      borderColor: '#DB2777',
    },
    category: {
      color: '#F59E0B',
      borderColor: '#D97706',
    },
  },
};

export const API_CONFIG = {
  maxRequestSize: '10mb',
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
};
