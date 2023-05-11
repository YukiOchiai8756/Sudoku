# CS3099 Group 19 Frontend

## Installing/Running

1. Clone the repository & navigate in `cd project-code`
2. navigate into the frontend folder: `cd frontend`
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
Values that start with REACT_APP_ are used by React during the build process, and are inserted into the finished code.
Secrets must not be added to the frontend, unless they are public.

| Variable name          | Type     | Default         | Notes                                                                                                                                                                                                                |
|------------------------|----------|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| REACT_APP_BACKEND_HOST | Host     | None (Reqd.)    | Base host of the frontend. Should be Protocol, hostname & port if needed. Usually http://localhost:8080 in development.                                                                                              |                                                        |
| REACT_APP_OAUTH        | Full URL | None (Required) | URL to redirect users to when they login with another group's server. Hashtags will be replaced with the target group number: Only need to change this if you are setting up multiple local instances to test OAuth. |



--- 

## Create React App docs
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Running for development

## Running tests

# Getting Started with Create React App

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more
information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will
remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right
into your project so you have full control over them. All of the commands except `eject` will still work, but they will
point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you
shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't
customize it when you are ready for it.

## Learn More

You can learn more in
the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved
here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved
here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved
here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved
here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved
here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved
here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
