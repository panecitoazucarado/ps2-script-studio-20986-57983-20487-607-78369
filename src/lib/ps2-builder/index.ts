// PS2 Visual Builder - All Templates Index

import { ComponentTemplate, CATEGORIES } from './types';
import { drawTemplates } from './templates/draw-templates';
import { fontTemplates } from './templates/font-templates';
import { imageTemplates } from './templates/image-templates';
import { controlTemplates } from './templates/control-templates';
import { layoutTemplates } from './templates/layout-templates';
import { listTemplates } from './templates/list-templates';
import { indicatorTemplates } from './templates/indicator-templates';
import { mediaTemplates } from './templates/media-templates';
import { advancedTemplates } from './templates/advanced-templates';
import { calculatorTemplates } from './templates/calculator-templates';
import { scrollTemplates } from './templates/scroll-templates';

// Combine all templates
export const allTemplates: ComponentTemplate[] = [
  ...drawTemplates,
  ...fontTemplates,
  ...imageTemplates,
  ...controlTemplates,
  ...layoutTemplates,
  ...listTemplates,
  ...indicatorTemplates,
  ...mediaTemplates,
  ...advancedTemplates,
  ...calculatorTemplates,
  ...scrollTemplates
];

// Get templates by category
export const getTemplatesByCategory = (category: string): ComponentTemplate[] => {
  return allTemplates.filter(t => t.category === category);
};

// Get template by type
export const getTemplateByType = (type: string): ComponentTemplate | undefined => {
  return allTemplates.find(t => t.type === type);
};

// Search templates
export const searchTemplates = (query: string): ComponentTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return allTemplates.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.includes(lowerQuery))
  );
};

// Export everything
export { CATEGORIES };
export * from './types';
