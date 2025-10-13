import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface PS2EngineProps {
  code: string;
  isRunning: boolean;
  onLog: (message: string) => void;
}

interface PS2Object {
  id: string;
  type: 'mesh' | 'text' | 'sprite';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  geometry?: {
    type: 'box' | 'sphere' | 'plane' | 'custom';
    parameters?: any;
    vertices?: Float32Array;
  };
  material?: {
    type: 'basic' | 'phong' | 'lambert';
    properties?: any;
  };
  text?: string;
  visible: boolean;
}

// PS2 Graphics State
class PS2GraphicsState {
  public objects: Map<string, PS2Object> = new Map();
  public camera = {
    position: [0, 0, 5] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 75,
    near: 0.1,
    far: 1000
  };
  public lights: Array<{
    type: 'ambient' | 'directional' | 'point';
    color: string;
    intensity: number;
    position?: [number, number, number];
  }> = [];
  public clearColor = '#000000';
  public frameCount = 0;

  clear(color = '#000000') {
    this.clearColor = color;
    this.objects.clear();
  }

  addObject(id: string, obj: Partial<PS2Object>) {
    this.objects.set(id, {
      id,
      type: 'mesh',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#ffffff',
      visible: true,
      ...obj
    } as PS2Object);
  }

  setCamera(config: Partial<typeof this.camera>) {
    Object.assign(this.camera, config);
  }

  addLight(light: typeof this.lights[0]) {
    this.lights.push(light);
  }

  frame() {
    this.frameCount++;
  }
}

