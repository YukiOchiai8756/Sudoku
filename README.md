# CS3099 Group 19 - Junior Honours Project
Fantastic Puzzles Fife

## Deploying
Deployment is made simple by the "deploy.sh" script.
### Dependencies
- NPM must be installed
- Node v16.18 (Standard on Lab machines/servers at time of writing)
- Tmux must be installed

### 1: Set up the database
#### 1.1: If the project has not been run before
If the project has never been run, so no database exists, this step is easy.
Run: 
```bash
./database.sh import
```

in the project root on a linux machine. This will read in the database.dump file and convert it into the backend database.

#### 1.2 If The project has been run before (and there are external changes)
You only need to follow these steps if there are external changes you want to persist to the datbase.

If there are none (for example, this is a release version), you can skip this step.

If you want to keep the contents of the database, you can export it to the database dump:
```bash
./database.sh export
```

Then pull your changes with `git pull` and merge them. You can then import the new file using:
```bash
./database.sh import force
```
Specifying "force" will make the script overwrite the current database
> Warning: Data loss is possible if using the force command without backing up data.

### Create deployment
1. Run the `./deploy.sh` script. It will run npm install in the backend and create a .env file from the template if one does not exist.
2. Configure the backend environment via. `.env`
   - The values from the template work out of the box for development
   - if running this on a pseudo user/server, you will need to change them.
3. Once the backend `.env` is configured, run `deploy.sh` again.
   - It will npm install in the frontend and create a .env
4. Configure the frontend environment via. `.env`
   - The values in the template work out of the box for development
5. Run `deploy.sh` a final time to create the backend deployment and build the frontend

The frontend will build, which will take some time. The backend will be deployed to a Tmux session called `backend`.




## Directory Structure
- Backend: The backend Node.js server. Contains a README with specific information
- Frontend: The frontend React code. Contains a README.
- .gitlab-ci.yml: Configuration file for Gitlab pipeline
- database.dump: Plain text export of database. This helps with merging via. Git.
- deploy.sh: Script used to deploy
- database.sh: Script used to generate database dumps and import dumps.


## .env files
- Detailed information on the purpose, type and defaults for environment files can be found in the respective README files for the frontend and backend.
- Only `.env.template` files are committed to version control. These contain example values and explainer comments to help creating a real one.
- `.env` files MUST NOT be committed to version control. This is for two reasons:
  - Security - Secrets may be held in them
  - Conflicts - These will conflict between dev/production and cause issues.
- 
