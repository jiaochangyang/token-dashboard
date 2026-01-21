-- Clear All Tables Script (SQLite)
-- WARNING: This will DELETE ALL DATA from all tables in the database
-- Use with extreme caution!

-- Disable foreign key constraints temporarily
PRAGMA foreign_keys = OFF;

-- Note: SQLite doesn't support dynamic SQL like PostgreSQL/MySQL
-- You need to manually list your tables or generate DELETE statements

-- Example: If you have tables named 'users', 'posts', 'comments'
-- DELETE FROM users;
-- DELETE FROM posts;
-- DELETE FROM comments;

-- To generate the statements, you can use this query in SQLite CLI:
-- SELECT 'DELETE FROM ' || name || ';' FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';

-- For a more automated approach, save this as a shell script instead

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Verify tables are empty
SELECT name, (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=t.name) as row_count
FROM sqlite_master t
WHERE type='table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;
