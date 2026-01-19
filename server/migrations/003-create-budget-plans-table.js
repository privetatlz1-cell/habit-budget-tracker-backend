/**
 * Migration: Create BudgetPlans table
 * 
 * This migration creates the BudgetPlans table for storing monthly/yearly budget plans.
 * 
 * Run with: node server/migrations/003-create-budget-plans-table.js
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
    console.log('Starting migration: Create BudgetPlans table...');
    
    // Check if table already exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'BudgetPlans'
    `);
    
    if (results.length > 0) {
      console.log('✓ BudgetPlans table already exists');
    } else {
      console.log('Creating BudgetPlans table...');
      await sequelize.query(`
        CREATE TABLE "BudgetPlans" (
          "id" SERIAL PRIMARY KEY,
          "year" INTEGER NOT NULL,
          "month" INTEGER NOT NULL,
          "category" VARCHAR(255) NOT NULL,
          "type" VARCHAR(255) NOT NULL CHECK ("type" IN ('income', 'expense')),
          "plannedAmount" DOUBLE PRECISION NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          UNIQUE("year", "month", "category", "type")
        )
      `);
      
      // Create indexes for faster lookups
      await sequelize.query(`
        CREATE INDEX "BudgetPlans_year_month_idx" ON "BudgetPlans" ("year", "month")
      `);
      
      console.log('✓ BudgetPlans table created');
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


