# Mirai Server

Developed by: José Daniel Gómez Cabrera (Carnet: 21429)

Student from Universidad del Valle de Guatemala in Guatemala City, Guatemala.

This is a graduation work, with aspiration to contribute to the vocational orientation of Guatemala and Latin America.

This is a serverless AWS backend API built with Node.js and MongoDB for the Mirai application. This server provides authentication, content exploration, and interaction tracking functionality.

## Architecture

This server is designed as a serverless architecture with individual Lambda functions for each feature. Each function is self-contained with its own dependencies and can be deployed independently.

**Total Functions:** 36 Lambda functions

- 34 Feature functions
- 2 Authorizer functions (JWT and Webhook)

## Features

### Authentication (`/features/auth/`)

- **User Registration** (`register/`)

  - Creates new user accounts with Clerk integration
  - Validates user data and prevents duplicates
  - Encrypts PII data (first_name, last_name, username, email, image_url)
  - Dependencies: `mongoose`, `dotenv`
  - Uses: `crypto.utils.js` for encryption

- **User Update** (`updateUser/`)

  - Updates user profile information
  - Encrypts updated PII fields
  - Dependencies: `mongoose`, `dotenv`
  - Uses: `crypto.utils.js` for encryption

- **User Deletion** (`delete/`)
  - Handles user account removal
  - Dependencies: `mongoose`, `dotenv`

### Users (`/features/users/`)

- **Get User** (`getUser/`)

  - Retrieves user profile with decrypted PII
  - Supports traffic encryption (AES-256-GCM)
  - Dependencies: `mongoose`, `dotenv`
  - Uses: `crypto.utils.js`, `traffic.crypto.js`

- **Get Users** (`getUsers/`)

  - List users with pagination and filters
  - Decrypts PII for all users
  - Supports traffic encryption
  - Dependencies: `mongoose`, `dotenv`
  - Uses: `crypto.utils.js`, `traffic.crypto.js`

- **Edit User** (`editUser/`)

  - Updates user information
  - Dependencies: `mongoose`, `dotenv`

- **Saved Items** (`saved/`)
  - `saveItem/`: Save content for later
  - `getSavedItems/`: Retrieve saved content
  - `unsaveItem/`: Remove from saved items

### Careers (`/features/careers/`)

- **Get Careers** (`getCareers/`)

  - List all careers with filters (faculty, duration, name)
  - Optimized queries with projection
  - Dependencies: `mongoose`, `dotenv`

- **Get Career** (`getCareer/`)

  - Get detailed information about a specific career
  - Includes insights and statistics
  - Dependencies: `mongoose`, `dotenv`

- **Edit Career Insights** (`editCareerInsights/`)
  - Update career information and statistics
  - Dependencies: `mongoose`, `dotenv`

### Content Exploration (`/features/explore/`)

- **Feed Management** (`getFeed/`)

  - Retrieves paginated content feed
  - Supports filtering by content types: `career`, `alumni_story`, `what_if`, `short_question`
  - Implements priority-based sorting
  - Dependencies: `mongoose`, `dotenv`

- **Card Management** (`cards/`)

  - `newCard/`: Create new content cards with metadata
  - `getCard/`: Retrieve individual cards by ID
  - `editCard/`: Update card content
  - `deleteCard/`: Remove cards
  - Dependencies: `mongoose`, `dotenv`

- **Testimonies** (`getTestimonies/`)

  - Get student and alumni testimonials
  - Dependencies: `mongoose`, `dotenv`

- **Interactions** (`interactions/`)

  - `newInteraction/`: Record user interactions (`view`, `tap`, `save`, `share`)
  - `getInteractions/`: Retrieve interaction history
  - Supports duration tracking and metadata
  - Dependencies: `mongoose`, `dotenv`

- **Likes** (`likes/handleLikes/`)
  - Handle like/unlike actions on content
  - Dependencies: `mongoose`, `dotenv`

### Forums (`/features/forums/`)

- **Forum Management**

  - `newForum/`: Create new discussion forums
  - `getForums/`: List all forums (with decryption)
  - `getForum/`: Get forum details (with decryption)
  - `editForum/`: Update forum information
  - `deleteForum/`: Remove forums
  - Dependencies: `mongoose`, `dotenv`
  - Uses: `crypto.utils.js` for decryption (getForums, getForum)

