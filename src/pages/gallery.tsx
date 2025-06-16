'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Drawing = {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
};

export default function GalleryPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchDrawings() {
      try {
        const res = await fetch('/api/drawings');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();
        setDrawings(data);
      } catch (error) {
        console.error('Error fetching drawings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDrawings();
  }, [router]);

return (
  <div className="p-4">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">My Drawings</h1>
      <div className="flex gap-2">
        <button
          onClick={() => router.push('/drawing')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          + New Drawing
        </button>
        <button
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            } catch (error) {
              console.error('Logout failed:', error);
            }
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Log Out
        </button>
      </div>
    </div>

    {loading ? (
      <p>Loading...</p>
    ) : drawings.length === 0 ? (
      <p>No drawings found.</p>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {drawings.map((drawing) => (
          <div
            key={drawing.id}
            className="border rounded p-2 shadow cursor-pointer hover:shadow-md transition"
            onClick={() => router.push(`/drawing?id=${drawing.id}`)}
          >
            <h2 className="font-semibold text-center">{drawing.name}</h2>
            <img
              src={drawing.dataUrl}
              alt={drawing.name}
              className="w-full h-auto mt-2"
            />
            <p className="text-sm text-center text-gray-500 mt-1">
              {new Date(drawing.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
);

}
