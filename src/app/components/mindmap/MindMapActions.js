import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { toPng } from 'html-to-image';

export default function MindMapActions({ mindMap }) {
  const { getNodes, getEdges } = useReactFlow();

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
    const flowElement = document.querySelector('.react-flow');
    if (!flowElement) return;

    toPng(flowElement, {
      quality: 1,
      width: flowElement.offsetWidth,
      height: flowElement.offsetHeight,
      backgroundColor: '#ffffff',
    })
      .then(dataUrl => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${mindMap.title
          .toLowerCase()
          .replace(/\s+/g, '-')}-mindmap.png`;
        link.click();
      })
      .catch(error => {
        console.error('Error exporting image:', error);
      });
  }, [mindMap.title]);

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
