import React from 'react';
import { Handle, Position } from 'reactflow';

// Base styles
const baseNodeStyles = {
  padding: '10px 20px',
  borderRadius: '5px',
  fontSize: '14px',
};

// Process Node
export function ProcessNode({ data, id }) {
  return (
    <div
      style={{
        ...baseNodeStyles,
        background: data.color || '#fff',
        border: '2px solid #2563eb',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      {data.details && (
        <div className="text-sm text-gray-600">{data.details}</div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Diamond Node
export function DiamondNode({ data, id }) {
  return (
    <div
      style={{
        ...baseNodeStyles,
        transform: 'rotate(45deg)',
        background: data.color || '#fff',
        border: '2px solid #7c3aed',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ transform: 'rotate(-45deg)' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Category Node
export function CategoryNode({ data, id }) {
  return (
    <div
      style={{
        ...baseNodeStyles,
        background: data.color || '#f3f4f6',
        border: '2px dashed #6b7280',
        minWidth: '120px',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold">{data.label}</div>
      {data.details && <div className="text-sm">{data.details}</div>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// Export node types configuration
export const nodeTypes = {
  process: ProcessNode,
  diamond: DiamondNode,
  category: CategoryNode,
};