- **Comments** (`comments/`)

  - `newComment/`: Create comments on forums
  - `editComment/`: Update comments
  - `deleteComment/`: Remove comments
  - Dependencies: `mongoose`, `dotenv`

- **Answers** (`comments/answers/`)
  - `newAnswer/`: Reply to comments
  - `editAnswer/`: Update answers
  - `deleteAnswer/`: Remove answers
  - Dependencies: `mongoose`, `dotenv`

### Quiz (`/features/quiz/`)

- **Results** (`results/`)
  - `getResults/`: Get quiz results for a user
  - `deleteResults/`: Remove quiz results
  - Dependencies: `mongoose`, `dotenv`

### Analytics (`/features/analytics/`)

- **Get Analytics** (`getAnalytics/`)
  - Student statistics and metrics
  - Quiz completion analytics
  - Monthly growth statistics
  - Quiz results analytics
  - Dependencies: `mongoose`, `dotenv`

### Middleware (`/middleware/`)

- **JWT Authorizer** (`auth/`)

  - JWT token validation using public key verification
  - Integrates with API Gateway for request authorization
  - Dependencies: `jsonwebtoken`
  - Environment: `JWT_PUBLIC_KEY`

- **Webhook Authorizer** (`webhook-auth/`)
  - Validates signed webhooks from Clerk
  - Environment: `CLERK_WEBHOOK_SECRET`

## Technology Stack

- **Runtime**: Node.js 20.x (ES Modules)
- **Database**: MongoDB (DocumentDB) with Mongoose ODM
- **Authentication**: JWT with Clerk integration
- **Architecture**: Serverless (AWS Lambda)
- **Environment**: dotenv for configuration
- **Encryption**: AES-256-CBC (at rest), AES-256-GCM (in transit)
- **Infrastructure as Code**: Terraform

## Environment Variables

### Common Environment Variables (All Functions)

These variables are required for all Lambda functions:

- `URI`: MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)
- `BACKEND_URL`: Base URL for the backend API (e.g., `https://api.miraiedu.online`)

### Encryption Variables

For functions that handle PII (Personally Identifiable Information):

- `ENCRYPTION_KEY`: 32-byte base64-encoded key for AES-256-CBC encryption (at rest)

  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - Used in: `auth/register`, `auth/updateUser`, `users/getUser`, `users/getUsers`, `forums/getForum`, `forums/getForums`

- `TRAFFIC_ENCRYPTION_KEY`: 32-byte base64-encoded key for AES-256-GCM encryption (in transit)
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - Used in: `users/getUser`, `users/getUsers`

### Authorizer Variables

For Lambda Authorizers:

- `JWT_PUBLIC_KEY`: Public key for JWT token verification (PEM format)

  - Used in: `middleware/auth`

- `CLERK_WEBHOOK_SECRET`: Secret key for Clerk webhook signature verification
  - Used in: `middleware/webhook-auth`

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
  - Body: `{ clerk_id, first_name, last_name, username, email, image_url?, role }`
  - Encrypts PII fields before storage
- `PUT /auth/updateUser` - Update user information
  - Body: `{ first_name?, last_name?, username?, email?, image_url? }`
  - Encrypts updated PII fields
- `DELETE /auth/delete` - Delete user account
  - Requires: `user_id` from JWT authorizer

### Users

- `GET /users/getUser` - Get user profile
  - Returns: Decrypted user data
  - Supports traffic encryption
- `GET /users/getUsers` - List users
  - Query params: `limit`, `offset`, `role?`
  - Returns: Decrypted user data
  - Supports traffic encryption
- `PUT /users/editUser` - Edit user information
  - Body: User update fields

### Saved Items

- `POST /users/saved/saveItem` - Save content item
- `GET /users/saved/getSavedItems` - Get saved items
- `DELETE /users/saved/unsaveItem` - Remove saved item

### Careers

- `GET /careers/getCareers` - List careers
  - Query params: `faculty?`, `duration?`, `name?`
- `GET /careers/getCareer` - Get career details
  - Path param: `career_id`
- `PUT /careers/editCareerInsights` - Update career insights

### Content Exploration

- `GET /explore/getFeed` - Get paginated content feed
  - Query parameters:
    - `limit` (default: 7, max: 20)
    - `offset` (default: 0)
    - `types` (comma-separated: `career`, `alumni_story`, `what_if`, `short_question`)
    - `user_context` (JSON string for user context)
- `GET /explore/getTestimonies` - Get testimonials

### Cards

