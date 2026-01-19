/**
 * Migration: Add title column to DailyNotes table
 * 
 * This migration adds a title field to the DailyNotes table to support
 * enhanced note functionality while maintaining backward compatibility.
 * 
 * Run with: node server/migrations/008-add-title-to-daily-notes.js
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
    console.log('Starting migration: Add title to DailyNotes table...');
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'DailyNotes'
      AND column_name = 'title'
    `);
    
    if (results.length > 0) {
      console.log('✓ Title column already exists in DailyNotes table');
    } else {
      console.log('Adding title column to DailyNotes table...');
      await sequelize.query(`
        ALTER TABLE "DailyNotes" 
        ADD COLUMN "title" VARCHAR(255)
      `);
      
      console.log('✓ Title column added to DailyNotes table');
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


