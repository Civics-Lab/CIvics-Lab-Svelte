#!/usr/bin/env node

/**
 * This script fixes the database import path across all API endpoints
 * 
 * It replaces:
 * import { db } from '$lib/db/drizzle';
 * 
 * With:
 * import { db } from '$lib/server/db';
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Find all .ts files under the src/routes/api directory
const findApiEndpoints = () => {
  try {
    const output = execSync('find src/routes/api -name "*.ts" | grep -v "node_modules"', { encoding: 'utf-8' });
    return output.trim().split('\n');
  } catch (error) {
    console.error('Error finding API endpoints:', error);
    return [];
  }
};

// Fix the imports in a file
const fixImports = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if the file has the wrong import
    if (content.includes("import { db } from '$lib/db/drizzle';")) {
      console.log(`✅ Fixing import in ${filePath}`);
      
      // Replace the import statement
      const updatedContent = content.replace(
        "import { db } from '$lib/db/drizzle';", 
        "import { db } from '$lib/server/db';"
      );
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing imports in ${filePath}:`, error);
    return false;
  }
};

// Main function
const main = () => {
  console.log('🔍 Searching for API endpoints to fix...');
  
  const endpoints = findApiEndpoints();
  console.log(`Found ${endpoints.length} API endpoint files`);
  
  let fixedCount = 0;
  
  for (const endpoint of endpoints) {
    if (fixImports(endpoint)) {
      fixedCount++;
    }
  }
  
  // Also check utils directory which might contain database imports
  console.log('\n🔍 Searching for utility files to fix...');
  try {
    const utilsOutput = execSync('find src/lib/utils -name "*.ts" | grep -v "node_modules"', { encoding: 'utf-8' });
    const utilsFiles = utilsOutput.trim().split('\n');
    
    console.log(`Found ${utilsFiles.length} utility files`);
    
    for (const utilFile of utilsFiles) {
      if (fixImports(utilFile)) {
        fixedCount++;
      }
    }
  } catch (error) {
    console.error('Error finding utility files:', error);
  }
  
  console.log(`\n✅ Fixed imports in ${fixedCount} files`);
  console.log('Done!');
};

main();
