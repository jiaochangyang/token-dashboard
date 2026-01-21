-- Clear All Tables Script (PostgreSQL)
-- WARNING: This will DELETE ALL DATA from all tables in the current database
-- Use with extreme caution!

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Generate and execute TRUNCATE statements for all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all tables in the public schema
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
        RAISE NOTICE 'Truncated table: %', r.tablename;
    END LOOP;
END $$;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify tables are empty
SELECT
    schemaname,
    tablename,
    (
        SELECT COUNT(*)
        FROM information_schema.tables t
        WHERE t.table_schema = schemaname
        AND t.table_name = tablename
    ) as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
