import { useState, useEffect } from 'react';

export default function NodeDetailPanel({ node, onUpdate, onClose }) {
  const [nodeData, setNodeData] = useState({
    content: node?.data?.label || '',
  });

  const handleSubmit = e => {
    e.preventDefault();
    onUpdate({
      ...node,
      data: { ...node.data, label: nodeData.content },
    });
  };

  return (
    <div className="absolute  left-0 bottom-0 w-80 m-4 p-4 dark:bg-gray-800 bg-white border border-gray-200 shadow-lg rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Node Details</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Content
          </label>
          <textarea
            value={nodeData.content}
            onChange={e =>
              setNodeData(prev => ({ ...prev, content: e.target.value }))
            }
            className="w-full p-2 border border-gray-200 dark:bg-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Update Node
        </button>
      </form>
    </div>
  );
}
