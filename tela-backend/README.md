# Tela Backend - Freelancer Client Portal SaaS

Complete REST API built with Node.js, Express.js, and MongoDB.

## Features

- **Authentication System**: JWT-based auth with email verification, password reset, and client invitations
- **Client Management**: Create, manage, and invite clients
- **Project Management**: Full project lifecycle with status tracking
- **Milestones**: Track project milestones with approval workflow
- **Real-time Feed**: Project-based messaging with file attachments
- **File Management**: Upload and manage project files with Cloudinary
- **Invoicing**: Create, send, and track invoices with Stripe integration
- **Proposals**: Generate shareable proposals with public links
- **Notifications**: Real-time notifications for key events

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

3. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register freelancer
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/invite-client` - Invite client (freelancer only)
- `POST /api/auth/set-password/:token` - Set password for invited client
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update user profile
- `PUT /api/auth/update-password` - Update password

### Clients
- `GET /api/clients` - Get all clients (with search & pagination)
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get single client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Projects
- `GET /api/projects` - Get all projects (with search & pagination)
- `POST /api/projects` - Create project (with contract upload)
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Milestones
- `GET /api/projects/:projectId/milestones` - Get all milestones
- `POST /api/projects/:projectId/milestones` - Create milestone
- `PUT /api/projects/:projectId/milestones/:id` - Update milestone
- `DELETE /api/projects/:projectId/milestones/:id` - Delete milestone

### Feed
- `GET /api/projects/:projectId/feed` - Get feed messages
- `POST /api/projects/:projectId/feed` - Create message (with attachments)

### Files
- `GET /api/projects/:projectId/files` - Get all files
- `POST /api/projects/:projectId/files` - Upload file
- `DELETE /api/projects/:projectId/files/:id` - Delete file

### Invoices
- `GET /api/invoices` - Get all invoices (with pagination)
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get single invoice
- `PUT /api/invoices/:id` - Update invoice (draft only)
- `PUT /api/invoices/:id/send` - Send invoice to client
- `POST /api/invoices/:id/pay` - Create payment intent (client only)
- `POST /api/invoices/webhook` - Stripe webhook handler
- `GET /api/invoices/check-overdue` - Check and mark overdue invoices

### Proposals
- `GET /api/proposals` - Get all proposals
- `POST /api/proposals` - Create proposal with shareable link
- `GET /api/proposals/public/:slug` - Get public proposal (no auth)
- `PUT /api/proposals/:id/accept` - Accept proposal
- `PUT /api/proposals/:id/reject` - Reject proposal

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `PUT /api/notifications/:id/read` - Mark single as read

## Architecture

### MVC Structure
- **Models**: Mongoose schemas for all data entities
- **Controllers**: Business logic and request handling
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, authorization, and error handling
- **Utils**: Helper functions (email, tokens, file upload)

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Role-based access control (freelancer/client)
- Ownership verification on all protected routes
- Input validation
- CORS configuration

### File Upload
- Cloudinary integration for file storage
- Multer for multipart/form-data handling
- Support for PDFs, images, and zip files
- 10MB file size limit

### Payment Integration
- Stripe PaymentIntent API
- Webhook handling for payment confirmation
- Automatic invoice status updates

## Email Templates

All email notifications include:
- Email verification
- Client invitation
- Password reset
- Invoice sent
- Invoice overdue reminder
- Milestone approved
- Proposal accepted

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "totalPages": 5,
  "currentPage": 1
}
```

## Cron Jobs

Set up a cron job to check overdue invoices:
```bash
# Every day at midnight
0 0 * * * curl http://localhost:5000/api/invoices/check-overdue
```

## Testing

Use tools like Postman or Thunder Client to test the API endpoints. Import the collection from the `/docs` folder (if provided).

## License

MIT
