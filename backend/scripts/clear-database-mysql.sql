-- Clear All Tables Script (MySQL/MariaDB)
-- WARNING: This will DELETE ALL DATA from all tables in the current database
-- Use with extreme caution!

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Generate TRUNCATE statements for all tables
-- Note: You need to run this in two steps in MySQL
-- Step 1: Generate the statements
SELECT CONCAT('TRUNCATE TABLE `', table_name, '`;') AS truncate_statement
FROM information_schema.tables
WHERE table_schema = DATABASE()
AND table_type = 'BASE TABLE';

-- Step 2: Copy the output from above and execute those statements
-- Or use this stored procedure approach:

DELIMITER $$

DROP PROCEDURE IF EXISTS truncate_all_tables$$

CREATE PROCEDURE truncate_all_tables()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE table_name_var VARCHAR(255);
    DECLARE cur CURSOR FOR
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        AND table_type = 'BASE TABLE';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    SET FOREIGN_KEY_CHECKS = 0;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO table_name_var;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET @sql = CONCAT('TRUNCATE TABLE `', table_name_var, '`');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        SELECT CONCAT('Truncated table: ', table_name_var) AS status;
    END LOOP;

    CLOSE cur;
    SET FOREIGN_KEY_CHECKS = 1;
END$$

DELIMITER ;

-- Execute the procedure
CALL truncate_all_tables();

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify tables are empty
SELECT
    table_name,
    table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
AND table_type = 'BASE TABLE'
ORDER BY table_name;
