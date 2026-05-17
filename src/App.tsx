/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState, MouseEvent, TouchEvent } from 'react';
import { Undo2, Redo2, Eraser, MousePointer2, Trash2, ChevronDown, Check, X, Settings, Eye, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { supabase } from './lib/supabase';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface ColorMapping {
  [templateId: string]: {
    [colorHex: string]: string;
  };
}

const COLORS = [
  { name: 'Red', value: '#ff0000' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Yellow', value: '#ffff00' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#ffaa00' },
  { name: 'Black', value: '#000000' },
];

const TEMPLATES = [
  { id: 'none', name: 'Foglio Bianco' },
  { id: 'lego', name: 'Omino Lego' },
  { id: 'house', name: 'Casa' },
  { id: 'boat', name: 'Barca' },
];

const LegoManTemplate = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 overflow-hidden">
    <svg viewBox="-20 -30 440 660" className="w-[108%] h-[108%] md:w-[102%] md:h-[102%] aspect-[2/3]">
      <g stroke="black" strokeWidth="3" fill="white">
        <path d="M155 125 V175 Q155 185 165 185 H235 Q245 185 245 175 V125 H155 Z" />
        <path d="M145 110 Q145 60 200 60 Q255 60 255 110" />
        <path d="M125 110 Q125 105 135 105 H265 Q275 105 275 110 L285 125 H115 Z" />
        <rect x="185" y="65" width="30" height="10" rx="2" />
        <g strokeWidth="2.5" fill="none">
          <circle cx="180" cy="145" r="15" />
          <circle cx="220" cy="145" r="15" />
          <line x1="195" y1="145" x2="205" y2="145" />
        </g>
        <path d="M185 170 Q200 178 215 170" strokeWidth="2.5" fill="none" />
        <rect x="185" y="185" width="30" height="15" />
        <path d="M190 200 H210 L255 210 Q285 205 295 235 L330 330 L300 340 L265 255 L285 365 H115 L135 255 L100 340 L70 330 L105 235 Q115 205 145 210 L190 200 Z" />
        {/* Cravatta realistica */}
        <path d="M194 200 L206 200 L208 215 L192 215 Z" fill="white" stroke="black" strokeWidth="2.5" /> 
        <path d="M192 215 L208 215 L212 300 L200 325 L188 300 Z" fill="white" stroke="black" strokeWidth="2.5" />
        <circle cx="315" cy="365" r="15" />
        <circle cx="85" cy="365" r="15" />
        <path d="M205 365 H260 V550 H275 Q285 550 285 565 V580 H205 Z" />
        <path d="M140 365 H195 V580 H115 V565 Q115 550 125 550 H140 Z" />
        <line x1="205" y1="550" x2="285" y2="550" strokeWidth="3" />
        <line x1="115" y1="550" x2="195" y2="550" strokeWidth="3" />
        <rect x="195" y="365" width="10" height="40" fill="none" />
      </g>
    </svg>
  </div>
);

const HouseTemplate = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 overflow-hidden">
    <svg viewBox="0 0 400 600" className="w-[90%] h-[90%] md:w-[85%] md:h-[85%] aspect-[2/3]">
      <g stroke="black" strokeWidth="3" fill="white">
        <path d="M260 180 V100 H300 V210" />
        <path d="M50 250 L200 100 L350 250 Z" />
        <rect x="70" y="250" width="260" height="250" />
        <rect x="160" y="380" width="80" height="120" />
        <circle cx="225" cy="440" r="4" fill="black" />
        <rect x="100" y="290" width="60" height="60" />
        <line x1="100" y1="320" x2="160" y2="320" fill="none" />
        <line x1="130" y1="290" x2="130" y2="350" fill="none" />
        <rect x="240" y="290" width="60" height="60" />
        <line x1="240" y1="320" x2="300" y2="320" fill="none" />
        <line x1="270" y1="290" x2="270" y2="350" fill="none" />
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
        <path d="M280 120 C280 90 310 90 320 110 C330 80 370 85 380 110 C400 110 400 150 370 160 C370 190 300 190 280 160 C260 160 260 120 280 120 Z" />
        <path d="M190 170 V490" strokeWidth="6" />
        <path d="M190 170 H140 V205 H190 Z" />
        <path d="M185 215 L340 465 L185 475 Z" />
        <path d="M80 490 Q80 560 150 585 Q280 590 370 490 L80 490" />
        <path d="M160 490 L170 455 H260 L270 490" />
        <circle cx="190" cy="472" r="5" />
        <circle cx="215" cy="472" r="5" />
        <circle cx="240" cy="472" r="5" />
        <path d="M-40 560 Q0 535 40 560 T120 560 T200 560 T280 560 T360 560 T440 560 V650 H-40 Z" fill="white" strokeWidth="6" />
        <path d="M-20 585 Q20 560 60 585 T140 585 T220 585 T300 585 T380 585 T460 585" fill="none" strokeWidth="6" />
      </g>
    </svg>
  </div>
);

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[5].value);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<string>('none');
  const [showMenu, setShowMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [showSecretMenu, setShowSecretMenu] = useState(false);
  const [isPeekMode, setIsPeekMode] = useState(false);
  const [colorMappings, setColorMappings] = useState<ColorMapping>(() => {
    const saved = localStorage.getItem('picasso_color_mappings');
    return saved ? JSON.parse(saved) : {};
  });
  const [lastBlackClick, setLastBlackClick] = useState(0);
  const [peekNumberColor, setPeekNumberColor] = useState(() => localStorage.getItem('picasso_peek_color') || '#ffffff');
  const [peekNumberSize, setPeekNumberSize] = useState(() => Number(localStorage.getItem('picasso_peek_size')) || 40);
  const [peekPosition, setPeekPosition] = useState(() => {
    const saved = localStorage.getItem('picasso_peek_position');
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });
  const [isCalibratingPeek, setIsCalibratingPeek] = useState(true);
  const [receivedNumber, setReceivedNumber] = useState<string | null>(null);
  const [isVibrationEnabled, setIsVibrationEnabled] = useState(() => localStorage.getItem('picasso_vibrate_peek') === 'true');
  const [isRecallVibrationEnabled, setIsRecallVibrationEnabled] = useState(() => localStorage.getItem('picasso_recall_vibrate') === 'true');
  const [isNumberVisible, setIsNumberVisible] = useState(() => localStorage.getItem('picasso_show_number_peek') !== 'false');

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('picasso_peek_color', peekNumberColor);
    localStorage.setItem('picasso_peek_size', peekNumberSize.toString());
    localStorage.setItem('picasso_peek_position', JSON.stringify(peekPosition));
    localStorage.setItem('picasso_vibrate_peek', isVibrationEnabled.toString());
    localStorage.setItem('picasso_recall_vibrate', isRecallVibrationEnabled.toString());
    localStorage.setItem('picasso_show_number_peek', isNumberVisible.toString());
  }, [peekNumberColor, peekNumberSize, peekPosition, isVibrationEnabled, isRecallVibrationEnabled, isNumberVisible]);

  // Handle Vibration logic based on received number
  useEffect(() => {
    if (!receivedNumber || !isVibrationEnabled || !('vibrate' in navigator)) return;

    const n = receivedNumber.trim();
    let pattern: number[] = [];

    if (n === '1') pattern = [300];
    else if (n === '2') pattern = [300, 100, 300];
    else if (n === '3') pattern = [300, 100, 300, 100, 300];
    else if (n === '4') pattern = [600];
    else if (n === '5') pattern = [600, 200, 300];

    if (pattern.length > 0) {
      navigator.vibrate(pattern);

      // Recall vibration after 2 seconds if enabled
      if (isRecallVibrationEnabled) {
        const timeoutId = setTimeout(() => {
          navigator.vibrate(pattern);
        }, 2000 + pattern.reduce((a, b) => a + b, 0)); // Delay after first sequence ends
        return () => clearTimeout(timeoutId);
      }
    }
  }, [receivedNumber, isVibrationEnabled, isRecallVibrationEnabled]);

  // Screen Wake Lock logic for mobile
  useEffect(() => {
    if (!isPeekMode) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error('Wake Lock request failed:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPeekMode]);

  // Sync Color Mappings from Supabase
  useEffect(() => {
    if (!supabase) return;

    const fetchMappings = async () => {
      const { data, error } = await supabase.from('color_mappings').select('*');
      if (data && !error) {
        const mappings: ColorMapping = {};
        data.forEach((row: any) => {
          if (!mappings[row.template_id]) mappings[row.template_id] = {};
          mappings[row.template_id][row.color_hex] = row.mapping_value;
        });
        setColorMappings(mappings);
        localStorage.setItem('picasso_color_mappings', JSON.stringify(mappings));
      }
    };

    fetchMappings();

    const channel = supabase
      .channel('color_mappings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'color_mappings' }, () => {
        fetchMappings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  // Supabase Realtime Signal Handling
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel('picasso-secret-room', {
      config: {
        broadcast: { self: true },
      },
    });

    channel
      .on('broadcast', { event: 'signal' }, (payload) => {
        console.log('Signal received:', payload);
        setReceivedNumber(payload.payload.number);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendSignal = async (number: string) => {
    if (!supabase) return;
    
    // Broadcast via Supabase Realtime
    const channel = supabase.channel('picasso-secret-room');
    await channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: { number, timestamp: Date.now() },
    });
  };

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
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    const coords = getCoordinates(e);
    if (!coords) return;
    setIsDrawing(true);
    setCurrentStroke({ points: [coords], color: currentColor, width: 11 });
    setRedoStack([]);
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing || !currentStroke) return;
    if (e.cancelable) e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    setCurrentStroke({ ...currentStroke, points: [...currentStroke.points, coords] });
  };

  const endDrawing = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    setStrokes([...strokes, currentStroke]);
    setCurrentStroke(null);
  };

  const handleColorClick = (colorVal: string) => {
    if (colorVal === '#000000' && currentColor === '#000000') {
      const now = Date.now();
      if (now - lastBlackClick < 300) {
        setShowSecretMenu(true);
      }
      setLastBlackClick(now);
    }
    setCurrentColor(colorVal);
    const mapping = colorMappings[currentTemplate]?.[colorVal];
    if (mapping && mapping.trim() !== '') sendSignal(mapping);
  };

  const updateMapping = (templateId: string, colorVal: string, value: string) => {
    const newMappings = { ...colorMappings, [templateId]: { ...(colorMappings[templateId] || {}), [colorVal]: value } };
    setColorMappings(newMappings);
    localStorage.setItem('picasso_color_mappings', JSON.stringify(newMappings));
  };

  const handleSaveToSupabase = async () => {
    const password = prompt("Inserisci la password per salvare:");
    if (password !== "1234") {
      alert("Password errata!");
      return;
    }

    if (!supabase) {
      alert("Supabase non configurato correttamente!");
      return;
    }

    try {
      const rowsToUpsert = [];
      for (const tempId in colorMappings) {
        for (const colHex in colorMappings[tempId]) {
          rowsToUpsert.push({
            id: `${tempId}-${colHex}`,
            template_id: tempId,
            color_hex: colHex,
            mapping_value: colorMappings[tempId][colHex]
          });
        }
      }

      if (rowsToUpsert.length > 0) {
        const { error } = await supabase.from('color_mappings').upsert(rowsToUpsert);
        if (error) throw error;
        alert("Impostazioni salvate correttamente su Supabase per tutti gli utenti!");
      }
    } catch (err) {
      console.error("Errore durante il salvataggio:", err);
      alert("Errore durante il salvataggio. Controlla la console.");
    }
  };

  const requestFullScreen = () => {
    const docElm = document.documentElement;
    const request = docElm.requestFullscreen || 
                   (docElm as any).webkitRequestFullscreen || 
                   (docElm as any).mozRequestFullScreen || 
                   (docElm as any).msRequestFullscreen;
    
    if (request) {
      request.call(docElm).catch(() => {
        // Fail silently
      });
    }
  };

  const exitFullScreen = () => {
    if (document.fullscreenElement) {
      const exit = document.exitFullscreen ||
                  (document as any).webkitExitFullscreen ||
                  (document as any).mozCancelFullScreen ||
                  (document as any).msExitFullscreen;
      if (exit) exit.call(document);
    }
  };

  if (showSecretMenu) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-50 flex flex-col font-sans overflow-y-auto">
        <header className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center"><Settings size={18} className="text-white" /></div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Area Segreta</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveToSupabase}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-full font-bold active:scale-95 transition-all shadow-md hover:bg-green-700"
            >
              SAVE
            </button>
            <button 
              onClick={() => {
                setIsPeekMode(true);
                setShowSecretMenu(false);
                requestFullScreen();
              }} 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-medium active:scale-95 transition-all shadow-md"
            >
              <Eye size={18} />Peek Mode
            </button>
            <button onClick={() => setShowSecretMenu(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-sm md:text-base">Configura i codici numerici per ogni colore. Questi codici verranno trasmessi in tempo reale quando il colore viene selezionato.</div>
          <div className="space-y-12">
            {TEMPLATES.map(template => (
              <section key={template.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-4 pb-2 border-b"><span className="text-lg font-bold text-gray-800 uppercase tracking-widest">{template.name}</span></div>
                
                {/* Two-row layout: Colors row, then Input row */}
                <div className="space-y-6">
                   <div className="grid grid-cols-6 gap-2">
                    {COLORS.map(color => (
                        <div key={`color-${template.id}-${color.name}`} className="flex items-center justify-center">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-gray-100 shadow-inner" style={{ backgroundColor: color.value }} />
                        </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {COLORS.map(color => (
                        <div key={`input-${template.id}-${color.name}`}>
                          <input 
                            type="text" 
                            value={colorMappings[template.id]?.[color.value] || ''} 
                            onChange={(e) => updateMapping(template.id, color.value, e.target.value)} 
                            placeholder="N#" 
                            className="w-full px-1 py-2 border rounded-lg text-center font-mono font-bold text-base focus:ring-2 focus:ring-blue-500 outline-none" 
                          />
                        </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (isPeekMode) {
    const displayNum = receivedNumber || (isCalibratingPeek ? "8" : null);

    return (
      <div 
        className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden"
        onDoubleClick={() => setIsCalibratingPeek(true)}
      >
        {/* Ready indicator dot */}
        {!isCalibratingPeek && (
          <div 
            className="absolute top-1 right-1 w-[3px] h-[3px] rounded-full z-[210]" 
            style={{ backgroundColor: peekNumberColor }}
          />
        )}

        <div className="flex-1 flex items-center justify-center w-full relative">
          {displayNum && isNumberVisible && (
            <motion.div
              drag
              dragMomentum={false}
              onDragEnd={(_, info) => {
                setPeekPosition({ x: peekPosition.x + info.offset.x, y: peekPosition.y + info.offset.y });
              }}
              animate={{ x: peekPosition.x, y: peekPosition.y }}
              className="cursor-move touch-none p-8"
              style={{ 
                color: peekNumberColor,
                transform: `translate(${peekPosition.x}px, ${peekPosition.y}px)`
              }}
            >
              <motion.span 
                key={displayNum} 
                initial={{ scale: 0.5, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="font-black leading-none select-none italic block" 
                style={{ fontSize: `${peekNumberSize}vh` }}
              >
                {displayNum}
              </motion.span>
            </motion.div>
          )}
        </div>
        
        <AnimatePresence>
          {isCalibratingPeek && (
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 500 }} className="absolute bottom-0 inset-x-0 bg-gray-950 border-t border-gray-800 p-6 md:p-8 flex flex-col items-center gap-6 z-[250] shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
                {/* Sliders Container */}
                <div className="space-y-6">
                  {/* Color Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/50 justify-between"><div className="flex items-center gap-2"><SlidersHorizontal size={14} /><span className="uppercase text-[10px] tracking-widest font-bold">Luminosità</span></div><span className="text-[10px] font-mono">{peekNumberColor}</span></div>
                    <input 
                      type="range" 
                      min="20" 
                      max="255" 
                      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white" 
                      onChange={(e) => { 
                        const val = parseInt(e.target.value).toString(16).padStart(2, '0'); 
                        setPeekNumberColor(`#${val}${val}${val}`); 
                      }} 
                    />
                  </div>

                  {/* Size Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white/50 justify-between"><div className="flex items-center gap-2"><SlidersHorizontal size={14} /><span className="uppercase text-[10px] tracking-widest font-bold">Dimensione</span></div><span className="text-[10px] font-mono">{peekNumberSize}%</span></div>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={peekNumberSize}
                      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white" 
                      onChange={(e) => setPeekNumberSize(parseInt(e.target.value))} 
                    />
                  </div>
                </div>

                {/* Toggles Container */}
                <div className="flex flex-col gap-4 justify-center">
                  <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isVibrationEnabled ? 'bg-orange-500/20 text-orange-500' : 'bg-gray-800 text-gray-500'}`}><Settings size={16} /></div>
                      <div>
                        <div className="text-white text-xs font-bold uppercase tracking-tight">Vibrate Peek</div>
                        <div className="text-[9px] text-white/40">Vibrazione sui segnali 1-5</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsVibrationEnabled(!isVibrationEnabled)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${isVibrationEnabled ? 'bg-orange-500' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${isVibrationEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRecallVibrationEnabled ? 'bg-purple-500/20 text-purple-500' : 'bg-gray-800 text-gray-500'}`}><Undo2 size={16} /></div>
                      <div>
                        <div className="text-white text-xs font-bold uppercase tracking-tight">Recall Vibrate</div>
                        <div className="text-[9px] text-white/40">Ripete dopo 2 secondi</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsRecallVibrationEnabled(!isRecallVibrationEnabled)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${isRecallVibrationEnabled ? 'bg-purple-500' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${isRecallVibrationEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isNumberVisible ? 'bg-blue-500/20 text-blue-500' : 'bg-gray-800 text-gray-500'}`}><Eye size={16} /></div>
                      <div>
                        <div className="text-white text-xs font-bold uppercase tracking-tight">Number Peek</div>
                        <div className="text-[9px] text-white/40">Mostra cifra visivamente</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsNumberVisible(!isNumberVisible)}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${isNumberVisible ? 'bg-blue-500' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${isNumberVisible ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <button 
                  onClick={() => setIsCalibratingPeek(false)} 
                  className="px-12 py-3 bg-white text-black rounded-full font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-white/10"
                >
                  OK
                </button>
                <button 
                  onClick={() => { 
                    setIsPeekMode(false); 
                    setReceivedNumber(null); 
                    exitFullScreen();
                  }} 
                  className="p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 active:scale-95 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const undo = () => { if (strokes.length === 0) return; const lastStroke = strokes[strokes.length - 1]; setRedoStack([...redoStack, lastStroke]); setStrokes(strokes.slice(0, -1)); };
  const redo = () => { if (redoStack.length === 0) return; const nextStroke = redoStack[redoStack.length - 1]; setStrokes([...strokes, nextStroke]); setRedoStack(redoStack.slice(0, -1)); };
  const clear = () => { setStrokes([]); setRedoStack([]); };
  const toggleMenu = () => setShowMenu(!showMenu);
  const selectTemplate = (id: string) => { setCurrentTemplate(id); setShowMenu(false); };

  return (
    <div className={`flex flex-col h-[100dvh] font-sans overflow-hidden select-none transition-colors duration-300 ${isDarkMode ? 'bg-gray-300' : 'bg-white'}`}>
      <header className={`p-4 flex justify-between items-center z-50 relative shrink-0 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} border-b`}>
        <div className="relative">
          <button onClick={toggleMenu} className="flex items-center gap-1 group" id="picasso-title-btn">
            <h1 className={`text-xl font-bold tracking-tight transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} group-hover:text-blue-600`}>Picasso Artist</h1>
            <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setShowMenu(false)} />
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl border overflow-hidden z-50 p-3 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-black' : 'bg-white border-gray-100 shadow-gray-200'}`} id="template-menu">
                  <div className="grid grid-cols-2 gap-3">
                    {TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => selectTemplate(t.id)} className={`group relative aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden ${currentTemplate === t.id ? 'border-blue-500 bg-blue-50' : isDarkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-900' : 'border-gray-100 hover:border-gray-300 bg-gray-50'}`} title={t.name}>
                        <div className={`absolute inset-0 flex items-center justify-center p-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                          {t.id === 'none' ? <div className={`w-full h-full border border-dashed rounded ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} /> : 
                           t.id === 'lego' ? <svg viewBox="0 0 400 600" className="w-full h-full opacity-60"><g stroke={isDarkMode ? "white" : "black"} strokeWidth="12" fill="none"><path d="M145 110 Q145 60 200 60 Q255 60 255 110" /><path d="M125 110 Q125 105 135 105 H265 Q275 105 275 110 L285 125 H115 Z" /><path d="M155 125 V175 Q155 185 165 185 H235 Q245 185 235 185 V125 H155 Z" /><path d="M190 200 H210 L255 210 Q285 205 295 235 L330 330 L300 340 L265 255 L285 365 H115 L135 255 L100 340 L70 330 L105 235 Q115 205 145 210 L190 200 Z" /><path d="M194 200 L206 200 L208 215 L192 215 Z" /><path d="M192 215 L208 215 L212 300 L200 325 L188 300 Z" /><circle cx="315" cy="365" r="30" /><circle cx="85" cy="365" r="30" /><path d="M205 365 H260 V550 H275 Q285 550 285 565 V580 H205 Z" /><path d="M140 365 H195 V580 H115 V565 Q115 550 125 550 H140 Z" /><line x1="205" y1="550" x2="285" y2="550" /><line x1="115" y1="550" x2="195" y2="550" /></g></svg> :
                           t.id === 'house' ? <svg viewBox="10 70 380 500" className="w-full h-full opacity-60"><g stroke={isDarkMode ? "white" : "black"} strokeWidth="15" fill="none"><path d="M260 180 V100 H300 V190" /><path d="M50 250 L200 100 L350 250 Z" /><rect x="70" y="250" width="260" height="250" /><rect x="160" y="380" width="80" height="120" /><rect x="100" y="290" width="60" height="60" /><rect x="240" y="290" width="60" height="60" /><path d="M140 500 H260 V520 H140 Z" /><path d="M130 520 H270 V540 H130 Z" /><path d="M120 540 H280 V560 H120 Z" /></g></svg> :
                           <svg viewBox="20 40 360 520" className="w-full h-full opacity-60"><g stroke={isDarkMode ? "white" : "black"} strokeWidth="15" fill="none"><circle cx="80" cy="80" r="36" /><path d="M260 80 C260 50 290 50 300 70 C310 40 350 45 360 70 C380 70 380 110 350 120 Z" /><path d="M190 160 V480" strokeWidth="20" /><path d="M185 205 L330 455 L185 465 Z" /><path d="M80 505 Q80 570 150 585 Q280 590 370 505 L80 505" /><path d="M40 560 Q70 540 100 560 T160 560 T220 560 T280 560 T340 560" strokeWidth="10" /></g></svg>
                          }
                        </div>
                        {currentTemplate === t.id && <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm"><Check size={10} strokeWidth={3} /></div>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-[34px] h-[34px] ml-4 rounded-full border-2 overflow-hidden shadow-sm active:scale-95 transition-all duration-300 border-black ${isDarkMode ? 'bg-gray-500' : 'bg-white'}`} title="Toggle theme">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="50" fill={isDarkMode ? "#9ca3af" : "white"} />
              <path d="M50,0 A50,50 0 0,1 50,100 A25,25 0 0,1 50,50 A25,25 0 0,0 50,0" fill={isDarkMode ? "white" : "black"} />
              <circle cx="50" cy="25" r="8" fill={isDarkMode ? "#9ca3af" : "white"} />
              <circle cx="50" cy="75" r="8" fill={isDarkMode ? "white" : "black"} />
            </svg>
          </button>
          <div className="flex gap-1">
            <button onClick={undo} disabled={strokes.length === 0} className={`p-2 rounded-full transition-colors disabled:opacity-30 ${isDarkMode ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-gray-100 text-gray-900'}`} title="Undo"><Undo2 size={24} /></button>
            <button onClick={redo} disabled={redoStack.length === 0} className={`p-2 rounded-full transition-colors disabled:opacity-30 ${isDarkMode ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-gray-100 text-gray-900'}`} title="Redo"><Redo2 size={24} /></button>
            <button onClick={clear} className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors" title="Clear All"><Trash2 size={24} /></button>
          </div>
        </div>
      </header>
      <div ref={containerRef} className={`flex-1 relative cursor-crosshair touch-none overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-300' : 'bg-white'}`} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={endDrawing} onMouseLeave={endDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={endDrawing}>
        {currentTemplate === 'lego' && <LegoManTemplate />}
        {currentTemplate === 'house' && <HouseTemplate />}
        {currentTemplate === 'boat' && <BoatTemplate />}
        <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      </div>
      <footer className={`p-4 border-t shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] z-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-400 border-gray-500 shadow-xl' : 'bg-white border-gray-100 shadow-md'}`}>
        <div className="flex justify-center items-center gap-4 md:gap-8 max-w-lg mx-auto overflow-x-auto py-2 scrollbar-hide" id="color-palette">
          {COLORS.map((color) => (
            <button key={color.name} onClick={() => handleColorClick(color.value)} className={`group relative flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full transition-all duration-200 ease-out active:scale-95 border border-black/10 ${currentColor === color.value ? 'scale-110 shadow-xl ring-2 ring-blue-500 ring-offset-2 z-20' : 'hover:scale-105 shadow-md active:scale-90 z-10'}`} style={{ backgroundColor: color.value }} title={color.name} />
          ))}
        </div>
      </footer>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
