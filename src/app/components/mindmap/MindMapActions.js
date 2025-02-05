import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { toPng } from 'html-to-image';

export default function MindMapActions({ mindMap }) {
  const { getNodes, getEdges, fitView, setCenter } = useReactFlow();

  const handleExport = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();

    const exportData = {
      title: mindMap.title,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
        parentNode: node.parentNode,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
      dataStr
    )}`;

    const exportFileDefaultName = `${mindMap.title
      .toLowerCase()
      .replace(/\s+/g, '-')}-mindmap.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [getNodes, getEdges, mindMap.title]);

  const handleExportImage = useCallback(() => {
    const nodes = getNodes();
    if (!nodes.length) return;

    // Calculate the bounding box of all nodes
    const bounds = nodes.reduce(
      (acc, node) => {
        acc.minX = Math.min(acc.minX, node.position.x);
        acc.minY = Math.min(acc.minY, node.position.y);
        acc.maxX = Math.max(acc.maxX, node.position.x + 300); // 300px is max node width
        acc.maxY = Math.max(acc.maxY, node.position.y + 100); // Approximate node height
        return acc;
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    // Add margins
    const margin = 50;
    bounds.minX -= margin;
    bounds.minY -= margin;
    bounds.maxX += margin;
    bounds.maxY += margin;

    // Calculate dimensions
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    // Center the viewport on the mindmap
    const centerX = bounds.minX + width / 2;
    const centerY = bounds.minY + height / 2;
    setCenter(centerX, centerY, { zoom: 1 });

    // Wait for the viewport to update
    setTimeout(() => {
      const flowElement = document.querySelector('.react-flow__viewport');
      if (!flowElement) return;

      toPng(flowElement, {
        quality: 1,
        width: width,
        height: height,
        backgroundColor: '#ffffff',
        style: {
          transform: 'none', // Remove any transformations
        },
        filter: node => {
          // Only include the mindmap elements, exclude controls and background
          return (
            !node.classList?.contains('react-flow__minimap') &&
            !node.classList?.contains('react-flow__controls') &&
            !node.classList?.contains('react-flow__background')
          );
        },
      })
        .then(dataUrl => {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `${mindMap.title
            .toLowerCase()
            .replace(/\s+/g, '-')}-mindmap.png`;
          link.click();

          // Reset the view
          fitView({ padding: 0.2 });
        })
        .catch(error => {
          console.error('Error exporting image:', error);
          // Reset the view even if export fails
          fitView({ padding: 0.2 });
        });
    }, 100); // Wait for the viewport to update
  }, [getNodes, getEdges, mindMap.title, setCenter, fitView]);

  const handleImport = useCallback(
    event => {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = async e => {
        try {
          const importedData = JSON.parse(e.target.result);

          const response = await fetch(`/api/mindmaps/${mindMap._id}/import`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(importedData),
          });

          if (response.ok) {
            window.location.reload();
          } else {
            console.error('Failed to import mindmap');
          }
        } catch (error) {
          console.error('Error importing mindmap:', error);
        }
      };

      reader.readAsText(file);
    },
    [mindMap._id]
  );

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleExport}
        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
      >
        Export JSON
      </button>
      <button
        onClick={handleExportImage}
        className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
      >
        Export Image
      </button>
      <label className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors cursor-pointer text-sm text-center">
        Import
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>
    </div>
  );
}
