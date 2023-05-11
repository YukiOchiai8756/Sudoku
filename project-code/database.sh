#!/bin/bash

# DATABASE DUMP SCRIPT
# HOW TO USE:
# >> You must be in the root directory of the project (i.e. project-code).

# MERGES
# The best way to do a merge is to dump your database, then perform the merge on the dump file.
# The resultant dump can then be re-imported with "import force".

# COMMANDS:
# export
#   This is the default command. Exports the database file to the dump file, which is in plaintext. This dump file:
#        - Is in plain text, so can be versioned properly by Git
#        - Includes the Schema/CREATE TABLE statements
#        - Includes INSERT statements to add the data
#   For this reason it's best to export your database and commit the database.dump file if you have any changes you want to
#   Be pushed.

# import
#   Import is used to import the database.dump schema. By default, it will not override your existing database.
#   To replace an existing DB file, you have two options. Either delete the file then import, or run "import force".


BACKUP_FILENAME=database.dump
DATABASE_PATH=backend/SystemDesign
printf -v currentDate '%(%Y-%m-%d %H:%M:%S)T'

if [ "$1" == import ]; then
   # Import database
   if ! [ -f "$BACKUP_FILENAME" ]; then
      echo "Could not find database dump file."
      echo "Please make sure file $BACKUP_FILENAME exists."
      exit 1
   fi
   # Check if DB exists. if it does. exit and say "force" or delete
   if [ -f "$DATABASE_PATH" ] && ! [ "$2" == force ] && ! [ "$1" == force ]; then
         echo "DB $DATABASE_PATH already exists. To overwrite it, either delete the file or specify 'force'."
         echo "For example: ./database.sh import force"
         exit 1
   fi

   if [ -f "$DATABASE_PATH" ]; then
            # File exists and we're forcing
            echo "Using force: Deleting $DATABASE_PATH."
            rm "$DATABASE_PATH"
   fi

   # Actually do the import (Funnily enough, not that big of an operation)
   sqlite3 $DATABASE_PATH < $BACKUP_FILENAME

    echo "> Successfully imported $BACKUP_FILENAME to $DATABASE_PATH."
    exit 0
   elif [ "$1" == export ]; then
     # Assume it's an export
     echo "Dumping $DATABASE_PATH to $BACKUP_FILENAME."

     if not [ -f "$DATABASE_PATH" ]; then
            echo "Failed to dump: FIle $DATABASE_PATH does not exist. Check you are in the right directory, and the DB exists."
        fi
        echo "-- CS3099 Group 19 Database dump, exported at $currentDate by $USER." > $BACKUP_FILENAME
    sqlite3 $DATABASE_PATH .dump >> $BACKUP_FILENAME
    echo "BEGIN TRANSACTION;" >> $BACKUP_FILENAME
    echo "PRAGMA foreign_keys=ON;" >> $BACKUP_FILENAME
    echo "COMMIT;" >> $BACKUP_FILENAME
  else
    echo "Invalid command: Please specify import or export. Open this script to read documentation."
fi