- `POST /explore/cards/newCard` - Create a new content card
  - Body: `{ type, title, content, tags?, imageUrl?, priority?, color? }`
- `GET /explore/cards/getCard` - Retrieve a card by ID
  - Path param: `card_id`
- `PUT /explore/cards/editCard` - Update a card
  - Path param: `card_id`
- `DELETE /explore/cards/deleteCard` - Delete a card
  - Path param: `card_id`

### Interactions

- `POST /explore/interactions/newInteraction` - Record user interaction
  - Body: `{ cardId, action, duration?, metadata? }`
  - Actions: `view`, `tap`, `save`, `share`
- `GET /explore/interactions/getInteractions` - Get interaction history
  - Query params: `userId`, `cardId?`, `action?`

### Likes

- `POST /explore/likes/handleLikes` - Handle like/unlike
  - Body: `{ cardId, action: 'like' | 'unlike' }`

### Forums

- `POST /forums/newForum` - Create a new forum
  - Body: `{ title, description, career_id?, final_date? }`
- `GET /forums/getForums` - List all forums
  - Returns: Decrypted forum data
- `GET /forums/getForum` - Get forum details
  - Path param: `forum_id`
  - Returns: Decrypted forum data
- `PUT /forums/editForum` - Update forum
  - Path param: `forum_id`
- `DELETE /forums/deleteForum` - Delete forum
  - Path param: `forum_id`

### Comments

- `POST /forums/comments/newComment` - Create comment
  - Body: `{ forum_id, content }`
- `PUT /forums/comments/editComment` - Update comment
  - Path param: `comment_id`
- `DELETE /forums/comments/deleteComment` - Delete comment
  - Path param: `comment_id`

### Answers

- `POST /forums/comments/answers/newAnswer` - Reply to comment
  - Body: `{ comment_id, content }`
- `PUT /forums/comments/answers/editAnswer` - Update answer
  - Path param: `answer_id`
- `DELETE /forums/comments/answers/deleteAnswer` - Delete answer
  - Path param: `answer_id`

### Quiz

- `GET /quiz/results/getResults` - Get quiz results
  - Returns: User's quiz results and analysis
- `DELETE /quiz/results/deleteResults` - Delete quiz results

### Analytics

- `GET /analytics/getAnalytics` - Get system analytics
  - Returns: Student statistics, quiz completion rates, growth metrics

## Project Structure

```
mirai-server/
├── features/
│   ├── auth/
│   │   ├── register/
│   │   └── delete/
│   ├── explore/
│   │   ├── cards/
│   │   │   ├── newCard/
│   │   │   └── getCard/
│   │   ├── feed/
│   │   └── interactions/
│   │       └── newInteraction/
│   └── courses/ (planned)
└── middleware/
    └── auth/
```

Each feature directory contains:

- `index.js` - Main Lambda handler
- `schema.js` - MongoDB models and validation
- `package.json` - Dependencies
- `node_modules/` - Installed packages

## Data Models

### User Model

- `clerk_id`: Unique identifier from Clerk
- `created_at`: Account creation timestamp

### Card Model

- `type`: Content type (career, alumni_story, what_if, short_question)
- `title`: Card title
- `content`: Card content
- `tags`: Array of tags
- `imageUrl`: Card image URL
- `priority`: Display priority (higher numbers first)
- `color`: Card color theme
- `created_at`: Creation timestamp

### Interaction Model

- `cardId`: Reference to the card
- `action`: Type of interaction (view, tap, save, share)
- `duration`: Interaction duration (optional)
- `metadata`: Additional interaction data (optional)
- `created_at`: Interaction timestamp

## Installation & Setup

### Prerequisites

- **Node.js** >= 18.x (recommended: 20.x)
- **npm** >= 9.x
- **MongoDB** instance (local or cloud)
- **AWS CLI** configured with appropriate credentials
- **Terraform** >= 1.0 (for infrastructure deployment)

### Installing Dependencies for Each Lambda Function

Each Lambda function has its own `package.json` and must have dependencies installed independently.

#### Method 1: Install Dependencies for a Single Function

```bash
# Navigate to the specific function directory
cd features/auth/register

# Install dependencies
npm install

# This will create/update node_modules/ in that directory
```

#### Method 2: Install Dependencies for All Functions (Bulk)

Use this script to install dependencies for all functions:

```bash
# From the src/ directory
find features middleware -name "package.json" -execdir npm install \;
```

Or manually:

