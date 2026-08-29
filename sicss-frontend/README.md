# SICSS Management System - Frontend

**Salvation In Christ School System - Progressive Web Application**

## Overview

SICSS Management System Frontend is a professional React + TypeScript Progressive Web Application (PWA) that provides offline-first capabilities for school management. Built with modern web technologies, it offers a seamless user experience with automatic synchronization to the Laravel backend.

## Features

### Authentication
- Login with email and password
- Token-based authentication (Laravel Sanctum)
- Persistent authentication state
- Automatic logout on token expiration
- Password reset support

### Role-Based Dashboards
- **Admin Dashboard**: Full system access including students, teachers, classes, finance, and sync monitoring
- **Teacher Dashboard**: Assigned classes, attendance, grades, assignments, and student comments
- **Finance Dashboard**: Fees, payments, receipts, and financial reports
- **Student Dashboard**: Grades, attendance, assignments, and announcements
- **Parent Dashboard**: Children profiles, attendance, grades, fees, and announcements

### School Management
- Students list with search and filters
- Teachers management
- Classes and divisions
- Subjects management

### Academic Operations
- Attendance recording with date filtering
- Grade management
- Assignment tracking
- Student comments

### Finance Management
- Fee structures
- Payment recording
- Receipt generation
- Financial reports

### Offline-First Capabilities
- **IndexedDB Storage**: Local database for offline data persistence
- **Automatic Sync**: Background synchronization when connection restored
- **Sync Queue**: Changes queued when offline
- **Conflict Detection**: Version-based conflict detection
- **Network Detection**: Real-time online/offline status
- **Offline Banner**: Visual indicator when working offline

### PWA Features
- Installable application
- Offline caching
- Service worker
- Background synchronization
- Responsive design (desktop, tablet, mobile)

## Technology Stack

- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **Forms**: React Hook Form
- **Validation**: Zod
- **HTTP Client**: Axios
- **Offline Storage**: IndexedDB (idb library)
- **PWA**: vite-plugin-pwa with Workbox

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd sicss-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment configuration**
```bash
cp .env.example .env
```

Update `.env` with your API URL:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build for Production

1. **Build the application**
```bash
npm run build
```

2. **Preview production build**
```bash
npm run preview
```

The production build will be in the `dist` directory.

## Project Structure

```
src/
├── components/       # Reusable UI components
├── layouts/         # Layout components (MainLayout)
├── pages/           # Page components
├── features/        # Feature modules
├── services/        # API services
├── store/           # State management (Zustand)
├── hooks/           # Custom React hooks
├── offline/         # Offline functionality
├── sync/            # Synchronization logic
├── database/        # IndexedDB setup
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── routes/          # Route configuration
├── App.tsx          # Main app component
└── main.tsx         # Application entry point
```

## API Integration

The frontend connects to the Laravel backend via RESTful API:

### Authentication
- Login: `POST /auth/login`
- Logout: `POST /auth/logout`
- Get User: `GET /auth/me`

### School Management
- Students: `GET/POST/PUT/DELETE /students`
- Teachers: `GET/POST/PUT/DELETE /teachers`
- Classes: `GET/POST/PUT/DELETE /classes`
- Subjects: `GET/POST/PUT/DELETE /subjects`

### Academic Operations
- Attendance: `GET/POST/PUT/DELETE /attendance`
- Grades: `GET/POST/PUT/DELETE /grades`
- Assignments: `GET/POST/PUT/DELETE /assignments`
- Comments: `GET/POST/PUT/DELETE /student-comments`

### Finance
- Fees: `GET/POST/PUT/DELETE /fees`
- Payments: `GET/POST/PUT/DELETE /payments`
- Receipts: `GET/POST/DELETE /receipts`
- Reports: `GET /financial-reports/*`

### Synchronization
- Push: `POST /sync/push`
- Pull: `POST /sync/pull`
- Status: `GET /sync/status`

## Offline Usage

### How Offline Mode Works

1. **Online Mode**: All operations are sent directly to the server
2. **Offline Mode**: Changes are saved to IndexedDB and queued for sync
3. **Reconnection**: Automatic synchronization when connection restored

### IndexedDB Tables

The following tables are stored locally:
- `users` - User accounts
- `students` - Student records
- `teachers` - Teacher records
- `classes` - Class information
- `subjects` - Subject information
- `attendance` - Attendance records
- `grades` - Grade records
- `assignments` - Assignment records
- `student_comments` - Student comments
- `fees` - Fee structures
- `payments` - Payment records
- `receipts` - Receipt records
- `sync_queue` - Pending sync operations

