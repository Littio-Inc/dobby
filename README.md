# Dobby - Internal Backoffice Dashboard

Main dashboard for Littio's internal backoffice system. Shell application with dynamic microfrontend loading.

## 🎯 Responsibilities

- Main interface after login
- Sidebar menu with options by area
- Dynamic microfrontend loading
- Authentication management (integration with Azkaban)
- Navigation and routing

## 🏗️ Architecture

```
dobby/
├── src/
│   ├── components/
│   │   ├── atoms/              # Base components
│   │   ├── molecules/
│   │   └── organisms/
│   │       ├── navigation-sidebar.vue
│   │       ├── dashboard-header.vue
│   │       └── login-container.vue
│   ├── layouts/
│   │   ├── AuthLayout.astro
│   │   └── DashboardLayout.astro
│   ├── pages/
│   │   ├── index.astro         # Main dashboard
│   │   ├── login.astro        # Login page
│   │   ├── monetization.astro # Monetization page
│   │   └── admin/
│   │       └── users.astro     # User management
│   ├── stores/
│   │   ├── auth-store.ts      # Authentication state
│   │   └── common/
│   │       └── api-client.ts  # API clients
│   ├── utils/
│   │   ├── firebase-config.ts
│   │   └── totp-service.ts
│   └── styles/
│       └── global.css
├── .github/workflows/          # CI/CD workflows
├── package.json
├── astro.config.mjs
├── tailwind.config.js
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Docker and Docker Compose (for local development with services)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Littio-Inc/dobby.git
cd dobby
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:

```env
PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
PUBLIC_AZKABAN_API_URL=http://localhost:8001
PUBLIC_CASSANDRA_API_URL=https://your-cassandra-api-url.execute-api.us-east-1.amazonaws.com
```

### Running Locally

#### Option 1: Standalone (Frontend only)

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

#### Option 2: With Docker Compose (Full stack)

From the parent directory (`ministry/`):

```bash
docker-compose up
```

This will start:

- `azkaban-api` (Authentication service) on port 8001
- `azkaban-db` (PostgreSQL) on port 5433
- `dobby-dashboard` (This application) on port 4321
- `redis` on port 6379

## 📋 Available Scripts

### Development

```bash
# Start development server
npm run dev

# Start development server with host binding (for Docker)
npm run dev -- --host

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint -- --fix

# Check code formatting with Prettier
npm run format:check

# Format code with Prettier
npm run format
```

### Astro CLI

```bash
# Run Astro CLI commands
npm run astro -- <command>
```

## 🛠️ Development

### Project Structure

- **`src/components/`** - Vue components organized by atomic design
  - `atoms/` - Basic reusable components
  - `molecules/` - Composite components
  - `organisms/` - Complex page sections
- **`src/layouts/`** - Astro layout components
- **`src/pages/`** - Astro pages (routing)
- **`src/stores/`** - State management (Nanostores)
- **`src/utils/`** - Utility functions

### Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static site generator with SSR support
- **UI Library**: [Vue 3](https://vuejs.org/) - Progressive JavaScript framework
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **State Management**: [Nanostores](https://github.com/nanostores/nanostores) - Lightweight state manager
- **Authentication**: Firebase Authentication (Google OAuth)
- **2FA**: TOTP (Google Authenticator)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Sidebar Menu

- 🏠 Home
- 💰 Monetization (B2B payouts)
- 💵 FinOps
- 👥 Customer Success
- 📊 Accounting
- 📢 Marketing
- 👔 Human Resources
- ⚙️ Administration
  - 👤 Users (Admin only)

## 🔧 Configuration

### ESLint

Configuration file: `eslint.config.js`

- Uses TypeScript ESLint
- Vue plugin for Vue components
- Astro plugin for Astro files
- Formatting rules disabled (handled by Prettier)

### Prettier

Configuration file: `.prettierrc.json`

- Print width: 120 characters
- Single quotes
- Trailing commas: all
- Single attribute per line

### TypeScript

Configuration file: `tsconfig.json`

- Strict mode enabled
- Vue support
- Path aliases configured

## 🚢 Deployment

### Staging

Automatically deploys to staging when pushing to `main` branch.

Manual trigger:

```bash
gh workflow run staging-deployment.yml
```

### Production

Manual deployment via GitHub Actions:

1. Go to Actions tab in GitHub
2. Select "Production deployment" workflow
3. Click "Run workflow"

### Deployment Process

1. Build static files (`npm run build`)
2. Upload to S3 bucket
3. Invalidate CloudFront cache

## 📚 Integration

### Azkaban (Authentication Service)

- Base URL: `PUBLIC_AZKABAN_API_URL`
- Endpoints:
  - `/v1/auth/*` - Authentication endpoints
  - `/v1/users/*` - User management
  - `/v1/roles/*` - Role management
  - `/v1/permissions/*` - Permission management

### Cassandra (Payouts Service)

- Base URL: `PUBLIC_CASSANDRA_API_URL`
- Endpoints:
  - `/v1/payouts/*` - Payout operations
  - `/v1/quotes/*` - Quote operations
  - `/v1/recipients/*` - Recipient management
  - `/v1/wallets/*` - Wallet operations

## 🧪 Testing

Currently, testing is not set up. To add testing:

1. Install testing framework (e.g., Vitest)
2. Create test files in `src/**/*.test.ts` or `src/**/*.spec.ts`
3. Add test script to `package.json`

## 📝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run linter and formatter: `npm run lint && npm run format`
4. Commit your changes
5. Push to your branch
6. Create a Pull Request

### Commit Message Format

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## 📄 License

Internal use only - Littio Inc.

## 🔗 Related Projects

- [Azkaban](../azkaban/) - Authentication service
- [Cassandra](../../cassandra/) - Payouts service
- [Portkey](../../portkey/) - Customer-facing application
