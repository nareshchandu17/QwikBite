const fs = require('fs');
const path = require('path');

const libModelsDir = path.join(__dirname, 'src/lib/models');
const modelsDir = path.join(__dirname, 'src/models');

const libModelFiles = fs.existsSync(libModelsDir) ? fs.readdirSync(libModelsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'README.md') : [];
const modelFiles = fs.existsSync(modelsDir) ? fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts') && f !== 'index.ts') : [];

let exportsText = '';

libModelFiles.forEach(file => {
    exportsText += `export * from './${file.replace('.ts', '')}';\n`;
});

modelFiles.forEach(file => {
    exportsText += `export * from '@/models/${file.replace('.ts', '')}';\n`;
});

// Since some default exports might be used, also export default where needed? 
// No, the error is about Cannot find module '@/lib/models'. Re-exporting everything should fix the named imports.
// Also many files import specific models. We will manually define the known ones just in case:

exportsText += `
// Specific named exports if default was used in src/models
export { default as User } from '@/models/user.model';
export { default as Staff } from '@/models/staff.model';
export { default as MenuItem } from '@/models/menuItem.model';
export { default as Order } from '@/models/order.model';
export { default as Notification } from '@/models/notification.model';
export { default as Transaction } from '@/models/transaction.model';
export { default as Analytics } from '@/models/analytics.model';
export { default as Favorite } from '@/models/favorite.model';
`;

fs.writeFileSync(path.join(libModelsDir, 'index.ts'), exportsText, 'utf8');
console.log('Created src/lib/models/index.ts');