```bash
# Install for all feature functions
for dir in features/*/*/; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing dependencies in $dir"
    (cd "$dir" && npm install)
  fi
done

# Install for middleware functions
for dir in middleware/*/; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing dependencies in $dir"
    (cd "$dir" && npm install)
  fi
done
```

#### Method 3: Using the Provided Script (Recommended)

A script `install-all.sh` is provided in the `src/` directory:

```bash
# Make sure you're in the src/ directory
cd src

# Run the installation script
./install-all.sh
```

This script will:

- Install dependencies for all feature functions
- Install dependencies for all middleware functions
- Provide a summary of successful and failed installations
- Handle nested directories (e.g., `cards/`, `comments/`)

### Common Dependencies

Most functions use these common dependencies:

- `mongoose`: ^7.6.1 - MongoDB ODM
- `dotenv`: ^17.2.3 - Environment variable management

Some functions have additional dependencies:

- `jsonwebtoken`: ^9.0.2 - JWT handling (authorizers)
- Node.js built-in `crypto` module - Encryption utilities

## Local Development

### Setting Up Environment Variables

1. **Create a `.env` file** in each function directory (or use a shared one):

```bash
# .env file example
URI=mongodb+srv://user:password@cluster.mongodb.net/mirai?retryWrites=true&w=majority
BACKEND_URL=https://api.miraiedu.online
ENCRYPTION_KEY=your_32_byte_base64_key_here
TRAFFIC_ENCRYPTION_KEY=your_32_byte_base64_key_here
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
CLERK_WEBHOOK_SECRET=your_webhook_secret
```

2. **For functions using encryption**, generate keys:

```bash
# Generate encryption key (32 bytes, base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Save the output to ENCRYPTION_KEY in your .env file
```

### Testing Locally

#### Option 1: Using AWS SAM CLI

```bash
# Install AWS SAM CLI
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Test a function locally
sam local invoke RegisterFunction -e events/test-event.json
```

#### Option 2: Direct Node.js Testing

Create a test file `test-local.js` in the function directory:

```javascript
// test-local.js
import { handler } from "./index.js";
import dotenv from "dotenv";

dotenv.config();

// Mock Lambda event
const event = {
  httpMethod: "GET",
  pathParameters: {},
  queryStringParameters: {},
  headers: {},
  body: null,
  requestContext: {
    authorizer: {
      lambda: {
        user_id: "test_user_id",
      },
    },
  },
};

// Mock Lambda context
const context = {
  awsRequestId: "test-request-id",
  functionName: "test-function",
  functionVersion: "$LATEST",
};

// Invoke handler
handler(event, context)
  .then((result) => {
    console.log("Success:", JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

Run it:

```bash
node test-local.js
```

#### Option 3: Using Lambda Runtime Interface Emulator

```bash
# Install Docker (required)
# Pull the Lambda runtime image
docker pull public.ecr.aws/lambda/nodejs:20

# Run the function
docker run -p 9000:8080 \
  -v "$PWD":/var/task \
  -e URI="your_mongodb_uri" \
  public.ecr.aws/lambda/nodejs:20 \
  index.handler
```

## Deployment

### Manual Deployment (Single Function)

1. **Navigate to the function directory:**

```bash
cd features/auth/register
```

2. **Install dependencies (if not already done):**

```bash
npm install
```

3. **Create deployment package:**

```bash
# Create zip file excluding unnecessary files
zip -r function.zip . \
  -x "*.git*" \
  -x "*test*" \
  -x "*.md" \
  -x "*.log" \
  -x ".env*"
```

4. **Upload to AWS Lambda:**

```bash
# Using AWS CLI
aws lambda update-function-code \
  --function-name register \
  --zip-file fileb://function.zip \
  --region us-east-2

# Or create new function
aws lambda create-function \
  --function-name register \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables="{URI=your_uri,BACKEND_URL=your_url}" \
  --region us-east-2
```

5. **Set environment variables:**

```bash
aws lambda update-function-configuration \
  --function-name register \
  --environment Variables="{URI=your_uri,BACKEND_URL=your_url,ENCRYPTION_KEY=your_key}" \
  --region us-east-2
```

### Automated Deployment with Terraform

The recommended way to deploy all functions is using Terraform. See `terraform/README.md` for detailed instructions.

**Quick start:**

```bash
cd terraform

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize Terraform
terraform init

# Review deployment plan
terraform plan

