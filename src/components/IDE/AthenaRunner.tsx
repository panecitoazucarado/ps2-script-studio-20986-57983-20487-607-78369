// AthenaEnv Script Runner with 2D Canvas + 3D Canvas Support
import { useEffect, useRef, useState } from 'react';
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

  // Initialize VFS and API
  useEffect(() => {
    if (!canvas2DRef.current || !canvas3DRef.current) return;

    // Create Virtual File System
    vfsRef.current = new AthenaVirtualFS();

    // Load project files into VFS
    if (files) {
      const loadFiles = (nodes: FileNode[], basePath: string = '') => {
        nodes.forEach(node => {
          const fullPath = basePath + '/' + node.name;
          if (node.type === 'folder' && node.children) {
            vfsRef.current!.mkdir(fullPath);
            loadFiles(node.children, fullPath);
          } else if (node.type === 'file' && node.content) {
            vfsRef.current!.writeFile(fullPath, node.content);
          }
        });
      };
      loadFiles(files);
    }

    // Create AthenaEnv API
    apiRef.current = new AthenaEnvAPI(
      canvas2DRef.current,
      canvas3DRef.current,
      vfsRef.current,
      onLog
    );

    onLog('[SYSTEM] AthenaEnv initialized');
  }, [files, onLog]);

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

  // Execute code
  useEffect(() => {
    if (!isRunning || !code.trim() || !apiRef.current || !vfsRef.current) return;

    executionRef.current.isActive = true;

    try {
      const api = apiRef.current.createAPI();
      
      // Detect if code uses 3D (Render module)
      const uses3D = /Render\.|RenderObject|Camera\./i.test(code);
      setMode(uses3D ? '3D' : '2D');

      onLog('[SYSTEM] Executing AthenaEnv script...');

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

      // Create sandbox with tracked timers
      const sandbox = {
        ...api,
        setInterval: trackedSetInterval,
        setTimeout: trackedSetTimeout,
        requestAnimationFrame: trackedRequestAnimationFrame,
        // Block dangerous globals
        window: undefined,
        document: undefined,
        eval: undefined
      };

      // Execute user code in sandbox
      const fn = new Function(...Object.keys(sandbox), code);
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
  }, [code, isRunning, onLog]);

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
      <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-black/70 text-ps2-cyan text-xs font-mono border border-ps2-blue/30 rounded">
        {mode} MODE
      </div>
    </div>
  );
}
