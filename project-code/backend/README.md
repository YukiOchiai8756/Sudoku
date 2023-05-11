# CS3099 Group 19 - Backend

## API
### Permission level
| Perm Int | Meaning     |
|----------|-------------|
 | 0        | Normal user |
| 1        | Moderator   |
 | 2        | Admin       |

## Installing/Running

1. Clone the repository & navigate in `cd project-code`
2. navigate into the backend folder: `cd backend`
3. Install Node.js Dependencies: `npm install`
4. Set up environment
   1. Copy the `.env.template` file and rename to `.env`.
   2. Configure the environment variables as desired. Do not commit your `.env` file.
5. Start: `npm start`


## Environment Variables/Configuration
### .env Files
`.env` files are used to set up the environment. They can include secrets, so they should **not** be added to the repository.

To add a new environment variable:
- Add it to your .env file with your desired value
- Add it to the .env.template with comments describing what it does. This will allow everyone else to set it as needed in their own `.env` files.

### Values & Their purpose
| Variable name | Type                         | Default         | Notes                                                                                                                   |
|---------------|------------------------------|-----------------|-------------------------------------------------------------------------------------------------------------------------|
 | TOKEN_LENGTH  | Number                       | 100             | Length of the auth token/cookie. Probably doesn't need changed.                                                         |
 | FRONTEND_BASE | String                       | None (Required) | Base host of the frontend. Should be Protocol, hostname & port if needed. Usually http://localhost:3000 in development. |
 | GROUP_NO      | Number                       | None (Required) | Group number of our server. Sometimes changed for testing.                                                              |
 | PORT          | Number                       | 8080            | Port for the backend to listen on.                                                                                      |
 | NODE_ENV      | "development" or "production | None            | Defines whether the backend is deployed/being tested. Alters how node/express behave a little.                          |


### Error handling

Where possible, errors should be allowed to throw.
These will be caught by the Express server-wide error handler, and handled gracefully.
Promise rejections must be handled - they could be caught and thrown as a regular exception, however rejections cannot
be caught by express.

To return an error to the client, the best way is to throw a `HttpError`.
This ensures all of our errors follow a consistent format.
The `status` must be a valid [http status](https://httpstatuses.org/).
The error message can be any error code that is useful for the client code to work out what went wrong
The error description (optional) can be a user-readable string to describe the problem.

## Testing

Tests are created using Jest. Tests can be run using `npm run test`
