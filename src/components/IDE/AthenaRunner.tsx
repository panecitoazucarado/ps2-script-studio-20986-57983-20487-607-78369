// AthenaEnv Script Runner with 2D Canvas + 3D Canvas Support
// Enhanced with full project file system integration
import { useEffect, useRef, useState, useCallback } from 'react';
import { AthenaVirtualFS } from '@/lib/athena/AthenaVirtualFS';
import { AthenaEnvAPI } from '@/lib/athena/AthenaEnvAPI';
import { FileNode } from '@/types/athena';

interface AthenaRunnerProps {
  code: string;
  isRunning: boolean;
  onLog: (message: string) => void;
  files?: FileNode[];
}

export function AthenaRunner({ code, isRunning, onLog, files }: AthenaRunnerProps) {
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const vfsRef = useRef<AthenaVirtualFS | null>(null);
  const apiRef = useRef<AthenaEnvAPI | null>(null);
  const executionRef = useRef<{
    intervals: number[];
    timeouts: number[];
    animationFrames: number[];
    isActive: boolean;
  }>({ intervals: [], timeouts: [], animationFrames: [], isActive: false });
  const [mode, setMode] = useState<'2D' | '3D'>('2D');
  const [filesLoaded, setFilesLoaded] = useState(0);

  // Initialize VFS and load project files
  const initializeVFS = useCallback(() => {
    if (!canvas2DRef.current || !canvas3DRef.current) return;

    // Create Virtual File System
    vfsRef.current = new AthenaVirtualFS();

    // Load project files into VFS using the enhanced method
    if (files && files.length > 0) {
      vfsRef.current.loadProjectFiles(files);
      const count = vfsRef.current.getProjectFileCount();
      setFilesLoaded(count);
      onLog(`[VFS] Loaded ${count} project files`);
    }

    // Create AthenaEnv API
    apiRef.current = new AthenaEnvAPI(
      canvas2DRef.current,
      canvas3DRef.current,
      vfsRef.current,
      onLog
    );

    onLog('[SYSTEM] AthenaEnv initialized with project file system');
  }, [files, onLog]);

  // Initialize on mount and when files change
  useEffect(() => {
    initializeVFS();
  }, [initializeVFS]);

  // Stop execution when isRunning becomes false
  useEffect(() => {
    if (!isRunning && executionRef.current.isActive) {
      // Clear all intervals
      executionRef.current.intervals.forEach(id => clearInterval(id));
      executionRef.current.timeouts.forEach(id => clearTimeout(id));
      executionRef.current.animationFrames.forEach(id => cancelAnimationFrame(id));
      
      // Reset tracking
      executionRef.current = {
        intervals: [],
        timeouts: [],
        animationFrames: [],
        isActive: false
      };

      // Reset API state and clear canvases
      if (apiRef.current) {
        apiRef.current.reset();
      }

      onLog('[SYSTEM] Ejecución detenida - Pantalla limpiada');
    }
  }, [isRunning, onLog]);

  // Find matching closing brace for a while loop
  const findMatchingBrace = useCallback((code: string, openIndex: number): number => {
    let depth = 0;
    for (let i = openIndex; i < code.length; i++) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }, []);

  // Pre-process code to handle PS2-specific syntax and transform while(true) to game loop
  const preprocessCode = useCallback((rawCode: string): string => {
    let processed = rawCode;
    
    // Remove float suffix (e.g., 2.0f -> 2.0)
    processed = processed.replace(/(\d+\.?\d*)f\b/g, '$1');
    
    // Handle JSON header comment if present
    const headerMatch = processed.match(/^\/\/\s*(\{.*?\})\s*\n/);
    if (headerMatch) {
      try {
        const header = JSON.parse(headerMatch[1]);
        onLog(`[INFO] Running: ${header.name || 'Script'} v${header.version || '1.0'}`);
      } catch (e) {
        // Ignore header parse errors
      }
    }
    
    // Transform while(true) { ... } into a requestAnimationFrame-based game loop
    // This prevents blocking the browser thread
    const whilePattern = /while\s*\(\s*true\s*\)\s*\{/;
    const match = processed.match(whilePattern);
    if (match && match.index !== undefined) {
      const braceStart = processed.indexOf('{', match.index);
      const braceEnd = findMatchingBrace(processed, braceStart);
      
      if (braceEnd !== -1) {
        const setupCode = processed.substring(0, match.index);
        const loopBody = processed.substring(braceStart + 1, braceEnd);
        const afterLoop = processed.substring(braceEnd + 1);
        
        processed = `${setupCode}
function __athenaGameLoop__() {
  try {
${loopBody}
  } catch(__e) {
    if (__e && __e.message === '__ATHENA_STOP__') return;
    throw __e;
  }
  requestAnimationFrame(__athenaGameLoop__);
}
requestAnimationFrame(__athenaGameLoop__);
${afterLoop}`;
      }
    }
    
    return processed;
  }, [onLog, findMatchingBrace]);

  // Execute code
  useEffect(() => {
    if (!isRunning || !code.trim() || !apiRef.current || !vfsRef.current) return;

    executionRef.current.isActive = true;

    try {
      const api = apiRef.current.createAPI();
      
      // Preprocess code
      const processedCode = preprocessCode(code);
      
      // Detect if code uses 3D (Render module)
      const uses3D = /Render\.|RenderObject|Camera\./i.test(processedCode);
      setMode(uses3D ? '3D' : '2D');

      onLog('[SYSTEM] Executing AthenaEnv script...');
      
      // Log available assets
      const paths = vfsRef.current.getAllPaths();
      if (paths.length > 0) {
        onLog(`[VFS] ${paths.length} assets available in project`);
      }

      // Wrap setInterval, setTimeout, requestAnimationFrame to track them
      const trackedSetInterval = (fn: Function, delay: number) => {
        const id = setInterval(() => {
          if (executionRef.current.isActive) fn();
        }, delay || 16) as unknown as number;
        executionRef.current.intervals.push(id);
        return id;
      };

      const trackedSetTimeout = (fn: Function, delay: number) => {
        const id = setTimeout(() => {
          if (executionRef.current.isActive) fn();
        }, delay || 0) as unknown as number;
        executionRef.current.timeouts.push(id);
        return id;
      };

      const trackedRequestAnimationFrame = (fn: Function) => {
        const wrappedFn = () => {
          if (executionRef.current.isActive) {
            fn();
            const id = requestAnimationFrame(wrappedFn);
            executionRef.current.animationFrames.push(id);
          }
        };
        const id = requestAnimationFrame(wrappedFn);
        executionRef.current.animationFrames.push(id);
        return id;
      };

      // Create sandbox with tracked timers and all API modules
      const sandbox = {
        ...api,
        setInterval: trackedSetInterval,
        setTimeout: trackedSetTimeout,
        requestAnimationFrame: trackedRequestAnimationFrame,
        clearInterval: (id: number) => {
          clearInterval(id);
          executionRef.current.intervals = executionRef.current.intervals.filter(i => i !== id);
        },
        clearTimeout: (id: number) => {
          clearTimeout(id);
          executionRef.current.timeouts = executionRef.current.timeouts.filter(i => i !== id);
        },
        // Block dangerous globals
        window: undefined,
        document: undefined,
        eval: undefined,
        Function: undefined
      };

      // Execute user code in sandbox
      const fn = new Function(...Object.keys(sandbox), processedCode);
      fn(...Object.values(sandbox));

      onLog('[SYSTEM] Script ejecutado exitosamente');
    } catch (error: any) {
      onLog(`[ERROR] ${error.message || error}`);
      console.error('AthenaEnv execution error:', error);
      executionRef.current.isActive = false;
    }

    // Cleanup on component unmount or when code changes
    return () => {
      if (executionRef.current.isActive) {
        executionRef.current.intervals.forEach(id => clearInterval(id));
        executionRef.current.timeouts.forEach(id => clearTimeout(id));
        executionRef.current.animationFrames.forEach(id => cancelAnimationFrame(id));
      }
    };
  }, [code, isRunning, onLog, preprocessCode]);

  return (
    <div className="w-full h-full relative bg-black">
      {/* 2D Canvas */}
      <canvas
        ref={canvas2DRef}
        className={`absolute inset-0 w-full h-full ${mode === '2D' ? 'z-10' : 'z-0'}`}
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* 3D Canvas - Hidden when not in use */}
      <canvas
        ref={canvas3DRef}
        className={`absolute inset-0 w-full h-full ${mode === '3D' ? 'z-10' : 'z-0'}`}
      />

      {/* Mode indicator */}
      <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-black/70 text-ps2-cyan text-xs font-mono border border-ps2-blue/30 rounded flex items-center gap-2">
        <span>{mode} MODE</span>
        {filesLoaded > 0 && (
          <span className="text-ps2-green text-[10px]">
            {filesLoaded} files
          </span>
        )}
      </div>
    </div>
  );
}
