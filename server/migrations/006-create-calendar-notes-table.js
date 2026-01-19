/**
 * Migration: Create CalendarNotes table
 * 
 * This migration creates the CalendarNotes table for storing calendar daily notes.
 * 
 * Run with: node server/migrations/006-create-calendar-notes-table.js
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
    console.log('Starting migration: Create CalendarNotes table...');
    
    // Check if table already exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'CalendarNotes'
    `);
    
    if (results.length > 0) {
      console.log('✓ CalendarNotes table already exists');
    } else {
      console.log('Creating CalendarNotes table...');
      await sequelize.query(`
        CREATE TABLE "CalendarNotes" (
          "id" SERIAL PRIMARY KEY,
          "date" DATE NOT NULL UNIQUE,
          "title" VARCHAR(255),
          "content" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `);
      
      // Create indexes
      await sequelize.query(`
        CREATE INDEX "CalendarNotes_date_idx" ON "CalendarNotes" ("date")
      `);
      
      console.log('✓ CalendarNotes table created');
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


