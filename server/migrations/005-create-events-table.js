/**
 * Migration: Create Events table
 * 
 * This migration creates the Events table for storing calendar events.
 * 
 * Run with: node server/migrations/005-create-events-table.js
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
    console.log('Starting migration: Create Events table...');
    
    // Check if table already exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Events'
    `);
    
    if (results.length > 0) {
      console.log('✓ Events table already exists');
    } else {
      console.log('Creating Events table...');
      await sequelize.query(`
        CREATE TABLE "Events" (
          "id" SERIAL PRIMARY KEY,
          "title" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "startDate" DATE NOT NULL,
          "startTime" TIME,
          "endDate" DATE,
          "endTime" TIME,
          "category" VARCHAR(255) NOT NULL DEFAULT 'Personal',
          "color" VARCHAR(255) NOT NULL DEFAULT '#6C5DD3',
          "allDay" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `);
      
      // Create indexes for faster lookups
      await sequelize.query(`
        CREATE INDEX "Events_startDate_idx" ON "Events" ("startDate")
      `);
      
      console.log('✓ Events table created');
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


