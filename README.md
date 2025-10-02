# ScientistShieldOne

## Project Purpose
ScientistShieldOne is a MERN-stack application for sharing knowledge and practicing coding. It provides a platform where users can learn through tutorials, test themselves with quizzes, and experiment with code in an integrated editor.

## Features
- **Tutorials:** Browse and read educational content on various topics.
- **Quizzes:** Evaluate understanding through interactive quizzes.
- **Code Editor:** Try out code snippets directly in the browser.

## Directory Structure
- `api/` – Node.js/Express backend including routes, controllers, and models.
- `client/` – React front-end powered by Vite.

## Prerequisites
- [Node.js](https://nodejs.org/) and npm
- [MongoDB](https://www.mongodb.com/)
- Environment variables (in a `.env` file at the project root or your shell):
    - `JWT_SECRET` – secret used to sign JSON Web Tokens.
    - `MONGO_URI` *(optional)* – MongoDB connection string (defaults to `mongodb://0.0.0.0:27017/myappp`).
    - `PORT` *(optional)* – port for the Express server (defaults to `3000`).
    - `CORS_ORIGIN` *(optional)* – allowed origin for CORS (defaults to `http://localhost:5173`).
    - `ELASTICSEARCH_NODE` *(optional)* – URL of your Elasticsearch node (e.g., `http://localhost:9200`).
    - `ELASTICSEARCH_USERNAME`/`ELASTICSEARCH_PASSWORD` *(optional)* – basic auth credentials for Elasticsearch.
    - `ELASTICSEARCH_API_KEY` *(optional)* – API key for Elasticsearch (takes precedence over username/password when provided).
    - `ELASTICSEARCH_INDEX_PREFIX` *(optional)* – prefix for Elasticsearch indices (defaults to `scientistshield`).

## Installation & Usage
1. Clone the repository and navigate into it.
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Install front-end dependencies:
   ```bash
   npm install --prefix client
   ```
4. Set the required environment variables.
5. Start the development servers:
    - Backend: `npm run dev`
    - Frontend: `npm run dev --prefix client`
6. For production build:
   ```bash
   npm run build
   npm start
   ```

## Contribution Guidelines
1. Fork the repository and create a new branch for your feature or fix.
2. Make your changes and run any available tests (`npm test`).
3. Commit your changes with a clear message and open a pull request.# ScientistShield_0.1
# ScientistShield0.2
# ScientistShield1.0
# ScientistShield2.0
