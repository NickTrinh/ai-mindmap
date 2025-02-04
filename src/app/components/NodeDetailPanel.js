import { useState, useEffect } from 'react';

export default function NodeDetailPanel({ node, onUpdate, onClose }) {
  const [nodeData, setNodeData] = useState({
    content: node?.data?.label || '',
    type: node?.type || 'mindmap',
    style: node?.style || {},
  });

  const nodeTypes = [
    { value: 'mindmap', label: 'Default' },
    { value: 'process', label: 'Process' },
    { value: 'diamond', label: 'Question/Decision' },
    { value: 'category', label: 'Category' },
  ];

  const handleSubmit = e => {
    e.preventDefault();
    onUpdate({
      ...node,
      data: { ...node.data, label: nodeData.content },
      type: nodeData.type,
      style: nodeData.style,
    });
  };

  return (
    <div className="absolute right-0 top-0 w-80 m-4 p-4 bg-white border border-gray-200 shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Node Details</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            value={nodeData.content}
            onChange={e =>
              setNodeData(prev => ({ ...prev, content: e.target.value }))
            }
            className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <select
            value={nodeData.type}
            onChange={e =>
              setNodeData(prev => ({ ...prev, type: e.target.value }))
            }
            className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {nodeTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Update Node
        </button>
      </form>
    </div>
  );
}
