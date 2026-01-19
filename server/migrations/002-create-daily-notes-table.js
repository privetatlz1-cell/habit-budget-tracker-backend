/**
 * Migration: Create DailyNotes table
 * 
 * This migration creates the DailyNotes table for storing daily notes.
 * 
 * Run with: node server/migrations/002-create-daily-notes-table.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: process.env.NODE_ENV === 'production' ? { ssl: { require: false } } : {}
});

async function runMigration() {
  try {
    console.log('Starting migration: Create DailyNotes table...');
    
    // Check if table already exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'DailyNotes'
    `);
    
    if (results.length > 0) {
      console.log('✓ DailyNotes table already exists');
    } else {
      console.log('Creating DailyNotes table...');
      await sequelize.query(`
        CREATE TABLE "DailyNotes" (
          "id" SERIAL PRIMARY KEY,
          "date" DATE NOT NULL UNIQUE,
          "content" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `);
      
      // Create index on date for faster lookups
      await sequelize.query(`
        CREATE INDEX "DailyNotes_date_idx" ON "DailyNotes" ("date")
      `);
      
      console.log('✓ DailyNotes table created');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration();


