export default function MindMapSidebar({ node, onAddNode, onDeleteNode }) {
  return (
    <div className="absolute right-0 top-0 m-4 p-4 bg-white shadow-lg rounded-lg">
      <button
        className="block w-full mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => onAddNode(node.id)}
      >
        Add Node
      </button>
      <button
        className="block w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() => onDeleteNode(node.id)}
      >
        Delete Node
      </button>
    </div>
  );
}