# Deploy all functions
terraform apply
```

Terraform will automatically:

- Discover all Lambda functions
- Install dependencies (via archive_file data source)
- Create deployment packages
- Deploy to AWS with proper configuration
- Set environment variables
- Configure IAM roles and permissions

### Deployment Checklist

Before deploying each function, ensure:

- [ ] Dependencies installed (`npm install` completed)
- [ ] Environment variables configured
- [ ] Encryption keys generated (if function uses encryption)
- [ ] Function handler is `index.handler`
- [ ] Runtime is `nodejs20.x`
- [ ] Timeout and memory configured appropriately
- [ ] VPC configuration (if accessing DocumentDB in private subnet)
- [ ] Security groups configured (if in VPC)

### Function Configuration Guidelines

**Timeout:**

- Default: 30 seconds
- Database operations: 30-60 seconds
- Analytics functions: 60-120 seconds

**Memory:**

- Default: 256 MB
- Simple CRUD: 256 MB
- Complex queries/analytics: 512-1024 MB
- Functions with encryption: 512 MB

**VPC Configuration:**
Functions that access DocumentDB in private subnets need:

- VPC ID
- Subnet IDs (at least 2 in different AZs)
- Security group with DocumentDB access

## Project Structure

Each Lambda function follows this structure:

```
feature-name/
├── index.js              # Lambda handler (exports handler function)
├── schema.js             # MongoDB models and schemas (if needed)
├── crypto.utils.js       # Encryption utilities (if needed)
├── traffic.crypto.js     # Traffic encryption utilities (if needed)
├── package.json          # Dependencies
├── package-lock.json     # Locked dependencies
├── node_modules/         # Installed packages (gitignored)
└── .env                  # Environment variables (gitignored, local only)
```

### Lambda Handler Pattern

All functions export a `handler` function:

```javascript
// index.js
export const handler = async (event, context) => {
  try {
    // Function logic here
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Success",
        data: result,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Error",
        error: error.message,
      }),
    };
  }
};
```

### Database Connection Pattern

Functions use a connection pooling pattern:

```javascript
let conn = null;

const connect = async function () {
  if (conn == null) {
    conn = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    await conn.asPromise();
  }
  return conn;
};

// In handler
const db = (await connect()).db;
```

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" Error

**Problem:** Missing dependencies in deployment package.

**Solution:**

```bash
# Ensure node_modules is included in zip
cd function-directory
npm install
zip -r function.zip . -x "*.git*"
```

#### 2. "URI not found in environment" Error

**Problem:** Environment variable not set in Lambda.

**Solution:**

```bash
# Set environment variable
aws lambda update-function-configuration \
  --function-name function-name \
  --environment Variables="{URI=your_uri}" \
  --region us-east-2
```

#### 3. "ENCRYPTION_KEY must be 32 bytes" Error

**Problem:** Invalid encryption key format.

**Solution:**

```bash
# Generate correct key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Use output as ENCRYPTION_KEY value
```

#### 4. Timeout Errors

**Problem:** Function execution exceeds timeout.

**Solution:**

- Increase timeout in Lambda configuration
- Optimize database queries
- Check network connectivity (VPC configuration)

#### 5. VPC Connection Issues

**Problem:** Cannot connect to DocumentDB from Lambda.

**Solution:**

- Ensure Lambda is in same VPC as DocumentDB
- Verify security group allows Lambda → DocumentDB traffic
- Check subnet routing (NAT Gateway for internet access if needed)

### Debugging

#### View CloudWatch Logs

```bash
# Stream logs for a function
aws logs tail /aws/lambda/function-name --follow --region us-east-2
```

#### Test Function Locally with Real Database

```bash
# Set environment variables
export URI="your_mongodb_uri"
export ENCRYPTION_KEY="your_key"

# Run function
node test-local.js
```

## Scripts & Utilities

### List All Functions

```bash
# From src/ directory
find features middleware -name "index.js" -type f | sort
```

### Check Function Dependencies

```bash
# Check if all functions have package.json
find features middleware -name "index.js" | while read f; do
  dir=$(dirname "$f")
  if [ ! -f "$dir/package.json" ]; then
    echo "Missing package.json in $dir"
  fi
done
```

### Validate Environment Variables

A validation script `validate-env.js` is provided:

```bash
# Make sure you have a .env file in the current directory
# or set environment variables

