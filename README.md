# Customer Support Ticket Service

A full-stack customer support ticketing system built on the MERN stack, featuring role-based access control (RBAC) and JWT authentication. Customers can raise support tickets, agents can manage and resolve them, and admins have full oversight of users and ticket data.

## Features

- **Authentication & Authorization** — Secure signup/login with JWT-based session handling
- **Role-Based Access Control (RBAC)** — Separate permissions for `Customer`, `Agent`, and `Admin` roles
- **Ticket Management** — Create, view, update, assign, and close support tickets
- **Status Tracking** — Tickets move through states (e.g., `Open`, `In Progress`, `Resolved`, `Closed`)
- **Priority Levels** — Tag tickets by urgency (`Low`, `Medium`, `High`, `Critical`)
- **Comment Threads** — Agents and customers can communicate within a ticket
- **Admin Dashboard** — Manage users, roles, and view ticket analytics
- **Protected Routes** — Frontend and backend route guards based on user role
- **RESTful API** — Clean, documented endpoints for all core operations

## Tech Stack

**Frontend**
- React (functional components, hooks)
- Vite (build tool & dev server)
- React Router for navigation
- Axios for API calls
- Context API / Redux for state management *(update based on what you used)*

**Backend**
- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for auth
- bcrypt for password hashing

**Other**
- dotenv for environment configuration
- CORS middleware
- Postman (API testing)

## Folder Structure

```
customer-ticket-service/
├── frontend/                # React + Vite frontend
│   ├── public/
│   ├── src/
│   ├── eslint.config.js
│   ├── vite.config.js
│   ├── index.html
│   ├── package.json
│   └── README.md
├── backend/                 # Express backend
│   ├── config/              # DB connection, env setup
│   ├── controllers/
│   ├── middleware/           # auth, role-checking
│   ├── models/               # Mongoose schemas
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── README.md
```

## User Roles & Permissions

| Action                     | Customer | Agent | Admin |
|-----------------------------|:--------:|:-----:|:-----:|
| Create ticket                |    ✅    |   ❌  |  ❌   |
| View own tickets             |    ✅    |   ❌  |  ✅   |
| View all tickets             |    ❌    |   ✅  |  ✅   |
| Update ticket status         |    ❌    |   ✅  |  ✅   |
| Assign tickets to agents     |    ❌    |   ❌  |  ✅   |
| Manage users                 |    ❌    |   ❌  |  ✅   |
| Add comments                 |    ✅    |   ✅  |  ✅   |

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local instance or MongoDB Atlas)
- npm or yarn
- Postman (for API testing)

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/customer-ticket-service.git
   cd customer-ticket-service
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file inside `backend/` (use `.env.example` as a reference):
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```

5. **Run the backend**
   ```bash
   cd backend
   npm run dev
   ```

6. **Run the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

The frontend (Vite) runs at `http://localhost:5173` by default, with the API on `http://localhost:5000`.

## API Endpoints

### Auth
| Method | Endpoint              | Description           | Access |
|--------|------------------------|------------------------|--------|
| POST   | `/api/auth/register`   | Register new user      | Public |
| POST   | `/api/auth/login`      | Login & get JWT token  | Public |

### Tickets
| Method | Endpoint                  | Description                  | Access            |
|--------|----------------------------|-------------------------------|--------------------|
| POST   | `/api/tickets`              | Create a new ticket           | Customer           |
| GET    | `/api/tickets`              | Get all tickets                | Agent, Admin       |
| GET    | `/api/tickets/my`           | Get tickets for logged-in user | Customer           |
| GET    | `/api/tickets/:id`          | Get ticket by ID               | Owner, Agent, Admin|
| PUT    | `/api/tickets/:id/status`   | Update ticket status           | Agent, Admin       |
| PUT    | `/api/tickets/:id/assign`   | Assign ticket to agent          | Admin              |
| POST   | `/api/tickets/:id/comment`  | Add comment to ticket          | Customer, Agent, Admin |
| DELETE | `/api/tickets/:id`          | Delete a ticket                | Admin              |

### Users
| Method | Endpoint            | Description           | Access |
|--------|----------------------|------------------------|--------|
| GET    | `/api/users`          | List all users          | Admin  |
| PUT    | `/api/users/:id/role` | Update a user's role    | Admin  |

> Update the table above with the exact routes/params your implementation uses.

## Authentication Flow

1. User registers or logs in, receiving a signed JWT.
2. JWT is stored on the client (e.g., `localStorage` or HTTP-only cookie) and sent in the `Authorization: Bearer <token>` header on subsequent requests.
3. Backend middleware verifies the token and decodes the user's role.
4. Role-based middleware checks permissions before allowing access to protected routes.

## Testing

API endpoints were tested using **Postman**. A collection (`postman_collection.json`) can be added to the repo root for easy import and testing of all routes.

## Future Improvements

- Email/SMS notifications on ticket updates
- File attachments on tickets
- SLA tracking and automated escalation
- Analytics dashboard for ticket trends
- Real-time updates via WebSockets


---

*Built as part of ongoing full-stack development practice (MERN, JWT, RBAC).*
