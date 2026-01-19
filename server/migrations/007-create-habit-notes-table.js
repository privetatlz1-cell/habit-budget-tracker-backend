/**
 * Migration: Create HabitNotes table
 * 
 * This migration creates the HabitNotes table for storing habit-specific notes.
 * 
 * Run with: node server/migrations/007-create-habit-notes-table.js
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
    console.log('Starting migration: Create HabitNotes table...');
    
    // Check if table already exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'HabitNotes'
    `);
    
    if (results.length > 0) {
      console.log('✓ HabitNotes table already exists');
    } else {
      console.log('Creating HabitNotes table...');
      await sequelize.query(`
        CREATE TABLE "HabitNotes" (
          "id" SERIAL PRIMARY KEY,
          "HabitId" INTEGER NOT NULL,
          "date" DATE NOT NULL,
          "title" VARCHAR(255),
          "content" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          FOREIGN KEY ("HabitId") REFERENCES "Habits"("id") ON DELETE CASCADE,
          UNIQUE ("HabitId", "date")
        )
      `);
      
      // Create indexes
      await sequelize.query(`
        CREATE INDEX "HabitNotes_HabitId_idx" ON "HabitNotes" ("HabitId")
      `);
      await sequelize.query(`
        CREATE INDEX "HabitNotes_date_idx" ON "HabitNotes" ("date")
      `);
      
      console.log('✓ HabitNotes table created');
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