# Run validation
node validate-env.js
```

This script will:

- Check for required environment variables
- Validate encryption key formats (32 bytes, base64)
- Validate MongoDB URI format
- Provide a detailed report of all variables

## Performance Optimization

### Connection Pooling

Functions reuse database connections across invocations:

```javascript
// Connection is cached between invocations
let conn = null;
```

### Cold Start Mitigation

- Keep dependencies minimal
- Use connection pooling
- Consider provisioned concurrency for critical functions

### Memory Optimization

- Start with 256 MB, increase if needed
- Monitor CloudWatch metrics
- Optimize for cost vs. performance

## Encryption Utilities

### At Rest Encryption (`crypto.utils.js`)

Functions that handle PII use AES-256-CBC encryption:

**Location:** `utils/repose.crypto.js` or copied to function directory

**Usage:**

```javascript
import {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
} from "./crypto.utils.js";

// Encrypt a single field
const encrypted = encrypt("John Doe");

// Decrypt a field
const decrypted = decrypt(encrypted);

// Encrypt multiple fields
const user = { first_name: "John", last_name: "Doe", role: "student" };
const encryptedUser = encryptFields(user, ["first_name", "last_name"]);

// Decrypt multiple fields
const decryptedUser = decryptFields(encryptedUser, ["first_name", "last_name"]);
```

**Functions using encryption:**

- `auth/register`
- `auth/updateUser`
- `users/getUser`
- `users/getUsers`
- `forums/getForum`
- `forums/getForums`

### In Transit Encryption (`traffic.crypto.js`)

Functions that need additional traffic encryption use AES-256-GCM:

**Location:** `utils/traffic.crypto.js` or copied to function directory

**Usage:**

```javascript
import { encryptPayload, decryptPayload } from "./traffic.crypto.js";

// Encrypt entire payload
const payload = { userId: 123, email: "user@example.com" };
const encrypted = encryptPayload(payload);

// Decrypt payload
const decrypted = decryptPayload(encrypted);
```

**Functions using traffic encryption:**

- `users/getUser`
- `users/getUsers`

See `utils/ENCRYPTION.md` and `utils/TRAFFIC_ENCRYPTION.md` for detailed documentation.

## Contributing

When adding new features:

1. **Create directory structure:**

   ```bash
   mkdir -p features/new-feature/new-endpoint
   cd features/new-feature/new-endpoint
   ```

2. **Initialize package.json:**

   ```bash
   npm init -y
   # Edit package.json to set "type": "module"
   ```

3. **Install dependencies:**

   ```bash
   npm install mongoose dotenv
   # Add other dependencies as needed
   ```

4. **Create required files:**

   - `index.js` - Lambda handler
   - `schema.js` - MongoDB models (if needed)
   - `crypto.utils.js` - If handling PII (copy from `utils/repose.crypto.js`)
   - `package.json` - Dependencies

5. **Follow patterns:**

   - Use connection pooling pattern
   - Implement proper error handling
   - Return consistent response format
   - Add CORS headers
   - Encrypt PII data if applicable

6. **Update documentation:**

   - Add feature to this README
   - Update API endpoints section
   - Document environment variables if new ones are needed

7. **Test locally:**

   - Create test event
   - Test with local MongoDB or connection string
   - Verify encryption/decryption if applicable

8. **Deploy:**
   - Install dependencies: `npm install`
   - Create deployment package
   - Deploy via Terraform or manually

## API Response Format

All functions should return consistent response format:

**Success:**

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"message\":\"Success\",\"data\":{...}}"
}
```

**Error:**

```json
{
  "statusCode": 400 | 404 | 500,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"message\":\"Error description\",\"error\":\"error details\"}"
}
```

## Security Best Practices

1. **Never commit sensitive data:**

   - Add `.env` to `.gitignore`
   - Use environment variables for all secrets
   - Store keys in AWS Secrets Manager for production

2. **Encrypt PII:**

   - Always encrypt: first_name, last_name, username, email, image_url
   - Use AES-256-CBC for at rest
   - Use AES-256-GCM for in transit (when needed)

3. **Validate inputs:**

   - Check required fields
   - Validate data types
   - Sanitize user inputs

4. **Error handling:**

   - Don't expose internal errors to users
   - Log errors to CloudWatch
   - Return generic error messages

5. **Authentication:**
   - Always validate JWT tokens
   - Check user permissions
   - Verify user_id from authorizer context

## License

This project is part of a Graduation Work at Universidad del Valle de Guatemala.

---

_This README is a living document. Please update it as the project evolves._
