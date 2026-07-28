const fs = require('fs');

let content = fs.readFileSync('src/views/ReportGenerator.tsx', 'utf8');

// Inside handleGeneratePDF, we can set overflow visible on document body and main 
const injectBeforeHtmlCanvas = `      document.body.style.overflow = 'visible';
      const mainEl = document.querySelector('main');
      const layoutEl = document.querySelector('.flex.h-screen');
      if (mainEl) mainEl.style.overflow = 'visible';
      if (layoutEl) layoutEl.style.overflow = 'visible';
      if (layoutEl) layoutEl.style.height = 'auto';
      
      await new Promise(resolve => setTimeout(resolve, 300));`;
      
const injectAfterHtmlCanvas = `      document.body.style.overflow = '';
      if (mainEl) mainEl.style.overflow = '';
      if (layoutEl) layoutEl.style.overflow = '';
      if (layoutEl) layoutEl.style.height = '100vh';`;

content = content.replace(
  '// Temporarily ensure scrolled to top to avoid clipping',
  injectBeforeHtmlCanvas + '\n      // Temporarily ensure scrolled to top to avoid clipping'
);

content = content.replace(
  'window.scrollTo(0, originalScrollY);',
  'window.scrollTo(0, originalScrollY);\n' + injectAfterHtmlCanvas
);

fs.writeFileSync('src/views/ReportGenerator.tsx', content);
