// PS2 Visual Builder - Image Module Templates
// Based on AthenaEnv Image module documentation

import { ComponentTemplate, PS2Component, defaultColor, colorToAthena } from '../types';

export const imageTemplates: ComponentTemplate[] = [
  // Basic Image
  {
    type: 'image',
    name: 'Imagen',
    description: 'Imagen PNG/BMP/JPEG desde archivo',
    icon: 'Image',
    category: 'image',
    tags: ['image', 'imagen', 'png', 'bmp', 'jpeg'],
    defaultWidth: 128,
    defaultHeight: 128,
    defaultProps: {
      src: 'assets/image.png',
      filter: 'NEAREST',
      tint: defaultColor(255, 255, 255, 128)
    },
    codeGenerator: (comp: PS2Component) => `// Image Component
const img_${comp.id.slice(0, 6)} = new Image("${comp.props.src}");
img_${comp.id.slice(0, 6)}.width = ${comp.width};
img_${comp.id.slice(0, 6)}.height = ${comp.height};
img_${comp.id.slice(0, 6)}.filter = Image.${comp.props.filter};
img_${comp.id.slice(0, 6)}.color = ${colorToAthena(comp.props.tint)};
img_${comp.id.slice(0, 6)}.draw(${comp.x}, ${comp.y});`
  },

  // Logo/Brand Image
  {
    type: 'logo',
    name: 'Logo',
    description: 'Imagen de logo/marca con opciones',
    icon: 'Sparkles',
    category: 'image',
    tags: ['logo', 'brand', 'marca', 'image'],
    defaultWidth: 200,
    defaultHeight: 80,
    defaultProps: {
      src: 'assets/logo.png',
      filter: 'LINEAR',
      tint: defaultColor(255, 255, 255, 128),
      centered: true
    },
    codeGenerator: (comp: PS2Component) => {
      const xPos = comp.props.centered 
        ? `Math.floor((Screen.getMode().width - ${comp.width}) / 2)`
        : String(comp.x);
      return `// Logo Component
const logo_${comp.id.slice(0, 6)} = new Image("${comp.props.src}");
logo_${comp.id.slice(0, 6)}.width = ${comp.width};
logo_${comp.id.slice(0, 6)}.height = ${comp.height};
logo_${comp.id.slice(0, 6)}.filter = Image.${comp.props.filter};
logo_${comp.id.slice(0, 6)}.color = ${colorToAthena(comp.props.tint)};
logo_${comp.id.slice(0, 6)}.draw(${xPos}, ${comp.y});`;
    }
  },

  // Sprite with animation frame
  {
    type: 'sprite',
    name: 'Sprite',
    description: 'Sprite con región de atlas (startx/y, endx/y)',
    icon: 'ImagePlay',
    category: 'image',
    subcategory: 'Animación',
    tags: ['sprite', 'atlas', 'animation', 'frame'],
    defaultWidth: 64,
    defaultHeight: 64,
    defaultProps: {
      src: 'assets/spritesheet.png',
      startX: 0,
      startY: 0,
      endX: 64,
      endY: 64,
      frameWidth: 64,
      frameHeight: 64,
      filter: 'NEAREST',
      tint: defaultColor(255, 255, 255, 128)
    },
    codeGenerator: (comp: PS2Component) => `// Sprite from Atlas
const sprite_${comp.id.slice(0, 6)} = new Image("${comp.props.src}");
sprite_${comp.id.slice(0, 6)}.startx = ${comp.props.startX};
sprite_${comp.id.slice(0, 6)}.starty = ${comp.props.startY};
sprite_${comp.id.slice(0, 6)}.endx = ${comp.props.endX};
sprite_${comp.id.slice(0, 6)}.endy = ${comp.props.endY};
sprite_${comp.id.slice(0, 6)}.width = ${comp.width};
sprite_${comp.id.slice(0, 6)}.height = ${comp.height};
sprite_${comp.id.slice(0, 6)}.filter = Image.${comp.props.filter};
sprite_${comp.id.slice(0, 6)}.color = ${colorToAthena(comp.props.tint)};
sprite_${comp.id.slice(0, 6)}.draw(${comp.x}, ${comp.y});`
  },

  // Rotated Image
  {
    type: 'rotated-image',
    name: 'Imagen Rotada',
    description: 'Imagen con rotación en grados',
    icon: 'RotateCw',
    category: 'image',
    subcategory: 'Transformaciones',
    tags: ['rotate', 'rotar', 'angle', 'transform'],
    defaultWidth: 100,
    defaultHeight: 100,
    defaultProps: {
      src: 'assets/image.png',
      angle: 45,
      filter: 'LINEAR',
      tint: defaultColor(255, 255, 255, 128)
    },
    codeGenerator: (comp: PS2Component) => `// Rotated Image
const rotImg_${comp.id.slice(0, 6)} = new Image("${comp.props.src}");
rotImg_${comp.id.slice(0, 6)}.width = ${comp.width};
rotImg_${comp.id.slice(0, 6)}.height = ${comp.height};
rotImg_${comp.id.slice(0, 6)}.angle = ${comp.props.angle};
rotImg_${comp.id.slice(0, 6)}.filter = Image.${comp.props.filter};
rotImg_${comp.id.slice(0, 6)}.color = ${colorToAthena(comp.props.tint)};
rotImg_${comp.id.slice(0, 6)}.draw(${comp.x}, ${comp.y});`
  },

  // Icon
  {
    type: 'icon',
    name: 'Icono',
    description: 'Icono pequeño de interfaz',
    icon: 'Star',
    category: 'image',
    tags: ['icon', 'icono', 'ui', 'small'],
    defaultWidth: 32,
    defaultHeight: 32,
    defaultProps: {
      src: 'assets/icons/icon.png',
      filter: 'NEAREST',
      tint: defaultColor(255, 255, 255, 128)
    },
    codeGenerator: (comp: PS2Component) => `// Icon
const icon_${comp.id.slice(0, 6)} = new Image("${comp.props.src}");
icon_${comp.id.slice(0, 6)}.width = ${comp.width};
icon_${comp.id.slice(0, 6)}.height = ${comp.height};
icon_${comp.id.slice(0, 6)}.filter = Image.${comp.props.filter};
icon_${comp.id.slice(0, 6)}.color = ${colorToAthena(comp.props.tint)};
icon_${comp.id.slice(0, 6)}.draw(${comp.x}, ${comp.y});`
  },

  // Background Image
  {
    type: 'background',
    name: 'Fondo',
    description: 'Imagen de fondo a pantalla completa',
    icon: 'Wallpaper',
    category: 'image',
    subcategory: 'Layout',
    tags: ['background', 'fondo', 'fullscreen', 'wallpaper'],
    defaultWidth: 640,
    defaultHeight: 448,
    defaultProps: {
      src: 'assets/background.png',
      filter: 'LINEAR',
      tint: defaultColor(255, 255, 255, 128)
    },
    codeGenerator: (comp: PS2Component) => `// Background Image (fullscreen)
const bg_${comp.id.slice(0, 6)} = new Image("${comp.props.src}");
bg_${comp.id.slice(0, 6)}.width = Screen.getMode().width;
bg_${comp.id.slice(0, 6)}.height = Screen.getMode().height;
bg_${comp.id.slice(0, 6)}.filter = Image.${comp.props.filter};
bg_${comp.id.slice(0, 6)}.color = ${colorToAthena(comp.props.tint)};
bg_${comp.id.slice(0, 6)}.draw(0, 0);`
  }
];
