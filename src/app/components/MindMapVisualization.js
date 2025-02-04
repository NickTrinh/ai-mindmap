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
import NodeDetailPanel from './NodeDetailPanel';
import dagre from '@dagrejs/dagre';
import LayoutControls from './LayoutControls';
import MindMapActions from './MindMapActions';

// Custom node components with updated colors
const nodeTypes = {
  mindmap: ({ data }) => (
    <div className="px-4 py-2 shadow-md rounded-lg border border-emerald-200 bg-white">
      <div className="text-sm font-medium text-emerald-800">{data.label}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  ),
  diamond: ({ data }) => (
    <div className="px-4 py-2 shadow-md rounded-lg border border-rose-200 bg-white rotate-45">
      <div className="-rotate-45 text-sm font-medium text-rose-800">
        {data.label}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  ),
  process: ({ data }) => (
    <div className="px-6 py-3 shadow-md rounded-lg border border-indigo-200 bg-white">
      <div className="text-base font-semibold text-indigo-800 text-center">
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  ),
  category: ({ data }) => (
    <div className="px-4 py-2 shadow-md rounded-lg border border-amber-200 bg-white">
      <div className="text-sm font-medium text-amber-800">{data.label}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  ),
};

export default function MindMapVisualization({ mindMap }) {
  const reactFlowInstance = useReactFlow();
  const [selectedNode, setSelectedNode] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showNodeDetail, setShowNodeDetail] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState('dagre-lr');

  const getNodeType = node => {
    // Protocol or question nodes become diamonds
    if (
      node.content.toLowerCase().includes('protocol') ||
      node.content.includes('?') ||
      node.nodeType === 'diamond'
    ) {
      return 'diamond';
    }

    // Root nodes become process nodes
    if (node.parentId === null || node.nodeType === 'process') {
      return 'process';
    }

    // Nodes with children become category nodes
    if (
      mindMap.nodes.some(n => n.parentId === node.id) ||
      node.nodeType === 'category'
    ) {
      return 'category';
    }

    // Default to mindmap type
    return 'mindmap';
  };

  const transformNodesToReactFlow = useCallback(mindMap => {
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
  });

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
        const position = nodes.find(n => n.id === parentId)?.position || {
          x: 0,
          y: 0,
        };
        setNodes(nds => [
          ...nds,
          {
            id: newNode.id,
            type: 'mindmap',
            position: { x: position.x + 150, y: position.y },
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

  // Add context menu handler
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node: node,
    });
  }, []);

  // Add node update handler
  const handleNodeUpdate = useCallback(
    async updatedNode => {
      const response = await fetch(`/api/mindmaps/${mindMap._id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: updatedNode.id,
          content: updatedNode.data.label,
          nodeType: updatedNode.type,
          style: updatedNode.style,
        }),
      });

      if (response.ok) {
        setNodes(nds =>
          nds.map(node => (node.id === updatedNode.id ? updatedNode : node))
        );
        setShowNodeDetail(false);
      }
    },
    [mindMap._id, setNodes]
  );

  const applyLayout = useCallback(
    async layoutType => {
      if (layoutType === 'default') {
        const newNodes = transformNodesToReactFlow(mindMap);
        setNodes(newNodes);
        return;
      }

      if (layoutType.startsWith('dagre')) {
        const direction = layoutType === 'dagre-lr' ? 'LR' : 'TB';
        const g = new dagre.graphlib.Graph();
        g.setGraph({
          rankdir: direction,
          nodesep: 80,
          ranksep: 120,
          edgesep: 40,
        });
        g.setDefaultEdgeLabel(() => ({}));

        nodes.forEach(node => {
          g.setNode(node.id, { width: 100, height: 40 });
        });

        edges.forEach(edge => {
          g.setEdge(edge.source, edge.target);
        });

        dagre.layout(g);

        const newNodes = nodes.map(node => {
          const nodeWithPosition = g.node(node.id);
          return {
            ...node,
            position: {
              x: nodeWithPosition.x - 50,
              y: nodeWithPosition.y - 20,
            },
          };
        });

        setNodes(newNodes);
      }
    },
    [nodes, edges, mindMap, setNodes, transformNodesToReactFlow]
  );

  const handleLayoutChange = useCallback(
    layout => {
      setSelectedLayout(layout);
      applyLayout(layout);
    },
    [applyLayout]
  );

  useEffect(() => {
    if (reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 100);
    }
  }, [reactFlowInstance]);

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 relative bg-white">
        <div className="absolute top-4 right-4 z-10"></div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          onNodeClick={(event, node) => {
            setContextMenu(null);
            setShowNodeDetail(false);
            setSelectedNode(node);
          }}
          onNodeContextMenu={onNodeContextMenu}
          onClick={event => {
            if (event.target === event.currentTarget) {
              setContextMenu(null);
              setShowNodeDetail(false);
              setSelectedNode(null);
            }
          }}
        >
          <Background
            color="#64748b"
            gap={16}
            size={1}
            style={{ backgroundColor: '#ffffff' }}
          />
        </ReactFlow>
      </div>

      <div className="w-64 border-l border-gray-200 p-4 bg-white">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Layout</h3>
            <select
              defaultValue="dagre-lr"
              onChange={e => handleLayoutChange(e.target.value)}
              className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dagre-lr">Left to Right</option>
              <option value="dagre-tb">Top to Bottom</option>
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-200">
            <h3 className="font-medium text-gray-900">Import/Export</h3>
            <MindMapActions mindMap={mindMap} />
          </div>

          {selectedNode && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <h3 className="font-medium text-gray-900">Selected Node</h3>
              <p className="text-sm text-gray-600">{selectedNode.data.label}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleAddNode(selectedNode.id)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  Add Child Node
                </button>
                <button
                  onClick={() => {
                    handleDeleteNode(selectedNode.id);
                    setSelectedNode(null);
                  }}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                >
                  Delete Node
                </button>
                <button
                  onClick={() => {
                    setShowNodeDetail(true);
                  }}
                  className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-sm"
                >
                  Edit Node
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 bg-white shadow-lg rounded-lg py-2 border border-gray-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="block w-full px-4 py-2 text-left hover:bg-gray-50"
            onClick={() => {
              setShowNodeDetail(true);
              setSelectedNode(contextMenu.node);
              setContextMenu(null);
            }}
          >
            Edit Node
          </button>
          <button
            className="block w-full px-4 py-2 text-left hover:bg-gray-50"
            onClick={() => handleAddNode(contextMenu.node.id)}
          >
            Add Child Node
          </button>
          <button
            className="block w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600"
            onClick={() => {
              handleDeleteNode(contextMenu.node.id);
              setContextMenu(null);
            }}
          >
            Delete Node
          </button>
        </div>
      )}

      {showNodeDetail && selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onClose={() => setShowNodeDetail(false)}
        />
      )}
    </div>
  );
}
