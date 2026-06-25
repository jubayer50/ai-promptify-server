# 🚀 AIPromptify Backend

AIPromptify Backend is the server-side application for the **AIPromptify AI Prompt Sharing & Marketplace Platform**. It provides secure APIs for authentication, prompt management, user management, payments, analytics, and admin operations.

This backend handles all business logic, database operations, authentication, authorization, and payment processing for the platform.

---

## 📌 Project Overview

The backend powers the entire AIPromptify ecosystem by managing:

- User authentication and authorization
- AI prompt CRUD operations
- Premium subscription management
- Payment processing
- Bookmark and review system
- Admin moderation and analytics

It ensures secure communication between frontend and database using REST APIs, JWT authentication, and role-based authorization.

---

## ⚙️ Tech Stack

### Backend Technologies

- Node.js
- Express.js
- JavaScript
- JWT (JSON Web Token)

### Database

- MongoDB

### Authentication & Security

- Better Auth
- JWT Authentication
- Role-Based Authorization
- Protected APIs
- Environment Variables

### Payment Integration

- Stripe Payment Gateway

---

## ✨ Core Features

- 🔐 Secure user authentication and session management
- 👤 Role-based authorization (User / Creator / Admin)
- 🧠 Prompt management (Create, Read, Update, Delete)
- 🔖 Bookmark and review system
- 💳 Stripe payment integration for premium access
- 🛠 Admin dashboard APIs for moderation and analytics

---

## 🔑 API Features

### Authentication APIs

- User Registration
- User Login
- Session Management
- Role Verification

### Prompt APIs

- Create Prompt
- Get All Prompts
- Get Prompt Details
- Update Prompt
- Delete Prompt
- Featured Prompts

### User APIs

- Get User Profile
- Update User Role
- Manage Subscription

### Review APIs

- Add Review
- Get Reviews
- Delete Review

### Bookmark APIs

- Add Bookmark
- Remove Bookmark
- Get Saved Prompts

### Payment APIs

- Create Stripe Checkout Session
- Payment Success Handling
- Store Transaction History

### Admin APIs

- Manage Users
- Manage Prompts
- Manage Payments
- Handle Reports
- Analytics APIs
