'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MindMapVisualization from '@/app/components/mindmap/MindMapVisualization';
import { ReactFlowProvider } from 'reactflow';

export default function MindMap() {
  const { id } = useParams();
  const [mindMap, setMindMap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMindMap() {
      try {
        const res = await fetch(`/api/mindmaps/${id}`);
        const data = await res.json();
        if (res.ok) {
          setMindMap(data);
        } else {
          console.error('Failed to fetch mind map:', data.error);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMindMap();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Mind map not found
      </div>
    );
  }

  return (
    <div className="h-screen p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          ← Back to Chat
        </Link>
        <h1 className="text-2xl font-bold">{mindMap.title}</h1>
        <div className="w-[100px]"></div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden">
        <ReactFlowProvider>
          <MindMapVisualization mindMap={mindMap} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
