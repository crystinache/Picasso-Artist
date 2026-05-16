/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState, MouseEvent, TouchEvent } from 'react';
import { Undo2, Redo2, Eraser, MousePointer2, Trash2, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

const COLORS = [
  { name: 'Red', value: '#ff0000' },    // Rosso (Blood red)
  { name: 'Blue', value: '#3b82f6' },   // Blu
  { name: 'Yellow', value: '#ffff00' }, // Giallo (Sun-like bright)
  { name: 'Green', value: '#22c55e' },  // Verde
  { name: 'Orange', value: '#ffaa00' }, // Arancione (20% more luminous)
  { name: 'Black', value: '#000000' },  // Nero
];

const LegoManTemplate = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 overflow-hidden">
    <svg viewBox="-20 -30 440 660" className="w-[108%] h-[108%] md:w-[102%] md:h-[102%] aspect-[2/3]">
      <g stroke="black" strokeWidth="3" fill="white">
        {/* Head (Minifigure shape) - Rendered first so hat can cover top */}
        <path d="M155 125 V175 Q155 185 165 185 H235 Q245 185 245 175 V125 H155 Z" />
        
        {/* Hard Hat (Builder style) - Placed over head */}
        <path d="M145 110 Q145 60 200 60 Q255 60 255 110" /> {/* Dome */}
        <path d="M125 110 Q125 105 135 105 H265 Q275 105 275 110 L285 125 H115 Z" /> {/* Brim */}
        <rect x="185" y="65" width="30" height="10" rx="2" /> {/* Top ridge */}

        {/* Glasses */}
        <g strokeWidth="2.5" fill="none">
          <circle cx="180" cy="145" r="15" />
          <circle cx="220" cy="145" r="15" />
          <line x1="195" y1="145" x2="205" y2="145" />
        </g>
        
        {/* Smile */}
        <path d="M185 170 Q200 178 215 170" strokeWidth="2.5" fill="none" />

        {/* Neck */}
        <rect x="185" y="185" width="30" height="15" />

        {/* Torso and Arms (long sleeves, merged to remove internal lines) */}
        <path d="
          M190 200 H210 
          L255 210 Q285 205 295 235 L330 330 L300 340 L265 255
          L285 365 H115
          L135 255 L100 340 L70 330 L105 235 Q115 205 145 210
          L190 200 Z
        " />
        
        {/* Wrist Connectors */}
        <rect x="300" y="340" width="18" height="12" transform="rotate(-15 309 346)" fill="none" />
        <rect x="82" y="340" width="18" height="12" transform="rotate(15 91 346)" fill="none" />

        {/* Realistic Tie and Shirt Detail */}
        <g fill="none">
          <path d="M190 200 L200 215 L210 200" /> {/* Collar top */}
          <path d="M200 215 L210 225 L200 235 L190 225 Z" /> {/* Tie knot */}
          <path d="M190 235 H210 L218 310 L200 330 L182 310 Z" /> {/* Tie body */}
        </g>

        {/* Hands (Simplified as circles) */}
        <circle cx="315" cy="365" r="15" />
        <circle cx="85" cy="365" r="15" />

        {/* Legs and Shoes (Merged with Hips to remove groin lines) */}
        {/* Right Side */}
        <path d="M205 365 H260 V550 H275 Q285 550 285 565 V580 H205 Z" />
        {/* Left Side */}
        <path d="M140 365 H195 V580 H115 V565 Q115 550 125 550 H140 Z" />
        
        {/* Shoe separation lines */}
        <line x1="205" y1="550" x2="260" y2="550" fill="none" />
        <line x1="140" y1="550" x2="195" y2="550" fill="none" />

        {/* Central divider for hips area */}
        <rect x="195" y="365" width="10" height="40" fill="none" />
      </g>
    </svg>
  </div>
);

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[5].value); // Default Black
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<string>('none');
  const [showMenu, setShowMenu] = useState(false);

  // Initialize and handle resize
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        renderCanvas();
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [strokes]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const drawStroke = (stroke: Stroke) => {
      if (stroke.points.length < 1) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    };

    strokes.forEach(drawStroke);
    if (currentStroke) drawStroke(currentStroke);
  }, [strokes, currentStroke]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const getCoordinates = (e: MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setCurrentStroke({
      points: [coords],
      color: currentColor,
      width: 11,
    });
    setRedoStack([]);
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing || !currentStroke) return;
    
    // Support scrolling while drawing on mobile by preventing default
    if (e.cancelable) e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, coords],
    });
  };

  const endDrawing = () => {
    if (!isDrawing || !currentStroke) return;

    setIsDrawing(false);
    setStrokes([...strokes, currentStroke]);
    setCurrentStroke(null);
  };

  const undo = () => {
    if (strokes.length === 0) return;
    const lastStroke = strokes[strokes.length - 1];
    setRedoStack([...redoStack, lastStroke]);
    setStrokes(strokes.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextStroke = redoStack[redoStack.length - 1];
    setStrokes([...strokes, nextStroke]);
    setRedoStack(redoStack.slice(0, -1));
  };

  const clear = () => {
    setStrokes([]);
    setRedoStack([]);
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  const selectTemplate = (id: string) => {
    setCurrentTemplate(id);
    setShowMenu(false);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white font-sans overflow-hidden select-none">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-white border-b border-gray-100 z-50 relative shrink-0">
        <div className="relative">
          <button 
            onClick={toggleMenu}
            className="flex items-center gap-1 group"
            id="picasso-title-btn"
          >
            <h1 className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">Picasso Artist</h1>
            <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/5" 
                  onClick={() => setShowMenu(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 p-3"
                  id="template-menu"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => selectTemplate('none')}
                      className={`group relative aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden ${currentTemplate === 'none' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300 bg-gray-50'}`}
                      title="Foglio Bianco"
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-2 bg-white">
                        <div className="w-full h-full border border-dashed border-gray-200 rounded" />
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 py-1 px-2">
                        <p className="text-[10px] font-medium text-white line-clamp-1">Bianco</p>
                      </div>
                      {currentTemplate === 'none' && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => selectTemplate('lego')}
                      className={`group relative aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden ${currentTemplate === 'lego' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300 bg-gray-50'}`}
                      title="Omino Lego"
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-1 bg-white">
                        <svg viewBox="0 0 400 600" className="w-full h-full opacity-60">
                          <g stroke="black" strokeWidth="12" fill="none">
                            <path d="M145 110 Q145 60 200 60 Q255 60 255 110" />
                            <path d="M125 110 Q125 105 135 105 H265 Q275 105 275 110 L285 125 H115 Z" />
                            <path d="M155 125 V175 Q155 185 165 185 H235 Q245 185 245 175 V125 H155 Z" />
                            <path d="M190 200 H210 L255 210 Q285 205 295 235 L330 330 L300 340 L265 255 L285 365 H115 L135 255 L100 340 L70 330 L105 235 Q115 205 145 210 L190 200 Z" />
                            <circle cx="315" cy="365" r="30" />
                            <circle cx="85" cy="365" r="30" />
                            <path d="M205 365 H260 V550 H275 Q285 550 285 565 V580 H205 Z" />
                            <path d="M140 365 H195 V580 H115 V565 Q115 550 125 550 H140 Z" />
                          </g>
                        </svg>
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-black/50 py-1 px-2">
                        <p className="text-[10px] font-medium text-white line-clamp-1">Lego</p>
                      </div>
                      {currentTemplate === 'lego' && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={strokes.length === 0}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"
            title="Undo"
            id="undo-btn"
          >
            <Undo2 size={24} />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"
            title="Redo"
            id="redo-btn"
          >
            <Redo2 size={24} />
          </button>
          <button
            onClick={clear}
            className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
            title="Clear All"
            id="clear-btn"
          >
            <Trash2 size={24} />
          </button>
        </div>
      </header>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative cursor-crosshair touch-none overflow-hidden bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        id="canvas-container"
      >
        {/* Background Template */}
        {currentTemplate === 'lego' && <LegoManTemplate />}
        
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 z-10"
        />
      </div>

      {/* Footer Controls */}
      <footer className="p-4 bg-white border-t border-gray-100 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] z-10">
        <div className="flex justify-center items-center gap-4 md:gap-8 max-w-lg mx-auto overflow-x-auto py-2 scrollbar-hide" id="color-palette">
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setCurrentColor(color.value)}
              className={`
                group relative flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full 
                transition-all duration-200 ease-out active:scale-95
                border border-black/10
                ${currentColor === color.value ? 'scale-110 shadow-xl ring-2 ring-black ring-offset-2 z-20' : 'hover:scale-105 shadow-md active:scale-90 z-10'}
              `}
              style={{ 
                backgroundColor: color.value,
              }}
              title={color.name}
              id={`color-btn-${color.name.toLowerCase()}`}
            />
          ))}
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-bottom {
          padding-bottom: calc(1.5rem + window.safeAreaInsets?.bottom || 0px);
        }
      `}</style>
    </div>
  );
}

