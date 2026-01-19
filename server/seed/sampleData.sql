-- Habits
INSERT INTO "Habits" ("name", "description", "category", "createdAt", "updatedAt")
VALUES 
('Drink Water', '8 cups a day', 'Health', now(), now()),
('Read 20 mins', 'Any book', 'Personal Dev', now(), now()),
('Exercise', '30min workout', 'Health', now(), now());

-- Budget Items
INSERT INTO "BudgetItems" ("type", "amount", "category", "date", "description", "createdAt", "updatedAt")
VALUES
('expense', 55.10, 'Food', now(), 'Groceries', now(), now()),
('income', 2500, 'Salary', now(), 'Monthly Salary', now(), now()),
('expense', 40, 'Transport', now(), 'Bus pass', now(), now());






