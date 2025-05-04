// scripts/run-avatar-migration.js
require('dotenv').config();
const { execSync } = require('child_process');

console.log('Running avatar migration...');

try {
  execSync('npm run db:migrate:avatar', { stdio: 'inherit' });
  console.log('Avatar migration completed successfully.');
} catch (error) {
  console.error('Error running avatar migration:', error);
  process.exit(1);
}
