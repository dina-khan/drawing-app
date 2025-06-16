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
  BackspaceIcon,
} from '@heroicons/react/24/solid';

const colorToRgba = (hex: string, alpha: number) => {
  const div = document.createElement('div');
  div.style.color = hex;
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
  const [customColor, setCustomColor] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const colorSwatches = ['#000000', '#ff0000', '#0000ff', '#00ff00', '#ffff00', '#800080'];

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

  const handleUndo = () => canvasRef.current?.undo();
  const handleClear = () => canvasRef.current?.clearCanvas();

  const handleDownload = async (format: 'png' | 'jpeg') => {
    const dataUrl = await canvasRef.current?.exportImage(format);
    if (!dataUrl) return alert('Canvas is empty');
    const filename = prompt(`Enter a filename:`, drawingName || 'drawing');
    if (!filename) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename}.${format}`;
    link.click();
    setDownloadOpen(false);
  };

  const handleExport = async () => {
    const dataUrl = await canvasRef.current?.exportImage('png');
    if (!dataUrl) return alert('Canvas is empty');
    const name = prompt('Enter a name:', drawingName);
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className={`relative min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      <div className="w-full flex flex-wrap justify-between items-center gap-4 px-4 py-2 fixed top-0 z-30 bg-white dark:bg-gray-800 md:gap-6 border-b border-gray-300 dark:border-gray-700">
        
        <div className="flex items-center p-3 gap-2 rounded-full bg-[#fce8d5] border-2 border-[#e2cbb3]">
          {colorSwatches.map((color) => (
            <button
              key={color}
              onClick={() => {
                setStrokeColor(color);
                canvasRef.current?.eraseMode(false);
                if (tool === 'eraser') setTool('pen');
              }}
              className={`w-6 h-6 rounded-full border-2 transition ${
                strokeColor === color ? 'border-black' : 'ridge-border'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}

          <label
            title="Custom Color"
            className={`relative w-6 h-6 rounded-full overflow-hidden cursor-pointer border-2 transition ${
              strokeColor === customColor ? 'border-black' : 'ridge-border'
            }`}
          >
            <input
              type="color"
              value={customColor || '#000000'}
              onChange={(e) => {
                const selected = e.target.value;
                setCustomColor(selected);
                setStrokeColor(selected);
                canvasRef.current?.eraseMode(false);
                if (tool === 'eraser') setTool('pen');
              }}
              className="absolute top-0 left-0 opacity-0 w-full h-full cursor-pointer"
            />
            <div
              className="w-full h-full rounded-full"
              style={{ backgroundColor: customColor || '#fce8d5' }}
            />
          </label>
        </div>

        <div className="flex gap-3 items-center">
          <button title="Toggle Dark Mode" onClick={() => setDarkMode((prev) => !prev)}>
            {darkMode ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-700" />}
          </button>
          <button onClick={() => router.push('/gallery')} title="Home">
            <HomeIcon className="h-6 w-6 text-gray-800 dark:text-white" />
          </button>
          <button onClick={handleUndo} title="Undo">
            <ArrowUturnLeftIcon className="h-6 w-6 text-yellow-600" />
          </button>
          <button onClick={() => canvasRef.current?.redo()} title="Redo">
            <ArrowUturnRightIcon className="h-6 w-6 text-yellow-600" />
          </button>

          <div className="hidden md:flex gap-3">
            <button onClick={handleExport} title="Save to Gallery">
              <CloudArrowUpIcon className="h-6 w-6 text-green-600" />
            </button>
            <div className="relative">
              <button onClick={() => setDownloadOpen((prev) => !prev)} title="Download">
                <CloudArrowDownIcon className="h-6 w-6 text-blue-600" />
              </button>
              {downloadOpen && (
                <div className="absolute mt-2 right-0 bg-white dark:bg-gray-800 border rounded shadow z-40">
                  <button onClick={() => handleDownload('png')} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">PNG</button>
                  <button onClick={() => handleDownload('jpeg')} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">JPEG</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed top-28 left-4 flex flex-col gap-4 z-20">
        <button onClick={() => { setTool('pen'); canvasRef.current?.eraseMode(false); }} title="Pen"
          className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-600' : 'bg-gray-500'} text-white`}>
          <PencilIcon className="h-6 w-6" />
        </button>
        <button onClick={() => { setTool('highlighter'); canvasRef.current?.eraseMode(false); }} title="Highlighter"
          className={`p-2 rounded ${tool === 'highlighter' ? 'bg-yellow-500' : 'bg-gray-500'} text-white`}>
          <PencilSquareIcon className="h-6 w-6" />
        </button>
        <button onClick={() => { setTool('eraser'); canvasRef.current?.eraseMode(true); }} title="Eraser"
          className={`p-2 rounded ${tool === 'eraser' ? 'bg-red-500' : 'bg-gray-500'} text-white`}>
          <BackspaceIcon className="h-6 w-6" />
        </button>
        <button onClick={handleClear} title="Clear Canvas" className="p-2 rounded bg-gray-700 text-white">
          <TrashIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="pt-24 px-4 pb-32 flex justify-center">
        <div className="w-full max-w-4xl">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ReactSketchCanvas
              ref={canvasRef}
              width="100%"
              height="500px"
              strokeWidth={tool === 'pen' ? 4 : tool === 'highlighter' ? 12 : 10}
              strokeColor={tool === 'highlighter' ? colorToRgba(strokeColor, 0.3) : strokeColor}
              backgroundImage={backgroundImage ?? undefined}
              className="border border-gray-400 rounded-md bg-white dark:bg-gray-700"
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .ridge-border {
          border-style: ridge;
          border-color: #fce8d5;
        }
      `}</style>
    </div>
  );
};

export default DrawingPage;
