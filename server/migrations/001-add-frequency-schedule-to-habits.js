/**
 * Migration: Add frequency and schedule columns to Habits table
 * 
 * This migration adds:
 * - frequency: STRING, default 'daily'
 * - schedule: JSON, default null
 * 
 * Run with: node server/migrations/001-add-frequency-schedule-to-habits.js
 */

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: console.log, // Enable logging for migration
  dialectOptions: process.env.NODE_ENV === 'production' ? { ssl: { require: false } } : {}
});

async function runMigration() {
  try {
    console.log('Starting migration: Add frequency and schedule to Habits table...');
    
    // Check if columns already exist
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Habits' 
      AND column_name IN ('frequency', 'schedule')
    `);
    
    const existingColumns = results.map(row => row.column_name);
    
    // Add frequency column if it doesn't exist
    if (!existingColumns.includes('frequency')) {
      console.log('Adding frequency column...');
      await sequelize.query(`
        ALTER TABLE "Habits" 
        ADD COLUMN "frequency" VARCHAR(255) DEFAULT 'daily'
      `);
      console.log('✓ frequency column added');
    } else {
      console.log('✓ frequency column already exists');
    }
    
    // Add schedule column if it doesn't exist
    if (!existingColumns.includes('schedule')) {
      console.log('Adding schedule column...');
      await sequelize.query(`
        ALTER TABLE "Habits" 
        ADD COLUMN "schedule" JSONB DEFAULT NULL
      `);
      console.log('✓ schedule column added');
    } else {
      console.log('✓ schedule column already exists');
    }
    
    // Update existing habits to have default frequency if null
    await sequelize.query(`
      UPDATE "Habits" 
      SET "frequency" = 'daily' 
      WHERE "frequency" IS NULL
    `);
    console.log('✓ Updated existing habits with default frequency');
    
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


