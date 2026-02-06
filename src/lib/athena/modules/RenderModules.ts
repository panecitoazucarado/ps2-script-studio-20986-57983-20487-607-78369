// Render, Camera, Lights, RenderData, RenderObject, Batch, SceneNode, AsyncLoader
// Browser stubs for AthenaEnv 3D pipeline

export function createRenderModules(
  ctx: CanvasRenderingContext2D,
  onLog: (msg: string) => void
) {
  // Camera state
  const cameraState = {
    pos: { x: 0, y: 0, z: 5 },
    rot: { x: 0, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    yaw: 0, pitch: 0,
    fov: 60, near: 1, far: 2000
  };

  // Lights state (4 lights)
  const lightsState = [
    { direction: { x: 0, y: -1, z: 0 }, ambient: { x: 0.3, y: 0.3, z: 0.3 }, diffuse: { x: 1, y: 1, z: 1 } },
    { direction: { x: 0, y: 0, z: 0 }, ambient: { x: 0, y: 0, z: 0 }, diffuse: { x: 0, y: 0, z: 0 } },
    { direction: { x: 0, y: 0, z: 0 }, ambient: { x: 0, y: 0, z: 0 }, diffuse: { x: 0, y: 0, z: 0 } },
    { direction: { x: 0, y: 0, z: 0 }, ambient: { x: 0, y: 0, z: 0 }, diffuse: { x: 0, y: 0, z: 0 } },
  ];

  const Camera = {
    position: (x: number, y: number, z: number) => { cameraState.pos = { x, y, z }; },
    rotation: (x: number, y: number, z: number) => { cameraState.rot = { x, y, z }; },
    target: (x: number, y: number, z: number) => { cameraState.target = { x, y, z }; },
    orbit: (yaw: number, pitch: number) => { cameraState.yaw = yaw; cameraState.pitch = pitch; },
    turn: (yaw: number, pitch: number) => { cameraState.yaw += yaw; cameraState.pitch += pitch; },
    pan: (x: number, y: number) => { cameraState.pos.x += x; cameraState.pos.y += y; },
    dolly: (dist: number) => { cameraState.pos.z += dist; },
    zoom: (dist: number) => { cameraState.fov = Math.max(10, Math.min(150, cameraState.fov - dist)); },
    update: () => { /* recalc view matrix - mock */ },
  };

  const Lights = {
    DIRECTION: 'direction',
    AMBIENT: 'ambient',
    DIFFUSE: 'diffuse',
    set: (id: number, attribute: string, x: number, y: number, z: number) => {
      if (id >= 0 && id < 4 && lightsState[id]) {
        (lightsState[id] as any)[attribute] = { x, y, z };
      }
    }
  };

  const Render = {
    init: () => { onLog('[RENDER] 3D renderer initialized (browser stub)'); },
    begin: () => { /* start frame */ },
    setView: (fov = 60, near = 1.0, far = 2000.0, w = 0, h = 0) => {
      cameraState.fov = fov; cameraState.near = near; cameraState.far = far;
    },
    materialColor: (r: number, g: number, b: number, a = 1.0) => ({ r, g, b, a }),
    material: (...args: any[]) => ({ type: 'material', args }),
    materialIndex: (index: number, end: number) => ({ index, end }),
    vertexList: (positions: any, normals: any, texcoords: any, colors: any, materials: any, materialIndices: any) => ({
      positions, normals, texcoords, colors, materials, materialIndices
    }),
    // Constants
    PL_NO_LIGHTS: 0,
    PL_DEFAULT: 1,
    PL_SPECULAR: 2,
    CULL_FACE_NONE: 0,
    CULL_FACE_BACK: 1,
    CULL_FACE_FRONT: 2,
  };

  // RenderData class
  class RenderData {
    positions: Float32Array;
    normals: Float32Array;
    texcoords: Float32Array;
    colors: Float32Array;
    pipeline: number = 1;
    materials: any[] = [];
    material_indices: any[] = [];
    size: number = 0;
    bounds: { min: any; max: any } = { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } };
    accurate_clipping: boolean = false;
    face_culling: number = 1;
    texture_mapping: boolean = true;
    shade_model: number = 1;
    bones: any[] = [];
    private textures: any[] = [];

    constructor(meshOrPath: any, texture?: any) {
      this.positions = new Float32Array(0);
      this.normals = new Float32Array(0);
      this.texcoords = new Float32Array(0);
      this.colors = new Float32Array(0);
      if (typeof meshOrPath === 'string') {
        onLog(`[RENDER] Loading mesh: ${meshOrPath}`);
      } else if (meshOrPath && meshOrPath.positions) {
        this.positions = meshOrPath.positions;
        this.normals = meshOrPath.normals;
        this.texcoords = meshOrPath.texcoords;
        this.colors = meshOrPath.colors;
        this.materials = meshOrPath.materials || [];
        this.material_indices = meshOrPath.materialIndices || [];
        this.size = this.positions.length / 4;
      }
      if (texture) this.textures.push(texture);
    }

    getTexture(id: number) { return this.textures[id] || null; }
    setTexture(id: number, tex: any) { this.textures[id] = tex; }
    free() { this.positions = new Float32Array(0); }
  }

  // RenderObject class
  class RenderObject {
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0, z: 0 };
    scale = { x: 1, y: 1, z: 1 };
    transform: any = null;
    bone_matrices: any[] = [];
    bones: any[] = [];
    private data: RenderData;
    private currentAnim: any = null;

    constructor(data: RenderData) {
      this.data = data;
    }

    render() {
      // In browser we can't do real 3D, just log
    }
    renderBounds() { /* mock */ }
    free() { /* mock */ }
    playAnim(anim: any, loop: boolean) { this.currentAnim = anim; }
    isPlayingAnim(anim: any) { return this.currentAnim === anim; }
  }

  // AnimCollection
  class AnimCollection {
    private anims: any[] = [];
    constructor(path: string) {
      onLog(`[RENDER] Loading animations: ${path}`);
      return new Proxy(this, {
        get(target, prop) {
          if (typeof prop === 'string' && !isNaN(Number(prop))) return target.anims[Number(prop)] || { name: `anim_${prop}` };
          if (typeof prop === 'string' && prop !== 'constructor') return { name: prop };
          return (target as any)[prop];
        }
      });
    }
  }

  // Batch
  class Batch {
    private objects: RenderObject[] = [];
    private autoSort: boolean;
    constructor(options: { autoSort?: boolean } = {}) { this.autoSort = options.autoSort ?? true; }
    get size() { return this.objects.length; }
    add(obj: RenderObject) { this.objects.push(obj); return this.objects.length; }
    clear() { this.objects = []; }
    render() { this.objects.forEach(o => o.render()); return this.objects.length; }
  }

  // SceneNode
  class SceneNode {
    position = { x: 0, y: 0, z: 0 };
    rotation = { x: 0, y: 0, z: 0 };
    scale = { x: 1, y: 1, z: 1 };
    private children: SceneNode[] = [];
    private attached: RenderObject[] = [];
    addChild(node: SceneNode) { this.children.push(node); }
    removeChild(node: SceneNode) { this.children = this.children.filter(c => c !== node); }
    attach(obj: RenderObject) { this.attached.push(obj); }
    detach(obj?: RenderObject) { this.attached = obj ? this.attached.filter(o => o !== obj) : []; }
    update() { this.children.forEach(c => c.update()); }
  }

  // AsyncLoader
  class AsyncLoader {
    private queue: { path: string; callback: Function; texture?: any }[] = [];
    private jobsPerStep: number;
    constructor(options: { jobsPerStep?: number } = {}) { this.jobsPerStep = options.jobsPerStep ?? 1; }
    enqueue(path: string, callback: Function, texture?: any) { this.queue.push({ path, callback, texture }); }
    process(budget?: number) {
      const count = Math.min(budget ?? this.jobsPerStep, this.queue.length);
      for (let i = 0; i < count; i++) {
        const job = this.queue.shift()!;
        const data = new RenderData(job.path, job.texture);
        job.callback(job.path, data);
      }
      return count;
    }
    clear() { this.queue = []; }
    destroy() { this.queue = []; }
    size() { return this.queue.length; }
    getJobsPerStep() { return this.jobsPerStep; }
    setJobsPerStep(n: number) { this.jobsPerStep = Math.max(1, n); return this.jobsPerStep; }
  }

  return { Render, Camera, Lights, RenderData, RenderObject, AnimCollection, Batch, SceneNode, AsyncLoader };
}
