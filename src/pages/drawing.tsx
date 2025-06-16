'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  TrashIcon,
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  PencilIcon,
  PencilSquareIcon,
  HomeIcon,
  MoonIcon,
  SunIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/solid';

// ✅ Fixed RGBA converter for highlighter
const colorToRgba = (hex: string, alpha: number) => {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return hex;
  ctx.fillStyle = hex;
  document.body.appendChild(document.createElement('div')).style.color = hex;
  const computed = ctx.fillStyle;

  // Create a dummy div to get computed color
  const div = document.createElement('div');
  div.style.color = computed;
  document.body.appendChild(div);
  const rgb = getComputedStyle(div).color;
  document.body.removeChild(div);

  const match = rgb.match(/rgba?\((\d+), (\d+), (\d+)/);
  if (!match) return hex;

  const [r, g, b] = [match[1], match[2], match[3]];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DrawingPage = () => {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const drawingId = searchParams?.get('id') ?? '';

  const [downloadOpen, setDownloadOpen] = useState(false);
  const [drawingName, setDrawingName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!drawingId);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!drawingId) return;
    const loadDrawing = async () => {
      try {
        const res = await fetch(`/api/drawings/${drawingId}`);
        if (res.status === 401) return router.push('/login');
        if (!res.ok) throw new Error('Failed to fetch');
        const drawing = await res.json();
        setDrawingName(drawing.name);
        setBackgroundImage(drawing.dataUrl);
      } catch (error) {
        console.error('Failed to load drawing:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDrawing();
  }, [drawingId, router]);

  const handleClear = () => canvasRef.current?.clearCanvas();
  const handleUndo = () => canvasRef.current?.undo();

  const handleExport = async () => {
    const dataUrl = await canvasRef.current?.exportImage('png');
    if (!dataUrl) return alert('Canvas is empty');
    const name = prompt('Enter a name for your drawing:', drawingName);
    if (!name) return;
    const res = await fetch('/api/drawings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: drawingId, name, dataUrl }),
    });
    if (res.status === 401) return router.push('/login');
    if (!res.ok) alert('Failed to save drawing');
    else {
      alert('Drawing saved!');
      router.push('/gallery');
    }
  };

  const handleDownload = async (format: 'png' | 'jpeg') => {
    const dataUrl = await canvasRef.current?.exportImage(format);
    if (!dataUrl) return alert('Canvas is empty');
    const filename = prompt(`Enter a filename to download (${format}):`, drawingName || 'drawing');
    if (!filename) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename}.${format}`;
    link.click();
    setDownloadOpen(false);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className={`flex min-h-screen relative ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      {/* Sidebar Tools */}
      <div className="absolute top-24 left-4 flex flex-col gap-4 z-20">
        <button onClick={() => { setTool('pen'); canvasRef.current?.eraseMode(false); }}
          title="Pen"
          className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-600' : 'bg-gray-500'} text-white hover:scale-110`}>
          <PencilIcon className="h-6 w-6" />
        </button>
        <button onClick={() => { setTool('highlighter'); canvasRef.current?.eraseMode(false); }}
          title="Highlighter"
          className={`p-2 rounded ${tool === 'highlighter' ? 'bg-yellow-500' : 'bg-gray-500'} text-white hover:scale-110`}>
          <PencilSquareIcon className="h-6 w-6" />
        </button>
        <button onClick={() => { setTool('eraser'); canvasRef.current?.eraseMode(true); }}
          title="Eraser"
          className={`p-2 rounded ${tool === 'eraser' ? 'bg-red-500' : 'bg-gray-500'} text-white hover:scale-110`}>
          <TrashIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Color Palette */}
      <div className="absolute top-4 left-4 flex gap-2 items-center z-30">
        {['#000000', '#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080'].map((color) => (
          <button key={color} onClick={() => {
            setStrokeColor(color);
            canvasRef.current?.eraseMode(false);
            if (tool === 'eraser') setTool('pen');
          }}
            className={`w-6 h-6 rounded-full border-2 ${strokeColor === color ? 'border-black' : 'border-transparent'}`}
            style={{ backgroundColor: color }}
            title={color} />
        ))}
        <label title="Custom Color" className="relative cursor-pointer">
          <AdjustmentsHorizontalIcon className="h-6 w-6 text-gray-700 dark:text-white" />
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => {
              setStrokeColor(e.target.value);
              canvasRef.current?.eraseMode(false);
              if (tool === 'eraser') setTool('pen');
            }}
            className="absolute top-0 left-0 opacity-0 w-6 h-6"
          />
        </label>
      </div>

      {/* Top Toolbar */}
      <div className="absolute top-4 right-4 flex gap-3 items-center z-30">
        <button title="Toggle Dark Mode" onClick={() => setDarkMode((prev) => !prev)}>
          {darkMode ? (
            <SunIcon className="h-6 w-6 text-yellow-400 hover:scale-110 transition" />
          ) : (
            <MoonIcon className="h-6 w-6 text-gray-700 hover:scale-110 transition" />
          )}
        </button>
        <button onClick={() => router.push('/gallery')} title="Home">
          <HomeIcon className="h-6 w-6 text-gray-800 dark:text-white hover:scale-110 transition" />
        </button>
        <button onClick={handleUndo} title="Undo">
          <ArrowUturnLeftIcon className="h-6 w-6 text-yellow-600 hover:scale-110 transition" />
        </button>
      <button onClick={() => canvasRef.current?.redo()} title="Redo">
        <ArrowUturnRightIcon className="h-6 w-6 text-yellow-600 hover:scale-110 transition" />
      </button>

        <button onClick={handleClear} title="Clear">
          <TrashIcon className="h-6 w-6 text-red-600 hover:scale-110 transition" />
        </button>
        <button onClick={handleExport} title="Save to Gallery">
          <CloudArrowUpIcon className="h-6 w-6 text-green-600 hover:scale-110 transition" />
        </button>
        <div className="relative">
          <button onClick={() => setDownloadOpen((prev) => !prev)} title="Download">
            <CloudArrowDownIcon className="h-6 w-6 text-blue-600 hover:scale-110 transition" />
          </button>
          {downloadOpen && (
            <div className="absolute mt-2 right-0 bg-white dark:bg-gray-800 border rounded shadow z-40">
              <button onClick={() => handleDownload('png')}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                PNG
              </button>
              <button onClick={() => handleDownload('jpeg')}
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                JPEG
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-col items-center justify-center w-full gap-4 p-4">
        {loading ? (
          <p>Loading drawing...</p>
        ) : (
          <div className="relative w-full max-w-4xl">
            <ReactSketchCanvas
              ref={canvasRef}
              width="100%"
              height="400px"
              strokeWidth={tool === 'pen' ? 4 : tool === 'highlighter' ? 12 : 10}
              strokeColor={tool === 'highlighter' ? colorToRgba(strokeColor, 0.3) : strokeColor}
              backgroundImage={backgroundImage ?? undefined}
              className="border border-gray-400 rounded-md bg-white dark:bg-gray-700"
            />
          </div>
        )}
      </div>

      {/* Mobile FABs */}
      <div className="fixed bottom-4 right-4 flex gap-3 md:hidden z-40">
        <button onClick={handleExport} title="Save"
          className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition">
          <CloudArrowUpIcon className="h-6 w-6" />
        </button>
        <button onClick={() => setDownloadOpen((prev) => !prev)} title="Download"
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition">
          <CloudArrowDownIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default DrawingPage;
