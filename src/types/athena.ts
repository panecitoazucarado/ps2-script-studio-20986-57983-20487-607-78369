// ATHENA ENV API Types
export interface AthenaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface AthenaImage {
  width: number;
  height: number;
  startx: number;
  starty: number;
  endx: number;
  endy: number;
  angle: number;
  color: AthenaColor;
  filter: 'LINEAR' | 'NEAREST';
  size: number;
  bpp: number;
  delayed: boolean;
  pixels: ArrayBuffer;
  palette?: ArrayBuffer;
  draw(x: number, y: number): void;
  optimize(): void;
  ready(): boolean;
}

export interface AthenaFont {
  color: AthenaColor;
  scale: number;
  print(x: number, y: number, text: string): void;
  getTextSize(text: string): { width: number; height: number };
}

export interface AthenaPad {
  btns: number;
  old_btns: number;
  lx: number;
  ly: number;
  rx: number;
  ry: number;
  update(): void;
  pressed(button: number): boolean;
  justPressed(button: number): boolean;
  setEventHandler(): void;
}

export interface AthenaScreen {
  mode: string;
  width: number;
  height: number;
  psm: string;
  interlace: string;
  field: string;
  double_buffering: boolean;
  zbuffering: boolean;
  psmz: string;
}

export interface AthenaProject {
  name: string;
  author: string;
  version: string;
  icon: string;
  file: string;
  code: string;
}

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  path: string;
}