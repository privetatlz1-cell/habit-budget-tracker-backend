/**
 * Migration: Create SleepEntries table
 * 
 * This migration creates the SleepEntries table for storing daily sleep tracking data.
 * 
 * Run with: node server/migrations/004-create-sleep-entries-table.js
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
    console.log('Starting migration: Create SleepEntries table...');
    
    // Check if table already exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'SleepEntries'
    `);
    
    if (results.length > 0) {
      console.log('✓ SleepEntries table already exists');
    } else {
      console.log('Creating SleepEntries table...');
      await sequelize.query(`
        CREATE TABLE "SleepEntries" (
          "id" SERIAL PRIMARY KEY,
          "date" DATE NOT NULL UNIQUE,
          "hours" DOUBLE PRECISION NOT NULL CHECK ("hours" >= 0 AND "hours" <= 24),
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
        )
      `);
      
      // Create indexes for faster lookups
      await sequelize.query(`
        CREATE INDEX "SleepEntries_date_idx" ON "SleepEntries" ("date")
      `);
      
      console.log('✓ SleepEntries table created');
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


