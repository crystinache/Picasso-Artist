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

const HouseTemplate = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 overflow-hidden">
    <svg viewBox="0 0 400 600" className="w-[90%] h-[90%] md:w-[85%] md:h-[85%] aspect-[2/3]">
      <g stroke="black" strokeWidth="3" fill="white">
        {/* Chimney */}
        <path d="M260 180 V100 H300 V210" />
        {/* Roof */}
        <path d="M50 250 L200 100 L350 250 Z" />
        {/* Main Body */}
        <rect x="70" y="250" width="260" height="250" />
        {/* Door */}
        <rect x="160" y="380" width="80" height="120" />
        <circle cx="225" cy="440" r="4" fill="black" />
        {/* Windows */}
        <rect x="100" y="290" width="60" height="60" />
        <line x1="100" y1="320" x2="160" y2="320" fill="none" />
        <line x1="130" y1="290" x2="130" y2="350" fill="none" />
        
        <rect x="240" y="290" width="60" height="60" />
        <line x1="240" y1="320" x2="300" y2="320" fill="none" />
        <line x1="270" y1="290" x2="270" y2="350" fill="none" />
        {/* Steps */}
        <rect x="140" y="500" width="120" height="20" />
        <rect x="130" y="520" width="140" height="20" />
        <rect x="120" y="540" width="160" height="20" />
      </g>
    </svg>
  </div>
);

