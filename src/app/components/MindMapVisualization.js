'use client';
import { useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node components with updated colors
const nodeTypes = {
  mindmap: ({ data }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg border-2 border-emerald-300 bg-emerald-50 min-w-[150px]">
      <div className="text-sm font-medium text-emerald-900">{data.label}</div>
    </div>
  ),
  diamond: ({ data }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg border-2 border-rose-300 bg-rose-50 rotate-45 min-w-[150px]">
      <div className="-rotate-45 text-sm font-medium text-rose-900">
        {data.label}
      </div>
    </div>
  ),
  process: ({ data }) => (
    <div className="px-6 py-3 shadow-lg rounded-lg border-2 border-indigo-300 bg-indigo-50 min-w-[180px]">
      <div className="text-base font-semibold text-indigo-900 text-center">
        {data.label}
      </div>
    </div>
  ),
  category: ({ data }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg border-2 border-amber-300 bg-amber-50 min-w-[150px]">
      <div className="text-sm font-medium text-amber-900">{data.label}</div>
    </div>
  ),
};

export default function MindMapVisualization({ mindMap }) {
  const getNodeType = node => {
    if (
      node.content.toLowerCase().includes('protocol') ||
      node.content.includes('?')
    )
      return 'diamond';
    if (node.parentId === null) return 'process';
    // Check if node is a category (has children)
    if (mindMap.nodes.some(n => n.parentId === node.id)) return 'category';
    return 'mindmap';
  };

  const transformNodesToReactFlow = mindMap => {
    const horizontalSpacing = 250;
    const verticalSpacing = 100;
    const levels = new Map();

    // Group nodes by levels
    mindMap.nodes.forEach(node => {
      let level = 0;
      let currentNode = node;
      while (currentNode.parentId) {
        level++;
        currentNode = mindMap.nodes.find(n => n.id === currentNode.parentId);
      }
      if (!levels.has(level)) levels.set(level, []);
      levels.get(level).push(node);
    });

    return mindMap.nodes.map(node => {
      let level = 0;
      let currentNode = node;
      while (currentNode.parentId) {
        level++;
        currentNode = mindMap.nodes.find(n => n.id === currentNode.parentId);
      }

      const nodesAtLevel = levels.get(level);
      const indexAtLevel = nodesAtLevel.indexOf(node);
      const y =
        (indexAtLevel - (nodesAtLevel.length - 1) / 2) * verticalSpacing;

      return {
        id: node.id,
        type: getNodeType(node),
        position: { x: level * horizontalSpacing, y },
        data: { label: node.content },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          opacity: 1,
          zIndex: 1,
        },
      };
    });
  };

  const initialNodes = transformNodesToReactFlow(mindMap);
  const initialEdges = mindMap.nodes
    .filter(node => node.parentId !== null)
    .map(node => ({
      id: `${node.parentId}-${node.id}`,
      source: node.parentId,
      target: node.id,
      type: 'step',
      style: {
        stroke: '#6366f1',
        strokeWidth: 3,
        opacity: 1,
        zIndex: 0,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#6366f1',
      },
    }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    params => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  // Add auto-center on load
  useEffect(() => {
    const reactFlowInstance = document.querySelector('.react-flow');
    if (reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 100);
    }
  }, []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'step',
          style: {
            strokeWidth: 3,
            stroke: '#6366f1',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6366f1',
          },
        }}
        className="bg-slate-50"
        elementsSelectable={true}
        nodesConnectable={true}
      >
        <Controls
          showInteractive={false}
          className="bg-white/80 backdrop-blur-sm"
        />
        <MiniMap
          nodeColor={node => {
            switch (node.type) {
              case 'diamond':
                return '#fecdd3';
              case 'process':
                return '#c7d2fe';
              case 'category':
                return '#fcd34d';
              default:
                return '#86efac';
            }
          }}
        />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
