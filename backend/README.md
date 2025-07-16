# DocuChat Backend API v2.0

A modular FastAPI application with JWT authentication, usage tracking, and plan-based limits.

## 🚀 Features

- **JWT Authentication**: Secure login/register with access and refresh tokens
- **User Management**: User profiles with plan-based restrictions
- **Document Analysis**: PDF/DOCX upload and AI-powered analysis
- **Chat with Documents**: Interactive chat about uploaded documents  
- **Usage Tracking**: Automatic tracking of documents, chats, and tokens
- **Plan Limits**: Free, Standard, and Pro plans with different limits
- **SQL Injection Protection**: Parameterized queries using SQLAlchemy ORM

## 📁 Project Structure

```
backend/
├── main.py              # FastAPI app with route registration
├── auth.py              # JWT token management and password hashing
├── dependencies.py      # Authentication and limit enforcement
├── database.py          # Database connection and session management
├── models.py            # SQLAlchemy database models
├── config.py            # Configuration settings
├── seed_plans.py        # Script to populate subscription plans
├── routes/
│   ├── auth.py          # Authentication endpoints
│   ├── documents.py     # Document upload/analysis endpoints
│   └── chat.py          # Chat functionality endpoints
└── requirements.txt     # Python dependencies
```

## 🛠️ Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```env
# Database (Supabase PostgreSQL)
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=your_db_name

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Initialize Database

```bash
# Seed subscription plans
python seed_plans.py
```

### 4. Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📊 Plan Limits

| Plan     | Price    | Documents | Chats | Tokens  |
|----------|----------|-----------|-------|---------|
| Free     | $0/month | 1         | 3     | 3,000   |
| Standard | $10/month| 50        | 100   | 100,000 |
| Pro      | $30/month| 120       | 350   | 350,000 |

## 🔐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get user profile with usage
- `GET /auth/profile` - Get user profile

### Documents
- `POST /documents/upload` - Upload and analyze PDF/DOCX
- `POST /documents/analyze-text` - Analyze pasted text
- `GET /documents/` - List user's documents
- `GET /documents/{id}` - Get specific document
- `DELETE /documents/{id}` - Delete document

### Chat
- `POST /chat/` - Chat about a document
- `GET /chat/history/{document_id}` - Get chat history for document
- `GET /chat/history` - Get all chat history
- `DELETE /chat/history/{document_id}` - Delete chat history

### Utility
- `GET /` - API info
- `GET /health` - Health check with database status

## 🔒 Authentication

All endpoints except `/auth/register`, `/auth/login`, `/`, and `/health` require authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## 📈 Usage Tracking

The system automatically tracks:
- **Documents**: Incremented on each file upload or text analysis
- **Chats**: Incremented on each chat message sent
- **Tokens**: Estimated based on text length (1 token ≈ 4 characters)

Usage resets monthly and is enforced before each operation.

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: Signed and time-limited
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
- **User Isolation**: All data is user-scoped
- **Plan Enforcement**: Limits checked before operations

## 🚧 Development

### Database Migrations

After modifying models.py, the database tables will be auto-created on next app startup.

### Adding New Routes

1. Create a new router in `routes/`
2. Import and include it in `main.py`
3. Use the dependency injection system for authentication and limits

### Testing

```bash
# Test database connection
curl http://localhost:8000/health

# Register a user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔄 Migration from v1.0

The old `main_old.py` contains the original monolithic code. Key changes:

- ✅ Authentication added with JWT
- ✅ User management and plans
- ✅ Database storage for documents and chats
- ✅ Usage tracking and limits
- ✅ Modular route structure
- ✅ SQL injection protection

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**: Check your `.env` file and Supabase credentials
2. **JWT Errors**: Ensure `JWT_SECRET_KEY` is set and consistent
3. **Import Errors**: Make sure all dependencies are installed
4. **Anthropic API Errors**: Verify your API key is valid and has credits

### Logs

Check the console output for detailed error messages and debugging information. 