### Sync Process

1. User makes changes offline
2. Changes saved to IndexedDB
3. Changes added to sync queue
4. Connection restored
5. Auto-sync triggers (every 60 seconds)
6. Changes pushed to server
7. Server changes pulled to client
8. Conflicts resolved automatically

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/routes/index.tsx`
3. Add menu item in `src/layouts/MainLayout.tsx`

### Adding New Services

1. Create service in `src/services/`
2. Export functions for API calls
3. Use in components

## PWA Configuration

The PWA is configured in `vite.config.ts`:

- **Manifest**: App name, icons, theme color
- **Service Worker**: Auto-update registration
- **Caching**: Asset and API response caching
- **Offline Support**: NetworkFirst strategy for API

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- **Token Storage**: localStorage (consider httpOnly cookies for production)
- **HTTPS**: Required for production
- **CORS**: Configured in backend
- **Validation**: Client-side validation with Zod

## Performance

- **Bundle Size**: ~455KB (gzipped: ~141KB)
- **Lazy Loading**: Route-based code splitting
- **Caching**: Service worker caching
- **Optimization**: Vite build optimization

## Troubleshooting

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `rm -rf dist`

### Sync Issues
- Check network connection
- Verify API URL in .env
- Check IndexedDB in browser DevTools

### PWA Not Installing
- Ensure HTTPS (or localhost)
- Check service worker registration
- Verify manifest configuration

## Deployment

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload dist folder
```

### Traditional Hosting
```bash
npm run build
# Upload dist folder to web server
```

### Production Deployment Guide

#### 1. Build Configuration

**Environment Variables:**
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
```

**Build for Production:**
```bash
npm install
npm run build
```

#### 2. Server Deployment

**Apache:**
```apache
<VirtualHost *:80>
    ServerName your-frontend-domain.com
    DocumentRoot /var/www/sicss-frontend/dist

    <Directory /var/www/sicss-frontend/dist>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/sicss-frontend-error.log
    CustomLog ${APACHE_LOG_DIR}/sicss-frontend-access.log combined
</VirtualHost>
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;
    root /var/www/sicss-frontend/dist;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 3. HTTPS Requirement

PWA requires HTTPS to work properly. Configure SSL:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache -y

# Obtain SSL certificate
sudo certbot --apache -d your-frontend-domain.com
```

#### 4. PWA Installation

After deployment, users can install the PWA:

1. Open the application in a supported browser (Chrome, Edge, Safari)
2. Look for the install icon in the address bar
3. Click to install the application
4. The app will be available on the device home screen

#### 5. Performance Optimization

**Enable CDN:**
- Upload dist folder to CDN (Cloudflare, AWS CloudFront)
- Configure CDN to cache static assets

**Enable Compression:**
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

#### 6. Monitoring

**Google Analytics:**
Add tracking code to `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

**Error Tracking:**
Install Sentry:
```bash
npm install @sentry/react
```

Configure in `main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
});
```

#### 7. CI/CD Pipeline

**GitHub Actions:**
```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install
    - name: Build
      run: npm run build
    - name: Deploy
      run: |
        # Add your deployment script here
        echo "Deploying to production..."
```

### Offline Usage Guide

#### Installing PWA

1. Open the application in Chrome, Edge, or Safari
2. Click the install icon in the address bar
3. Confirm installation
4. The app will appear on your device home screen

#### Working Offline

1. **Initial Sync**: Ensure you're online and logged in to sync initial data
2. **Offline Mode**: Disconnect from internet - the app continues to work
3. **Data Entry**: Create/edit records while offline
4. **Sync Queue**: Changes are queued automatically
5. **Reconnection**: When internet is restored, sync happens automatically

#### Sync Process

**Automatic Sync:**
- Sync runs every 60 seconds when online
- Changes are pushed to server
- Server changes are pulled to device

**Manual Sync:**
- Click "Sync" button in the dashboard
- Sync runs immediately

**Conflict Resolution:**
- Version-based conflict detection
- Last Write Wins strategy (default)
- Failed sync items are retried

#### Troubleshooting Offline Issues

**Sync Not Working:**
- Check internet connection
- Verify API URL in .env
- Check browser console for errors
- Clear IndexedDB and re-sync

**PWA Not Installing:**
- Ensure HTTPS is enabled
- Check service worker registration
- Verify manifest configuration
- Clear browser cache and retry

**Data Not Persisting:**
- Check IndexedDB in browser DevTools
- Verify storage permissions
- Check browser compatibility

## Support

For issues and questions, please contact the development team.

## License

Proprietary - All rights reserved.

