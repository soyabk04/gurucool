# GuruCool LMS Backend

A scalable multi-tenant Learning Management System (LMS) backend built with **Node.js**, **Express**, **TypeScript**, and **MongoDB**.

The platform allows organizations to manage courses, users, and analytics while supporting role-based access control.

---

## Features

### Authentication & Authorization
- JWT Authentication
- Access & Refresh Tokens
- Cookie-based Authentication
- Role-based Authorization
- Password Hashing using bcrypt

### Organization Management
- Create Organizations
- Upload Organization Logo to Cloudflare R2
- Multi-tenant architecture
- Organization-wise data isolation

### User Management
- Admin
- Coordinator
- Student
- Bulk User Upload via CSV
- Email Notifications
- Password Generation

### Course Management
- Create Courses
- Upload Course Thumbnails
- Course Assignment
- Course Analytics

### Analytics
- Dashboard Statistics
- User Analytics
- Course Analytics
- Organization Analytics

### Storage
- Cloudflare R2 Integration
- Secure File Uploads

### Queue System
- BullMQ
- Redis
- Email Workers

### Security
- Rate Limiting
- CORS Configuration
- Error Handling Middleware
- Authentication Middleware

---

# Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- BullMQ
- Redis
- Cloudflare R2
- Nodemailer
- Zod

---

# Project Structure

```
src/
│
├── config/
│
├── controller/
│
├── services/
│
├── repository/
│
├── models/
│
├── routes/
│
├── middleware/
│
├── validator/
│
├── pipeline/
│
├── queue/
│
├── workers/
│
├── jobs/
│
├── storage/
│
├── utils/
│
├── errors/
│
└── index.ts
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/yourusername/gurucool-backend.git
```

Install dependencies

```bash
npm install
```

---

# Environment Variables

Create a `.env` file.

```env
PORT=3000

MONGODB_URI=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

REDIS_URL=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

EMAIL_USER=
EMAIL_PASSWORD=
```

---

# Running the Project

Development

```bash
npm run dev
```

Production

```bash
npm run build

npm start
```

---

# API Modules

## Authentication

- Login
- Logout
- Refresh Token

---

## Organizations

- Create Organization
- Get Organizations
- Organization Details

---

## Users

- Create User
- Upload Users using CSV
- Get Users
- Update User

---

## Courses

- Create Course
- Upload Thumbnail
- Get Courses
- Update Course

---

## Analytics

- Dashboard Analytics
- Course Analytics
- Organization Analytics

---

# File Uploads

The project uses **Cloudflare R2** for storing:

- Organization Logos
- Course Thumbnails
- User Upload Files

---

# Background Jobs

BullMQ workers handle:

- Email Queue
- Background Email Processing

---

# Validation

All request validation is performed using **Zod**.

---

# Security

- JWT Authentication
- Refresh Tokens
- HTTP Only Cookies
- Password Hashing
- Rate Limiting
- CORS Protection

---

# Error Handling

Centralized error handling using:

- Custom AppError
- Error Middleware
- Async Handler

---

# Future Improvements

- Course Chapters
- Video Streaming
- Student Progress Tracking
- Certificates
- Quizzes
- Live Classes
- Notifications
- Discussion Forum
- Payments
- Audit Logs

---

# License

MIT License
