'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Node colors for different levels
const LEVEL_COLORS = {
  0: '#FF6B6B', // Root - Red
  1: '#4ECDC4', // First level - Teal
  2: '#45B7D1', // Second level - Blue
  3: '#96CEB4', // Third level - Green
};

function getNodeLevel(node, nodes, edges) {
  let level = 0;
  let currentId = node.id;

  while (true) {
    const parentEdge = edges.find(edge => edge.target === currentId);
    if (!parentEdge) break;
    currentId = parentEdge.source;
    level++;
  }

  return level;
}

function organizeNodes(nodes, edges) {
  const VERTICAL_SPACING = 100;
  const HORIZONTAL_SPACING = 200;

  // Group nodes by levels
  const nodesByLevel = {};
  nodes.forEach(node => {
    const level = getNodeLevel(node, nodes, edges);
    nodesByLevel[level] = nodesByLevel[level] || [];
    nodesByLevel[level].push(node);
  });

  // Position nodes
  const organizedNodes = nodes.map(node => {
    const level = getNodeLevel(node, nodes, edges);
    const nodesInLevel = nodesByLevel[level].length;
    const index = nodesByLevel[level].indexOf(node);

    return {
      ...node,
      position: {
        x: level * HORIZONTAL_SPACING,
        y: (index - nodesInLevel / 2) * VERTICAL_SPACING,
      },
      style: {
        ...node.style,
        background: LEVEL_COLORS[level] || '#FFB6C1',
        color: '#ffffff',
        border: 'none',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        fontSize: level === 0 ? '16px' : '14px',
        fontWeight: level === 0 ? '600' : '400',
        width: level === 0 ? 180 : 150,
      },
    };
  });

  return organizedNodes;
}

function MindMapContent() {
  const params = useParams();
  const router = useRouter();
  const [mindMap, setMindMap] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMindMap() {
      try {
        const response = await fetch(`/api/mindmaps/${params.id}`);
        const data = await response.json();
        setMindMap(data);

        // Convert nodes to ReactFlow format
        const flowNodes = data.nodes.map(node => ({
          id: node.id,
          position: node.position || { x: 0, y: 0 },
          data: { label: node.text },
          type: 'default',
        }));

        // Create edges
        const flowEdges = data.nodes
          .filter(node => node.parentId)
          .map(node => ({
            id: `${node.parentId}-${node.id}`,
            source: node.parentId,
            target: node.id,
            type: 'smoothstep',
            style: { stroke: '#5B5B5B', strokeWidth: 2 },
          }));

        // Organize and style nodes
        const organizedNodes = organizeNodes(flowNodes, flowEdges);
        setNodes(organizedNodes);
        setEdges(flowEdges);
      } catch (error) {
        console.error('Failed to fetch mind map:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMindMap();
  }, [params.id, setEdges, setNodes]);

  if (loading) return <div>Loading mind map...</div>;

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-black backdrop-blur-sm">
        <div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-white hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold mt-2 text-white">
            {mindMap?.title}
          </h1>
        </div>
        <button
          //onClick={onSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Save Changes
        </button>
      </div>

      <div className="flex-1 bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Controls className="bg-white/80 backdrop-blur-sm" />
          <MiniMap className="bg-white/80 backdrop-blur-sm" />
          <Background color="#ccc" gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function MindMapPage() {
  return (
    <ReactFlowProvider>
      <MindMapContent />
    </ReactFlowProvider>
  );
}
