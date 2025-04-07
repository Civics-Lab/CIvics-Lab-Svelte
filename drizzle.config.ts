import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define Drizzle config
export default {
  schema: './src/lib/db/drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
    ssl: true
  },
  // Optional: Add your own custom configuration
  verbose: true,
  strict: true
} satisfies Config;
