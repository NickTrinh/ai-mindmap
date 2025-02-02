'use client';
import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  MarkerType,
  useReactFlow,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MindMapSidebar from './MindMapSidebar';

// Custom node components with updated colors
const nodeTypes = {
  mindmap: ({ data }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg border-2 border-emerald-300 bg-emerald-50 min-w-[150px]">
      <div className="text-sm font-medium text-emerald-900">{data.label}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  ),
  diamond: ({ data }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg border-2 border-rose-300 bg-rose-50 rotate-45 min-w-[150px]">
      <div className="-rotate-45 text-sm font-medium text-rose-900">
        {data.label}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  ),
  process: ({ data }) => (
    <div className="px-6 py-3 shadow-lg rounded-lg border-2 border-indigo-300 bg-indigo-50 min-w-[180px]">
      <div className="text-base font-semibold text-indigo-900 text-center">
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  ),
  category: ({ data }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg border-2 border-amber-300 bg-amber-50 min-w-[150px]">
      <div className="text-sm font-medium text-amber-900">{data.label}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  ),
};

export default function MindMapVisualization({ mindMap }) {
  const reactFlowInstance = useReactFlow();
  const [selectedNode, setSelectedNode] = useState(null);

  const getNodeType = node => {
    if (
      node.content.toLowerCase().includes('protocol') ||
      node.content.includes('?')
    )
      return 'diamond';
    if (node.parentId === null) return 'process';
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
      type: 'simplebezier',
      style: {
        stroke: '#000000',
        strokeWidth: 2,
        opacity: 1,
        zIndex: 0,
      },
    }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeDragStop = useCallback(
    (event, node) => {
      // Update node position in the database
      fetch(`/api/mindmaps/${mindMap._id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: node.id, position: node.position }),
      });
    },
    [mindMap._id]
  );

  const onConnect = useCallback(
    params => {
      // Create new edge in the database
      fetch(`/api/mindmaps/${mindMap._id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: params.source, target: params.target }),
      });
      setEdges(eds => addEdge(params, eds));
    },
    [mindMap._id, setEdges]
  );

  const handleAddNode = useCallback(
    parentId => {
      const newNode = {
        id: `node-${Date.now()}`,
        content: 'New Node',
        parentId: parentId,
      };

      fetch(`/api/mindmaps/${mindMap._id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newNode }),
      }).then(() => {
        // Update local state
        const position = nodes.find(n => n.id === parentId)?.position || {
          x: 0,
          y: 0,
        };
        setNodes(nds => [
          ...nds,
          {
            id: newNode.id,
            type: 'mindmap',
            position: { x: position.x + 250, y: position.y },
            data: { label: newNode.content },
          },
        ]);
        setEdges(eds => [
          ...eds,
          {
            id: `${parentId}-${newNode.id}`,
            source: parentId,
            target: newNode.id,
            type: 'simplebezier',
          },
        ]);
      });
    },
    [mindMap._id, nodes, setNodes, setEdges]
  );

  const handleDeleteNode = useCallback(
    nodeId => {
      fetch(`/api/mindmaps/${mindMap._id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteNodeId: nodeId }),
      }).then(() => {
        // Update local state
        setNodes(nds => nds.filter(node => node.id !== nodeId));
        setEdges(eds =>
          eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
        );
        setSelectedNode(null);
      });
    },
    [mindMap._id, setNodes, setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  useEffect(() => {
    if (reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 100);
    }
  }, [reactFlowInstance]);

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
          type: 'simplebezier',
          style: {
            strokeWidth: 2,
            stroke: '#000000',
          },
        }}
        className="bg-slate-50"
        elementsSelectable={true}
        nodesConnectable={true}
        nodesDraggable
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
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
      {selectedNode && (
        <MindMapSidebar
          node={selectedNode}
          onAddNode={handleAddNode}
          onDeleteNode={handleDeleteNode}
        />
      )}
    </div>
  );
}
