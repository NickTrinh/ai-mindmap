'use client';
import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  useReactFlow,
  Handle,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import NodeDetailPanel from './NodeDetailPanel';
import dagre from '@dagrejs/dagre';
import MindMapActions from './MindMapActions';

// Custom node components with text wrapping
const nodeTypes = {
  mindmap: ({ data, selected }) => (
    <div
      className={`px-4 py-2 shadow-md rounded-lg border transition-all duration-200 max-w-[300px] 
        ${
          selected
            ? 'border-blue-500 shadow-lg scale-105'
            : 'border-gray-300 hover:border-gray-400'
        }
        bg-white`}
    >
      <div className="text-sm font-medium text-gray-800 whitespace-pre-wrap break-words">
        {data.label}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500"
        style={{ visibility: 'hidden', right: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500"
        style={{ visibility: 'hidden', left: '50%' }}
      />
    </div>
  ),
};

export default function MindMapVisualization({ mindMap }) {
  const reactFlowInstance = useReactFlow();
  const [selectedNode, setSelectedNode] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showNodeDetail, setShowNodeDetail] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState('dagre-lr');
  const [initialLayoutApplied, setInitialLayoutApplied] = useState(false);
  const [selectedEdgeType, setSelectedEdgeType] = useState('smoothstep');
  const [connectingNodeId, setConnectingNodeId] = useState(null);

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
        if (!currentNode) break; // Handle case where parent node doesn't exist
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
        if (!currentNode) break; // Handle case where parent node doesn't exist
      }

      const nodesAtLevel = levels.get(level) || [];
      const indexAtLevel = nodesAtLevel.indexOf(node);
      const y =
        indexAtLevel >= 0
          ? (indexAtLevel - (nodesAtLevel.length - 1) / 2) * verticalSpacing
          : 0;

      return {
        id: node.id,
        type: 'mindmap',
        position: node.position || { x: level * horizontalSpacing, y },
        data: { label: node.content },
      };
    });
  }, []);

  const initialNodes = transformNodesToReactFlow(mindMap);
  const initialEdges = mindMap.nodes
    .filter(node => node.parentId !== null)
    .map(node => ({
      id: `${node.parentId}-${node.id}`,
      source: node.parentId,
      target: node.id,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: '#000000',
        strokeWidth: 2,
      },
    }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    params => {
      const edgeParams = {
        ...params,
        type: selectedEdgeType,
        animated: false,
        style: {
          stroke: '#000000',
          strokeWidth: 2,
        },
      };

      fetch(`/api/mindmaps/${mindMap._id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: params.source, target: params.target }),
      });
      setEdges(eds => addEdge(edgeParams, eds));
    },
    [mindMap._id, setEdges, selectedEdgeType]
  );

  const handleAddNode = useCallback(
    parentId => {
      const newNode = {
        id: `node-${Date.now()}`,
        content: 'New Node',
        parentId: parentId,
        nodeType: 'mindmap',
      };

      const parentNode = nodes.find(n => n.id === parentId);
      const position = parentNode?.position || { x: 0, y: 0 };
      const newPosition = {
        x: position.x + 150,
        y: position.y + (Math.random() - 0.5) * 100,
      };

      fetch(`/api/mindmaps/${mindMap._id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newNode: {
            ...newNode,
            position: newPosition,
          },
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to create node');
          }
          return response.json();
        })
        .then(() => {
          setNodes(nds => [
            ...nds,
            {
              id: newNode.id,
              type: 'mindmap',
              position: newPosition,
              data: { label: newNode.content },
            },
          ]);
          setEdges(eds => [
            ...eds,
            {
              id: `${parentId}-${newNode.id}`,
              source: parentId,
              target: newNode.id,
              type: selectedEdgeType,
              animated: false,
              style: {
                stroke: '#000000',
                strokeWidth: 2,
              },
            },
          ]);
        })
        .catch(error => {
          console.error('Error creating node:', error);
        });
    },
    [nodes, mindMap._id, setNodes, setEdges, selectedEdgeType]
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
        }),
      });

      if (response.ok) {
        setNodes(nds =>
          nds.map(node =>
            node.id === updatedNode.id
              ? {
                  ...node,
                  data: { ...node.data, label: updatedNode.data.label },
                }
              : node
          )
        );
        setShowNodeDetail(false);
      } else {
        console.error('Failed to update node');
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
        const direction =
          layoutType === 'dagre-lr'
            ? 'LR'
            : layoutType === 'dagre-tb'
            ? 'TB'
            : layoutType === 'dagre-bt'
            ? 'BT'
            : 'RL'; // dagre-rl

        const g = new dagre.graphlib.Graph();

        // Enhanced dagre settings based on documentation
        g.setGraph({
          rankdir: direction,
          align: 'DL', // Down-Left alignment for more natural tree appearance
          nodesep: 100, // Increased spacing between nodes in same rank
          ranksep: 150, // Increased spacing between ranks
          edgesep: 50, // Increased edge spacing
          marginx: 20, // Margin for the graph
          marginy: 20,
          ranker: 'network-simplex', // Best for trees/hierarchical layouts
          acyclicer: 'greedy', // Handles cycles in graph
        });
        g.setDefaultEdgeLabel(() => ({}));

        // Set node dimensions with some padding for better spacing
        nodes.forEach(node => {
          g.setNode(node.id, {
            width: 150, // Increased width for better text display
            height: 50, // Increased height
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 10,
            paddingBottom: 10,
          });
        });

        edges.forEach(edge => {
          g.setEdge(edge.source, edge.target, {
            weight: 1, // Default weight for edges
            minlen: 1, // Minimum edge length in ranks
          });
        });

        dagre.layout(g);

        const newNodes = nodes.map(node => {
          const nodeWithPosition = g.node(node.id);
          return {
            ...node,
            position: {
              x: nodeWithPosition.x - 75, // Centered based on new width
              y: nodeWithPosition.y - 25, // Centered based on new height
            },
          };
        });

        setNodes(newNodes);
      }

      if (layoutType === 'circular') {
        const center = { x: 500, y: 500 };
        const radius = Math.max(350, nodes.length * 30); // Dynamic radius based on node count
        const angleStep = (2 * Math.PI) / nodes.length;

        // Sort nodes by their connections to place connected nodes closer together
        const nodeConnections = nodes.map(node => ({
          ...node,
          connectionCount: edges.filter(
            edge => edge.source === node.id || edge.target === node.id
          ).length,
        }));

        nodeConnections.sort((a, b) => b.connectionCount - a.connectionCount);

        const newNodes = nodeConnections.map((node, index) => ({
          ...node,
          position: {
            x: center.x + radius * Math.cos(index * angleStep),
            y: center.y + radius * Math.sin(index * angleStep),
          },
        }));

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

  const handleEdgeTypeChange = useCallback(
    edgeType => {
      setSelectedEdgeType(edgeType);
      // Update all existing edges to new type
      setEdges(eds =>
        eds.map(edge => ({
          ...edge,
          type: edgeType,
        }))
      );
    },
    [setEdges]
  );

  const onConnectStart = useCallback((_, { nodeId }) => {
    setConnectingNodeId(nodeId);
  }, []);

  const onConnectEnd = useCallback(
    event => {
      const targetIsPane = event.target.classList.contains('react-flow__pane');
      if (targetIsPane && connectingNodeId) {
        const newNode = {
          id: `node-${Date.now()}`,
          type: 'mindmap',
          position: reactFlowInstance.project({
            x: event.clientX,
            y: event.clientY,
          }),
          data: { label: 'New Node' },
        };
        setNodes(nds => [...nds, newNode]);
        setEdges(eds => [
          ...eds,
          {
            id: `${connectingNodeId}-${newNode.id}`,
            source: connectingNodeId,
            target: newNode.id,
            type: selectedEdgeType,
          },
        ]);
      }
      setConnectingNodeId(null);
    },
    [connectingNodeId, reactFlowInstance, setNodes, setEdges, selectedEdgeType]
  );

  useEffect(() => {
    if (reactFlowInstance && !initialLayoutApplied) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
        applyLayout('dagre-lr');
        setInitialLayoutApplied(true);
      }, 100);
    }
  }, [reactFlowInstance, applyLayout, initialLayoutApplied]);

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 relative bg-white">
        <div className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Layout
            </h3>
            <select
              value={selectedLayout}
              onChange={e => handleLayoutChange(e.target.value)}
              className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-black dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="Hierarchical">
                <option value="dagre-lr">Left to Right</option>
                <option value="dagre-rl">Right to Left</option>
                <option value="dagre-tb">Top to Bottom</option>
                <option value="dagre-bt">Bottom to Top</option>
              </optgroup>
              <optgroup label="Other">
                <option value="circular">Circular</option>
                <option value="default">Default</option>
              </optgroup>
            </select>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Edge Type
            </h3>
            <select
              value={selectedEdgeType}
              onChange={e => handleEdgeTypeChange(e.target.value)}
              className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-black dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default (Bezier)</option>
              <option value="straight">Straight</option>
              <option value="step">Step</option>
              <option value="smoothstep">Smooth Step</option>
              <option value="simplebezier">Simple Bezier</option>
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Import/Export
            </h3>
            <MindMapActions mindMap={mindMap} />
          </div>

          {selectedNode && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Selected Node
              </h3>
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
            setContextMenu(null);
            if (event.target === event.currentTarget) {
              setShowNodeDetail(false);
              setSelectedNode(null);
            }
          }}
          onPaneClick={() => {
            setContextMenu(null);
          }}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          connectOnClick={false}
        >
          <Background
            color="#64748b"
            gap={16}
            size={1}
            style={{ backgroundColor: '#ffffff' }}
          />
          <Panel
            position="top-left"
            className="bg-white text-black p-2 rounded-lg shadow-lg"
          >
            <div className="text-sm font-medium">
              Nodes: {nodes.length} | Edges: {edges.length}
            </div>
          </Panel>
        </ReactFlow>

        {contextMenu && (
          <div
            className="fixed z-50 bg-white shadow-lg rounded-lg py-2 border border-gray-200"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="block w-full px-4 py-2 text-left hover:bg-gray-50 text-purple-500"
              onClick={async () => {
                setShowNodeDetail(true);
                setSelectedNode(contextMenu.node);
                setContextMenu(null);
              }}
            >
              Edit Node
            </button>
            <button
              className="block w-full px-4 py-2 text-left hover:bg-gray-50 text-blue-500"
              onClick={async () => {
                await handleAddNode(contextMenu.node.id);
                setContextMenu(null);
              }}
            >
              Add Child Node
            </button>
            <button
              className="block w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600"
              onClick={async () => {
                await handleDeleteNode(contextMenu.node.id);
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
    </div>
  );
}
