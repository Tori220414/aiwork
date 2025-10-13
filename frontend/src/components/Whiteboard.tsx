import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Square, Circle, Minus, Download, Trash2, Grid } from 'lucide-react';

interface WhiteboardProps {
  workspaceId: string;
}

type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text';

const Whiteboard: React.FC<WhiteboardProps> = ({ workspaceId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [tempCanvas, setTempCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw grid
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Create temporary canvas for shape preview
    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    setTempCanvas(temp);
  }, [showGrid]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;

    const gridSize = 20;

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(pos);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const pos = getMousePos(e);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (startPoint && tempCanvas) {
      // For shapes, draw on temporary canvas
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Clear temp canvas
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

      // Copy main canvas to temp
      tempCtx.drawImage(canvas, 0, 0);

      // Draw shape on temp canvas
      tempCtx.strokeStyle = color;
      tempCtx.lineWidth = lineWidth;
      tempCtx.lineCap = 'round';

      const width = pos.x - startPoint.x;
      const height = pos.y - startPoint.y;

      switch (tool) {
        case 'rectangle':
          tempCtx.strokeRect(startPoint.x, startPoint.y, width, height);
          break;
        case 'circle':
          const radius = Math.sqrt(width * width + height * height);
          tempCtx.beginPath();
          tempCtx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
          tempCtx.stroke();
          break;
        case 'line':
          tempCtx.beginPath();
          tempCtx.moveTo(startPoint.x, startPoint.y);
          tempCtx.lineTo(pos.x, pos.y);
          tempCtx.stroke();
          break;
      }

      // Show preview
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (showGrid) drawGrid(ctx, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const pos = getMousePos(e);

    if (tool !== 'pen' && tool !== 'eraser' && startPoint) {
      // Finalize shape
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      const width = pos.x - startPoint.x;
      const height = pos.y - startPoint.y;

      switch (tool) {
        case 'rectangle':
          ctx.strokeRect(startPoint.x, startPoint.y, width, height);
          break;
        case 'circle':
          const radius = Math.sqrt(width * width + height * height);
          ctx.beginPath();
          ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          break;
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const clearCanvas = () => {
    if (!window.confirm('Clear the entire whiteboard?')) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (showGrid) drawGrid(ctx, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'pen', icon: <Pencil className="w-5 h-5" />, label: 'Pen' },
    { id: 'eraser', icon: <Eraser className="w-5 h-5" />, label: 'Eraser' },
    { id: 'rectangle', icon: <Square className="w-5 h-5" />, label: 'Rectangle' },
    { id: 'circle', icon: <Circle className="w-5 h-5" />, label: 'Circle' },
    { id: 'line', icon: <Minus className="w-5 h-5" />, label: 'Line' },
  ];

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Tools */}
          <div className="flex items-center gap-2">
            {tools.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`p-3 rounded-lg transition-colors ${
                  tool === t.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>

          {/* Colors */}
          <div className="flex items-center gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c ? 'border-gray-900 scale-110' : 'border-gray-300'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
              title="Custom color"
            />
          </div>

          {/* Line Width */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Width:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600 w-8">{lineWidth}px</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg ${
                showGrid ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
              }`}
              title="Toggle Grid"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={downloadCanvas}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              title="Clear"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full border border-gray-300 rounded-lg cursor-crosshair"
          style={{ height: '600px' }}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Use the whiteboard to sketch floor plans, design layouts, or annotate construction drawings.
          The grid helps maintain accurate proportions for your designs.
        </p>
      </div>
    </div>
  );
};

export default Whiteboard;
