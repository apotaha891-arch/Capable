import React from 'react';
import { BLOCK_MAP } from './Blocks.jsx';

function radiusToCss(token) {
  return { none: '0', sm: '0.25rem', lg: '0.75rem', full: '9999px', md: '0.5rem' }[token] || '0.5rem';
}

export function themeVars(theme = {}) {
  return {
    '--primary': theme.primary_color || '#1e40af',
    '--secondary': theme.secondary_color || '#f59e0b',
    '--radius': radiusToCss(theme.border_radius),
    fontFamily: theme.font_family ? `'${theme.font_family}', system-ui, sans-serif` : 'system-ui, sans-serif',
  };
}

export default function BlueprintPreview({ blueprint }) {
  if (!blueprint || !Array.isArray(blueprint.blocks)) return null;
  return (
    <div dir={blueprint.direction || 'ltr'} lang={blueprint.language || 'en'} style={themeVars(blueprint.theme)}>
      {blueprint.blocks.map(block => {
        const Component = BLOCK_MAP[block.type];
        if (!Component) return null;
        return <Component key={block.id} content={block.content} />;
      })}
    </div>
  );
}
