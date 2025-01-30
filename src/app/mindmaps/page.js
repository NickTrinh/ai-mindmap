'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function MindMapsListPage() {
  const [mindMaps, setMindMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMindMaps() {
      try {
        const response = await fetch('/api/mindmaps');
        if (!response.ok) throw new Error('Failed to fetch mind maps');
        const data = await response.json();
        setMindMaps(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMindMaps();
  }, []);

  if (loading) return <div>Loading mind maps...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mind Maps</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mindMaps.map(mindMap => (
          <Link key={mindMap._id} href={`/mindmaps/${mindMap._id}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{mindMap.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {mindMap.nodes.length} nodes
                </p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(mindMap.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
