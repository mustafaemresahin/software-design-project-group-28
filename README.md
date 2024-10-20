# Software Design Project - Group 28 (Backend)

## Project Overview
This project is the backend API for a software design project that manages event scheduling, user authentication, notifications, and user profile handling. Built with Node.js and Express, it uses MongoDB as the database and includes features such as JWT-based authentication, event matching, and user history tracking.

## Features
- User Registration and Login (with hashed passwords using `bcrypt`)
- JWT-based Authentication
- Event Creation and Management
- Notifications and User Matching
- User History Tracking
- Secure API endpoints using `helmet`
- CORS enabled for interaction with frontend

## Technologies Used
- **Node.js**: Server environment
- **Express**: Web framework for Node.js
- **MongoDB**: NoSQL Database
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB
- **bcrypt**: Library for hashing passwords
- **jsonwebtoken (JWT)**: Token-based authentication
- **axios**: Promise-based HTTP client
- **cors**: Middleware for enabling Cross-Origin Resource Sharing
- **helmet**: Secures Express apps by setting various HTTP headers
- **nodemon**: Development tool for automatically restarting the server

## Installation

### Prerequisites
- Node.js installed (v14 or higher)
- MongoDB installed locally or a MongoDB cloud instance (e.g., MongoDB Atlas)
- npm installed (comes with Node.js)

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/mustafaemresahin/software-design-project-group-28-backend.git
   cd software-design-project-group-28-backend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add the following environment variables:

    ```bash
    CONNECTION_STRING=<your-mongodb-connection-string>
    JWT_SECRET=<your-jwt-secret>
    ```

4. Start the server (development mode with `nodemon`):

    ```bash
    npm start
    ```

## Testing

To ensure the functionality of the backend API, this project includes unit tests using `Jest` and `Supertest`.

### Running the Test

To run all the tests, use the following command:

```bash
npm test
```

### Running a Specific Test

To run a specific test file, for example, `notifs.test.js`, use this command:

```bash
npm test -- tests/notifs.test.js
```

### Testing Features

- **User Authentication**: Ensures that users can successfully register, log in, and receive valid JWT tokens for authentication.
- **Event Management**: Verifies the creation, updating, deletion, and retrieval of events.
- **Notifications**: Validates the creation of notifications for new events, event updates, cancellations, and matching users to events.
- **Cron Jobs**: Simulates cron jobs that automatically send notifications for upcoming events.
