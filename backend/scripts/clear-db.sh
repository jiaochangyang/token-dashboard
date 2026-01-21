#!/bin/bash

# Database Clear Script
# Provides an interactive way to clear all tables from the database

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${RED}⚠️  WARNING: DATABASE CLEAR OPERATION ⚠️${NC}"
echo -e "${RED}This will DELETE ALL DATA from all tables in the database!${NC}"
echo ""

# Database type selection
echo "Select your database type:"
echo "1) PostgreSQL"
echo "2) MySQL/MariaDB"
echo "3) SQLite"
echo "4) Cancel"
echo ""
read -p "Enter choice [1-4]: " DB_TYPE

case $DB_TYPE in
    1)
        DB_NAME="PostgreSQL"
        SQL_FILE="$SCRIPT_DIR/clear-database.sql"
        ;;
    2)
        DB_NAME="MySQL/MariaDB"
        SQL_FILE="$SCRIPT_DIR/clear-database-mysql.sql"
        ;;
    3)
        DB_NAME="SQLite"
        SQL_FILE="$SCRIPT_DIR/clear-database-sqlite.sql"
        ;;
    4)
        echo "Operation cancelled."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}You selected: $DB_NAME${NC}"
echo ""

# Final confirmation
read -p "Type 'DELETE ALL DATA' to confirm: " CONFIRM

if [ "$CONFIRM" != "DELETE ALL DATA" ]; then
    echo -e "${YELLOW}Confirmation failed. Operation cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Proceeding with database clear...${NC}"

# Execute based on database type
case $DB_TYPE in
    1)
        # PostgreSQL
        read -p "Enter PostgreSQL connection string (e.g., postgresql://user:pass@localhost:5432/dbname): " PG_CONN
        psql "$PG_CONN" -f "$SQL_FILE"
        ;;
    2)
        # MySQL
        read -p "Enter MySQL host [localhost]: " MYSQL_HOST
        MYSQL_HOST=${MYSQL_HOST:-localhost}
        read -p "Enter MySQL user: " MYSQL_USER
        read -sp "Enter MySQL password: " MYSQL_PASS
        echo ""
        read -p "Enter database name: " MYSQL_DB
        mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASS" "$MYSQL_DB" < "$SQL_FILE"
        ;;
    3)
        # SQLite
        read -p "Enter path to SQLite database file: " SQLITE_FILE
        if [ ! -f "$SQLITE_FILE" ]; then
            echo -e "${RED}Database file not found: $SQLITE_FILE${NC}"
            exit 1
        fi

        # Generate and execute DELETE statements for SQLite
        sqlite3 "$SQLITE_FILE" "PRAGMA foreign_keys = OFF;"

        # Get all table names and delete from them
        TABLES=$(sqlite3 "$SQLITE_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")

        for TABLE in $TABLES; do
            echo "Clearing table: $TABLE"
            sqlite3 "$SQLITE_FILE" "DELETE FROM $TABLE;"
        done

        sqlite3 "$SQLITE_FILE" "PRAGMA foreign_keys = ON;"
        sqlite3 "$SQLITE_FILE" "VACUUM;"
        ;;
esac

echo ""
echo -e "${GREEN}Database cleared successfully!${NC}"
