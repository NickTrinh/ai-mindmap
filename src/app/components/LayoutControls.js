import { useCallback } from 'react';

export default function LayoutControls({ onLayoutChange }) {
  const layouts = [
    { id: 'dagre-lr', label: 'Left to Right' },
    { id: 'dagre-tb', label: 'Top to Bottom' },
  ];

  return (
    <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
      <select
        defaultValue="dagre-lr"
        onChange={e => onLayoutChange(e.target.value)}
        className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {layouts.map(layout => (
          <option key={layout.id} value={layout.id}>
            {layout.label}
          </option>
        ))}
      </select>
    </div>
  );
}
