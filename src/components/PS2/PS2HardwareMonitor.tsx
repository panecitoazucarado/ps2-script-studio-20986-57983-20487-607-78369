import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  Thermometer,
  Activity,
  MemoryStick
} from 'lucide-react';

interface PS2HardwareMonitorProps {
  isRunning: boolean;
  frameCount: number;
}

interface PS2HardwareState {
  ee: {
    usage: number;
    frequency: number;
    temperature: number;
  };
  gs: {
    usage: number;
    vramUsed: number;
    vramTotal: number;
    fillRate: number;
  };
  iop: {
    usage: number;
    frequency: number;
  };
  memory: {
    ramUsed: number;
    ramTotal: number;
    cacheHits: number;
  };
  fps: number;
  frameTime: number;
}

export function PS2HardwareMonitor({ isRunning, frameCount }: PS2HardwareMonitorProps) {
  const [hardwareState, setHardwareState] = useState<PS2HardwareState>({
    ee: { usage: 0, frequency: 294.912, temperature: 45 },
    gs: { usage: 0, vramUsed: 0, vramTotal: 4096, fillRate: 0 },
    iop: { usage: 0, frequency: 37.5 },
    memory: { ramUsed: 0, ramTotal: 32768, cacheHits: 95 },
    fps: 0,
    frameTime: 16.67
  });

  useEffect(() => {
    if (!isRunning) {
      setHardwareState(prev => ({
        ...prev,
        ee: { ...prev.ee, usage: 0 },
        gs: { ...prev.gs, usage: 0, fillRate: 0 },
        iop: { ...prev.iop, usage: 0 },
        fps: 0
      }));
      return;
    }

    const interval = setInterval(() => {
      setHardwareState(prev => ({
        ee: {
          usage: Math.random() * 85 + 10, // 10-95% usage
          frequency: 294.912,
          temperature: 45 + Math.random() * 15 // 45-60°C
        },
        gs: {
          usage: Math.random() * 70 + 20, // 20-90% usage
          vramUsed: Math.random() * 2048 + 512, // 512KB - 2.5MB used
          vramTotal: 4096,
          fillRate: Math.random() * 1600 + 400 // 400-2000 MPixels/sec
        },
        iop: {
          usage: Math.random() * 40 + 5, // 5-45% usage
          frequency: 37.5
        },
        memory: {
          ramUsed: Math.random() * 16384 + 8192, // 8-24MB used
          ramTotal: 32768,
          cacheHits: 92 + Math.random() * 6 // 92-98% cache hits
        },
        fps: isRunning ? 58 + Math.random() * 4 : 0, // 58-62 FPS
        frameTime: 16.67 + Math.random() * 2 - 1 // ±1ms variation
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning]);

  const getUsageColor = (usage: number) => {
    if (usage < 30) return 'text-ps2-green';
    if (usage < 70) return 'text-ps2-orange';
    return 'text-ps2-red';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 50) return 'text-ps2-cyan';
    if (temp < 60) return 'text-ps2-orange';
    return 'text-ps2-red';
  };

  return (
    <Card className="bg-black/90 border-ps2-blue/30 text-ps2-cyan">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ps2-blue">PS2 Hardware Monitor</h3>
          <Badge variant="outline" className="border-ps2-green text-ps2-green">
            {isRunning ? 'ACTIVE' : 'IDLE'}
          </Badge>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* FPS & Frame Time */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3" />
              <span>FPS: <span className={getUsageColor(hardwareState.fps)}>{hardwareState.fps.toFixed(1)}</span></span>
            </div>
            <div className="text-muted-foreground">
              Frame: {hardwareState.frameTime.toFixed(2)}ms
            </div>
          </div>

          {/* Frame Count */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span>Frames: <span className="text-ps2-purple">{frameCount}</span></span>
            </div>
            <div className="text-muted-foreground">
              Total rendered
            </div>
          </div>
        </div>

        {/* EE (Emotion Engine) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3 text-ps2-purple" />
              <span className="text-xs font-medium">EE CPU</span>
            </div>
            <span className={`text-xs ${getUsageColor(hardwareState.ee.usage)}`}>
              {hardwareState.ee.usage.toFixed(1)}%
            </span>
          </div>
          <Progress value={hardwareState.ee.usage} className="h-1" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{hardwareState.ee.frequency}MHz</span>
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3" />
              <span className={getTemperatureColor(hardwareState.ee.temperature)}>
                {hardwareState.ee.temperature.toFixed(1)}°C
              </span>
            </div>
          </div>
        </div>

        {/* GS (Graphics Synthesizer) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-ps2-green" />
              <span className="text-xs font-medium">GS GPU</span>
            </div>
            <span className={`text-xs ${getUsageColor(hardwareState.gs.usage)}`}>
              {hardwareState.gs.usage.toFixed(1)}%
            </span>
          </div>
          <Progress value={hardwareState.gs.usage} className="h-1" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fill: {hardwareState.gs.fillRate.toFixed(0)} MP/s</span>
            <span>
              VRAM: {(hardwareState.gs.vramUsed / 1024).toFixed(1)}MB / {(hardwareState.gs.vramTotal / 1024).toFixed(1)}MB
            </span>
          </div>
        </div>

        {/* IOP (Input/Output Processor) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3 h-3 text-ps2-orange" />
              <span className="text-xs font-medium">IOP</span>
            </div>
            <span className={`text-xs ${getUsageColor(hardwareState.iop.usage)}`}>
              {hardwareState.iop.usage.toFixed(1)}%
            </span>
          </div>
          <Progress value={hardwareState.iop.usage} className="h-1" />
          <div className="text-xs text-muted-foreground">
            {hardwareState.iop.frequency}MHz R3000A
          </div>
        </div>

        {/* Memory */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-3 h-3 text-ps2-cyan" />
              <span className="text-xs font-medium">RAM</span>
            </div>
            <span className="text-xs">
              {(hardwareState.memory.ramUsed / 1024).toFixed(1)}MB / {(hardwareState.memory.ramTotal / 1024).toFixed(0)}MB
            </span>
          </div>
          <Progress 
            value={(hardwareState.memory.ramUsed / hardwareState.memory.ramTotal) * 100} 
            className="h-1" 
          />
          <div className="text-xs text-muted-foreground">
            Cache hits: {hardwareState.memory.cacheHits.toFixed(1)}%
          </div>
        </div>
      </div>
    </Card>
  );
}