const BoatTemplate = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 overflow-hidden">
    <svg viewBox="0 0 400 600" className="w-[90%] h-[90%] md:w-[85%] md:h-[85%] aspect-[2/3]">
      <g stroke="black" strokeWidth="4" fill="white" strokeLinecap="round" strokeLinejoin="round">
        {/* Sun (Top Left) - Ingrandito del 20% */}
        <circle cx="80" cy="80" r="36" />
        <g strokeWidth="3">
          <line x1="80" y1="35" x2="80" y2="15" />
          <line x1="80" y1="125" x2="80" y2="145" />
          <line x1="35" y1="80" x2="15" y2="80" />
          <line x1="125" y1="80" x2="145" y2="80" />
          <line x1="48" y1="48" x2="34" y2="34" />
          <line x1="112" y1="112" x2="126" y2="126" />
          <line x1="48" y1="112" x2="34" y2="126" />
          <line x1="112" y1="48" x2="126" y2="34" />
        </g>

        {/* Curly Clouds (Top Right) - Curva definita */}
        <path d="M280 120 C280 90 310 90 320 110 C330 80 370 85 380 110 C400 110 400 150 370 160 C370 190 300 190 280 160 C260 160 260 120 280 120 Z" />

        {/* Mast and Rectangular Left Flag - Moved down below cloud bottom */}
        <path d="M190 170 V490" strokeWidth="6" />
        <path d="M190 170 H140 V205 H190 Z" />

        {/* Single Triangular Sail - Moved down */}
        <path d="M185 215 L340 465 L185 475 Z" />

        {/* Hull - Submerged (bottom half hidden by waves) */}
        <path d="M80 490 Q80 560 150 585 Q280 590 370 490 L80 490" />
        
        {/* Cabin - Moved down */}
        <path d="M160 490 L170 455 H260 L270 490" />
        <circle cx="190" cy="472" r="5" />
        <circle cx="215" cy="472" r="5" />
        <circle cx="240" cy="472" r="5" />

        {/* Waves - Positioned lower to cover only bottom part of hull, with 6 ripples */}
        <path 
          d="M-40 560 Q0 535 40 560 T120 560 T200 560 T280 560 T360 560 T440 560 V650 H-40 Z" 
          fill="white" 
          strokeWidth="6" 
        />
        <path 
          d="M-20 585 Q20 560 60 585 T140 585 T220 585 T300 585 T380 585 T460 585" 
          fill="none" 
          strokeWidth="6" 
        />
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
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    <div className={`flex flex-col h-[100dvh] font-sans overflow-hidden select-none transition-colors duration-300 ${isDarkMode ? 'bg-gray-300' : 'bg-white'}`}>
      {/* Header */}
      <header className={`p-4 flex justify-between items-center z-50 relative shrink-0 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} border-b`}>
        <div className="relative">
          <button 
            onClick={toggleMenu}
            className="flex items-center gap-1 group"
            id="picasso-title-btn"
          >
            <h1 className={`text-xl font-bold tracking-tight transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} group-hover:text-blue-600`}>Picasso Artist</h1>
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
                  className={`absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl border overflow-hidden z-50 p-3 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-black' : 'bg-white border-gray-100 shadow-gray-200'}`}
                  id="template-menu"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => selectTemplate('none')}
                      className={`group relative aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden ${currentTemplate === 'none' ? 'border-blue-500 bg-blue-50' : isDarkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-900' : 'border-gray-100 hover:border-gray-300 bg-gray-50'}`}
                      title="Foglio Bianco"
                    >
                      <div className={`absolute inset-0 flex items-center justify-center p-2 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                        <div className={`w-full h-full border border-dashed rounded ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                      </div>
                      {currentTemplate === 'none' && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                    {/* Add more template buttons here as needed, replicating the pattern above */}
                    <button
                      onClick={() => selectTemplate('lego')}
                      className={`group relative aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden ${currentTemplate === 'lego' ? 'border-blue-500 bg-blue-50' : isDarkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-900' : 'border-gray-100 hover:border-gray-300 bg-gray-50'}`}
                      title="Omino Lego"
                    >
                      <div className={`absolute inset-0 flex items-center justify-center p-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                        <svg viewBox="0 0 400 600" className="w-full h-full opacity-60">
                          <g stroke={isDarkMode ? "white" : "black"} strokeWidth="12" fill="none">
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
                      {currentTemplate === 'lego' && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => selectTemplate('house')}
                      className={`group relative aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden ${currentTemplate === 'house' ? 'border-blue-500 bg-blue-50' : isDarkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-900' : 'border-gray-100 hover:border-gray-300 bg-gray-50'}`}
                      title="Casa"
                    >
                      <div className={`absolute inset-0 flex items-center justify-center p-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                        <svg viewBox="10 70 380 500" className="w-full h-full opacity-60">
                          <g stroke={isDarkMode ? "white" : "black"} strokeWidth="15" fill="none">
                            <path d="M260 180 V100 H300 V190" />
                            <path d="M50 250 L200 100 L350 250 Z" />
                            <rect x="70" y="250" width="260" height="250" />
                            <rect x="160" y="380" width="80" height="120" />
                            <rect x="100" y="290" width="60" height="60" />
                            <rect x="240" y="290" width="60" height="60" />
                            <path d="M140 500 H260 V520 H140 Z" />
                            <path d="M130 520 H270 V540 H130 Z" />
                            <path d="M120 540 H280 V560 H120 Z" />
                          </g>
                        </svg>
                      </div>
                      {currentTemplate === 'house' && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => selectTemplate('boat')}
                      className={`group relative aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden ${currentTemplate === 'boat' ? 'border-blue-500 bg-blue-50' : isDarkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-900' : 'border-gray-100 hover:border-gray-300 bg-gray-50'}`}
                      title="Barca"
                    >
                      <div className={`absolute inset-0 flex items-center justify-center p-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                        <svg viewBox="20 40 360 520" className="w-full h-full opacity-60">
                          <g stroke={isDarkMode ? "white" : "black"} strokeWidth="15" fill="none">
                            <circle cx="80" cy="80" r="36" />
                            <path d="M260 80 C260 50 290 50 300 70 C310 40 350 45 360 70 C380 70 380 110 350 120 Z" />
                            <path d="M190 160 V480" strokeWidth="20" />
                            <path d="M185 205 L330 455 L185 465 Z" />
                            <path d="M80 505 Q80 570 150 585 Q280 590 370 505 L80 505" />
                            <path d="M40 560 Q70 540 100 560 T160 560 T220 560 T280 560 T340 560" strokeWidth="10" />
                          </g>
                        </svg>
                      </div>
                      {currentTemplate === 'boat' && (
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

        <div className="flex items-center gap-4">
          {/* Half White Half Black Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-10 rounded-full border-2 overflow-hidden shadow-sm active:scale-95 transition-all duration-300 border-black ${isDarkMode ? 'bg-gray-500' : 'bg-white'}`}
            title="Toggle theme"
            id="theme-toggle-btn"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="50" fill={isDarkMode ? "#9ca3af" : "white"} />
              <path 
                d="M50,0 A50,50 0 0,1 50,100 A25,25 0 0,1 50,50 A25,25 0 0,0 50,0" 
                fill={isDarkMode ? "white" : "black"} 
              />
              <circle cx="50" cy="25" r="8" fill={isDarkMode ? "#9ca3af" : "white"} />
              <circle cx="50" cy="75" r="8" fill={isDarkMode ? "white" : "black"} />
            </svg>
          </button>

          <div className="flex gap-1">
            <button
              onClick={undo}
              disabled={strokes.length === 0}
              className={`p-2 rounded-full transition-colors disabled:opacity-30 ${isDarkMode ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-gray-100 text-gray-900'}`}
              title="Undo"
              id="undo-btn"
            >
              <Undo2 size={24} />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className={`p-2 rounded-full transition-colors disabled:opacity-30 ${isDarkMode ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-gray-100 text-gray-900'}`}
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
        </div>
      </header>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className={`flex-1 relative cursor-crosshair touch-none overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-300' : 'bg-white'}`}
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
        {currentTemplate === 'house' && <HouseTemplate />}
        {currentTemplate === 'boat' && <BoatTemplate />}
        
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 z-10"
        />
      </div>

      {/* Footer Controls */}
      <footer className={`p-4 border-t shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] z-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-400 border-gray-500 shadow-xl' : 'bg-white border-gray-100 shadow-md'}`}>
        <div className="flex justify-center items-center gap-4 md:gap-8 max-w-lg mx-auto overflow-x-auto py-2 scrollbar-hide" id="color-palette">
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setCurrentColor(color.value)}
              className={`
                group relative flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full 
                transition-all duration-200 ease-out active:scale-95
                border border-black/10
                ${currentColor === color.value ? 'scale-110 shadow-xl ring-2 ring-blue-500 ring-offset-2 z-20' : 'hover:scale-105 shadow-md active:scale-90 z-10'}
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

