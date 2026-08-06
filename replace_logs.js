const fs = require('fs');
const path = require('path');

const files = [
  'src/context/OrderContext.tsx',
  'src/context/AuthContext.tsx',
  'src/app/customer/payment/success/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  let modified = false;
  
  if (content.includes('console.log')) {
    content = content.replace(/console\.log/g, 'logger.info');
    modified = true;
  }
  if (content.includes('console.error')) {
    content = content.replace(/console\.error/g, 'logger.error');
    modified = true;
  }
  if (content.includes('console.warn')) {
    content = content.replace(/console\.warn/g, 'logger.warn');
    modified = true;
  }
  
  if (modified && !content.includes("import logger from '@/lib/logger'")) {
    // Add import statement after the last import
    const importLines = content.match(/^import .*$/gm) || [];
    if (importLines.length > 0) {
      const lastImport = importLines[importLines.length - 1];
      content = content.replace(lastImport, lastImport + '\nimport logger from \'@/lib/logger\';');
    } else {
      content = 'import logger from \'@/lib/logger\';\n' + content;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
