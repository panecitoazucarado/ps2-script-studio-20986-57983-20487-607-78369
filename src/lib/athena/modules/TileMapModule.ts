// TileMap module stub for AthenaEnv browser runtime

export function createTileMapModule(
  ctx: CanvasRenderingContext2D,
  onLog: (msg: string) => void
) {
  const SPRITE_STRIDE = 52; // 13 floats * 4 bytes
  const SPRITE_OFFSETS = {
    x: 0, y: 4, w: 8, h: 12,
    u1: 16, v1: 20, u2: 24, v2: 28,
    r: 32, g: 36, b: 40, a: 44,
    zindex: 48
  };

  let cameraX = 0, cameraY = 0;

  const TileMap = {
    Descriptor: (config: { textures: any[]; materials: any[] }) => ({
      textures: config.textures || [],
      materials: config.materials || [],
      type: 'TileMapDescriptor'
    }),

    Instance: (options: { descriptor: any; spriteBuffer: ArrayBuffer }) => {
      let buffer = options.spriteBuffer;
      return {
        render: (x: number, y: number, zindex?: number) => {
          // In browser, draw sprites from buffer using ctx
          const view = new DataView(buffer);
          const spriteCount = buffer.byteLength / SPRITE_STRIDE;
          for (let i = 0; i < spriteCount; i++) {
            const off = i * SPRITE_STRIDE;
            const sx = view.getFloat32(off + SPRITE_OFFSETS.x, true) + x - cameraX;
            const sy = view.getFloat32(off + SPRITE_OFFSETS.y, true) + y - cameraY;
            const sw = view.getFloat32(off + SPRITE_OFFSETS.w, true);
            const sh = view.getFloat32(off + SPRITE_OFFSETS.h, true);
            const r = view.getFloat32(off + SPRITE_OFFSETS.r, true) * 255 | 0;
            const g = view.getFloat32(off + SPRITE_OFFSETS.g, true) * 255 | 0;
            const b = view.getFloat32(off + SPRITE_OFFSETS.b, true) * 255 | 0;
            const a = view.getFloat32(off + SPRITE_OFFSETS.a, true);
            ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
            ctx.fillRect(sx, sy, sw, sh);
          }
        },
        replaceSpriteBuffer: (buf: ArrayBuffer) => { buffer = buf; },
        getSpriteBuffer: () => buffer,
        updateSprites: (dstOffset: number, srcBuffer: ArrayBuffer, spriteCount?: number) => {
          const dst = new Uint8Array(buffer);
          const src = new Uint8Array(srcBuffer);
          const bytes = spriteCount ? spriteCount * SPRITE_STRIDE : src.length;
          dst.set(src.subarray(0, bytes), dstOffset * SPRITE_STRIDE);
        }
      };
    },

    SpriteBuffer: {
      create: (count: number) => new ArrayBuffer(count * SPRITE_STRIDE),
      fromObjects: (arr: any[]) => {
        const buf = new ArrayBuffer(arr.length * SPRITE_STRIDE);
        const view = new DataView(buf);
        arr.forEach((sprite, i) => {
          const off = i * SPRITE_STRIDE;
          view.setFloat32(off + 0, sprite.x || 0, true);
          view.setFloat32(off + 4, sprite.y || 0, true);
          view.setFloat32(off + 8, sprite.w || 0, true);
          view.setFloat32(off + 12, sprite.h || 0, true);
          view.setFloat32(off + 16, sprite.u1 || 0, true);
          view.setFloat32(off + 20, sprite.v1 || 0, true);
          view.setFloat32(off + 24, sprite.u2 || 0, true);
          view.setFloat32(off + 28, sprite.v2 || 0, true);
          view.setFloat32(off + 32, sprite.r ?? 1, true);
          view.setFloat32(off + 36, sprite.g ?? 1, true);
          view.setFloat32(off + 40, sprite.b ?? 1, true);
          view.setFloat32(off + 44, sprite.a ?? 1, true);
          view.setFloat32(off + 48, sprite.zindex || 0, true);
        });
        return buf;
      }
    },

    layout: { stride: SPRITE_STRIDE, offsets: SPRITE_OFFSETS },

    init: () => { onLog('[TILEMAP] Renderer initialized'); },
    begin: () => { /* start frame */ },
    setCamera: (x: number, y: number) => { cameraX = x; cameraY = y; },
  };

  return TileMap;
}