// Scene Renderer Component
function PS2Scene({ gs }: { gs: PS2GraphicsState }) {
  const { scene } = useThree();

  useEffect(() => {
    // Clear existing objects
    scene.clear();

    // Add lights
    gs.lights.forEach(light => {
      let lightObj: THREE.Light;
      switch (light.type) {
        case 'ambient':
          lightObj = new THREE.AmbientLight(light.color, light.intensity);
          break;
        case 'directional':
          lightObj = new THREE.DirectionalLight(light.color, light.intensity);
          if (light.position) {
            lightObj.position.set(...light.position);
          }
          break;
        case 'point':
          lightObj = new THREE.PointLight(light.color, light.intensity);
          if (light.position) {
            lightObj.position.set(...light.position);
          }
          break;
        default:
          return;
      }
      scene.add(lightObj);
    });

    // Add objects
    gs.objects.forEach(obj => {
      if (!obj.visible) return;

      let mesh: THREE.Object3D;

      if (obj.type === 'mesh') {
        let geometry: THREE.BufferGeometry;
        
        switch (obj.geometry?.type) {
          case 'box':
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;
          case 'sphere':
            geometry = new THREE.SphereGeometry(0.5, 32, 32);
            break;
          case 'plane':
            geometry = new THREE.PlaneGeometry(1, 1);
            break;
          default:
            geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        let material: THREE.Material;
        switch (obj.material?.type) {
          case 'phong':
            material = new THREE.MeshPhongMaterial({ color: obj.color });
            break;
          case 'lambert':
            material = new THREE.MeshLambertMaterial({ color: obj.color });
            break;
          default:
            material = new THREE.MeshBasicMaterial({ color: obj.color });
        }

        mesh = new THREE.Mesh(geometry, material);
      } else if (obj.type === 'text') {
        // For text, we'll create a simple plane with texture
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        if (context) {
          context.fillStyle = obj.color;
          context.font = '32px monospace';
          context.fillText(obj.text || '', 10, 50);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const geometry = new THREE.PlaneGeometry(2, 0.5);
        mesh = new THREE.Mesh(geometry, material);
      } else {
        // Default cube for unknown types
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial({ color: obj.color })
        );
      }

      mesh.position.set(...obj.position);
      mesh.rotation.set(...obj.rotation);
      mesh.scale.set(...obj.scale);
      mesh.name = obj.id;

      scene.add(mesh);
    });
  }, [gs, scene]);

  return null;
}

// Animated Objects Component
function AnimatedObjects({ gs }: { gs: PS2GraphicsState }) {
  useFrame((state) => {
    gs.objects.forEach((obj, id) => {
      const mesh = state.scene.getObjectByName(id);
      if (mesh && obj.type === 'mesh') {
        // Apply any runtime transformations
        mesh.position.set(...obj.position);
        mesh.rotation.set(...obj.rotation);
        mesh.scale.set(...obj.scale);
      }
    });
  });

  return null;
}

export function PS2Engine({ code, isRunning, onLog }: PS2EngineProps) {
  const gsRef = useRef(new PS2GraphicsState());
  const [, forceUpdate] = useState({});

  // Execute ATHENA ENV code
  useEffect(() => {
    if (!isRunning || !code.trim()) return;

    const gs = gsRef.current;

    // Enhanced ATHENA ENV APIs with 3D support
    const athenaEnv = {
      Screen: {
        clear: (color?: any) => {
          const colorStr = color ? `hsl(${color.r || 0}, ${color.g || 50}%, ${color.b || 50}%)` : '#000000';
          gs.clear(colorStr);
          forceUpdate({});
        },
        flip: () => {
          gs.frame();
          forceUpdate({});
        },
        setMode: (config: any) => {
          gs.setCamera({
            fov: config.fov || 75,
            near: config.near || 0.1,
            far: config.far || 1000
          });
        }
      },

      Render: {
        setView: (fov = 75, near = 0.1, far = 1000) => {
          gs.setCamera({ fov, near, far });
        },
        
        materialColor: (r: number, g: number, b: number, a = 255) => ({
          r: r / 255, g: g / 255, b: b / 255, a: a / 255,
          toString: () => `rgb(${r}, ${g}, ${b})`
        })
      },

      RenderObject: class {
        private id: string;
        private gs: PS2GraphicsState;

        constructor(mesh: any, texture?: any) {
          this.id = `obj_${Math.random().toString(36).substr(2, 9)}`;
          this.gs = gs;
          
          // Add default cube if no specific mesh provided
          this.gs.addObject(this.id, {
            type: 'mesh',
            geometry: { type: 'box' },
            material: { type: 'phong' },
            color: '#00ffff'
          });
        }

        draw(x: number, y: number, z: number, rotX = 0, rotY = 0, rotZ = 0) {
          const obj = this.gs.objects.get(this.id);
          if (obj) {
            obj.position = [x / 100, y / 100, z / 100]; // Scale to reasonable 3D coords
            obj.rotation = [rotX, rotY, rotZ];
            this.gs.objects.set(this.id, obj);
          }
        }

        setTexture(id: number, texture: any) {
          // Texture management would go here
        }
      },

      Camera: {
        type: (type: number) => {
          // Camera type switching
        },
        position: (x: number, y: number, z: number) => {
          gs.setCamera({ position: [x / 100, y / 100, z / 100] });
        },
        target: (x: number, y: number, z: number) => {
          gs.setCamera({ target: [x / 100, y / 100, z / 100] });
        },
        update: () => {
          // Camera update logic
        }
      },

      Lights: {
        set: (id: number, attribute: number, x: number, y: number, z: number) => {
          gs.addLight({
            type: 'directional',
            color: '#ffffff',
            intensity: 1,
            position: [x / 100, y / 100, z / 100]
          });
        }
      },

      Draw: {
        rect: (x: number, y: number, w: number, h: number, color: any) => {
          gs.addObject(`rect_${Date.now()}`, {
            type: 'mesh',
            position: [x / 100 - 3, -y / 100 + 2, 0],
            scale: [w / 100, h / 100, 0.1],
            geometry: { type: 'box' },
            color: color?.toString() || '#ffffff'
          });
        },
        
        circle: (x: number, y: number, radius: number, color: any) => {
          gs.addObject(`circle_${Date.now()}`, {
            type: 'mesh',
            position: [x / 100 - 3, -y / 100 + 2, 0],
            scale: [radius / 50, radius / 50, radius / 50],
            geometry: { type: 'sphere' },
            color: color?.toString() || '#ffffff'
          });
        }
      },

      Font: class {
        constructor(public path: string) {}
        
        print(x: number, y: number, text: string) {
          gs.addObject(`text_${Date.now()}`, {
            type: 'text',
            position: [x / 100 - 3, -y / 100 + 2, 0.1],
            text,
            color: '#ffffff'
          });
        }
      },

      Color: {
        new: (r: number, g: number, b: number, a = 255) => ({
          r, g, b, a,
          toString: () => `rgba(${r}, ${g}, ${b}, ${a / 255})`
        })
      },

      os: {
        setInterval: (fn: Function, delay: number) => setInterval(fn, delay || 16),
        clearInterval: clearInterval,
        platform: 'ps2'
      },

      console: {
        log: (...args: any[]) => onLog(`[LOG] ${args.join(' ')}`),
        error: (...args: any[]) => onLog(`[ERROR] ${args.join(' ')}`)
      }
    };

    // Initialize 3D scene
    gs.clear('#001122');
    gs.addLight({ type: 'ambient', color: '#404040', intensity: 0.6 });
    gs.addLight({ type: 'directional', color: '#ffffff', intensity: 0.8, position: [1, 1, 1] });

    try {
      const userFunction = new Function(...Object.keys(athenaEnv), code);
      userFunction(...Object.values(athenaEnv));
      onLog('[SYSTEM] ATHENA ENV code executed successfully');
    } catch (error) {
      onLog(`[ERROR] ${error}`);
    }
  }, [code, isRunning, onLog]);

  return (
    <div className="w-full h-full bg-black rounded overflow-hidden">
      <Canvas
        camera={{ 
          position: gsRef.current.camera.position,
          fov: gsRef.current.camera.fov,
          near: gsRef.current.camera.near,
          far: gsRef.current.camera.far
        }}
        style={{ background: gsRef.current.clearColor }}
      >
        <PS2Scene gs={gsRef.current} />
        <AnimatedObjects gs={gsRef.current} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}