# Environment Variables Setup Guide

This guide explains how to configure environment variables for the REVU Platform API.

## Environment Files

The API supports multiple environment configuration files:

1. **`.env`** - Main environment configuration file
2. **`.env.local`** - Local overrides (gitignored)
3. **`.env.example`** - Example configuration template

## Required Environment Variables

### Core Configuration

```env
# Environment mode
NODE_ENV=development  # Options: development, production, test

# Server configuration
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### Database Configuration

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/revu_platform?schema=public"
```

**Alternative Database Options:**

1. **SQLite (for local development)**
   ```env
   DATABASE_URL="file:./dev.db"
   ```
   Note: Requires updating `prisma/schema.prisma` provider to "sqlite"

2. **Cloud PostgreSQL (Supabase, Neon, etc.)**
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   ```

### Redis Configuration

```env
REDIS_URL=redis://localhost:6379
```

**Alternative Redis Options:**

1. **Upstash Redis**
   ```env
   REDIS_URL=redis://default:password@your-upstash-endpoint:port
   ```

2. **Memory Cache (development only)**
   Set `MOCK_MODE=true` to use in-memory cache

### Authentication

```env
# JWT configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

⚠️ **Important**: Always use a strong, unique JWT_SECRET in production!

### Payment Integration (Toss Payments)

```env
# Test keys for development
TOSS_CLIENT_KEY=test_ck_your_test_client_key
TOSS_SECRET_KEY=test_sk_your_test_secret_key
```

Get your keys from: https://developers.tosspayments.com/

### Email Configuration (Optional)

```env
# SMTP settings for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### File Storage (Optional)

```env
# AWS S3 configuration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=your-bucket-name
```

## Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the values in `.env`** according to your setup

3. **For local development overrides**, create `.env.local`:
   ```bash
   touch .env.local
   ```

4. **Verify database connection:**
   ```bash
   npx prisma db push
   ```

## Environment-Specific Configurations

### Development Mode
- Uses local PostgreSQL and Redis
- Detailed error messages
- Hot reloading enabled
- CORS allows localhost origins

### Production Mode
- Uses production database URLs
- Minimal error messages
- Security headers enabled
- Strict CORS policy

### Test Mode
- Can use in-memory database
- Mock external services
- Isolated test database

## Running Without Docker

If you can't use Docker, you have several options:

1. **Install locally** (PostgreSQL + Redis)
2. **Use cloud services** (Supabase + Upstash)
3. **Use SQLite** (development only)
4. **Mock mode** (no database required)

See `RUN_WITHOUT_DOCKER.md` for detailed instructions.

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong secrets** for JWT and database passwords
3. **Rotate secrets regularly** in production
4. **Use environment-specific** configuration files
5. **Limit access** to production environment variables

## Troubleshooting

### Database Connection Issues
- Check if PostgreSQL is running: `pg_isready`
- Verify connection string format
- Ensure database exists: `createdb revu_platform`

### Redis Connection Issues
- Check if Redis is running: `redis-cli ping`
- Verify Redis URL format
- Check firewall/network settings

### Environment Variable Not Loading
- Ensure `.env` file is in the correct directory
- Check file permissions
- Restart the application after changes