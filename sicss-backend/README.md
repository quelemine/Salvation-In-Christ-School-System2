# SICSS Management System - Backend

**Salvation In Christ School System - Complete School Management Solution**

## Overview

SICSS Management System is a comprehensive school management platform built with Laravel 12 and PostgreSQL, featuring role-based access control, academic operations, finance management, and offline-first synchronization capabilities.

## Features

### Authentication & Authorization
- Laravel Sanctum token-based authentication
- Role-based access control (Admin, Teacher, Finance, Student, Parent)
- Permission system with granular controls
- Password reset functionality

### School Management
- **Divisions**: Early Childhood, Kindergarten, Primary, Junior Secondary
- **Classes**: Class management with sections and capacity tracking
- **Students**: Complete student records with academic history
- **Teachers**: Teacher profiles with class and subject assignments
- **Subjects**: Subject management with credits and scheduling

### Academic Operations
- **Attendance**: Daily attendance tracking with status management
- **Grades**: Grade recording with term and academic year tracking
- **Assignments**: Assignment creation and management
- **Student Comments**: Academic, behavioral, and general comments

### Finance Management
- **Fees**: Fee structure management with class-specific fees
- **Payments**: Payment recording with multiple payment methods
- **Receipts**: Automatic receipt generation
- **Financial Reports**: Daily, monthly, class, and outstanding balance reports

### Offline-First Synchronization
- **UUID-based entity tracking**: All syncable entities have unique identifiers
- **Version control**: Optimistic concurrency control for conflict detection
- **Sync logs**: Complete audit trail of all synchronization operations
- **Device management**: Track and manage multiple offline devices
- **Conflict resolution**: Multiple strategies (Last Write Wins, Server Wins, Merge, Manual)

## Technology Stack

- **Framework**: Laravel 12
- **Database**: PostgreSQL
- **Authentication**: Laravel Sanctum
- **API**: RESTful API with JSON responses
- **Validation**: Laravel Form Request Validation
- **Relationships**: Eloquent ORM with eager loading

## Installation

### Prerequisites
- PHP 8.2+
- Composer
- PostgreSQL 12+
- Node.js 18+ (for asset compilation)

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd sicss-backend
```

2. **Install dependencies**
```bash
composer install
```

3. **Environment configuration**
```bash
cp .env.example .env
```

Update `.env` with your database credentials:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sicss_management
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

4. **Generate application key**
```bash
php artisan key:generate
```

5. **Run migrations**
```bash
php artisan migrate
```

6. **Seed the database** (optional)
```bash
php artisan db:seed
```

7. **Start the development server**
```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

## API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication Endpoints

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer {token}
```

#### Get Current User
```
GET /auth/me
Authorization: Bearer {token}
```

### School Management Endpoints

#### Divisions
- `GET /divisions` - List all divisions
- `POST /divisions` - Create division (Admin only)
- `GET /divisions/{id}` - Get division details
- `PUT /divisions/{id}` - Update division (Admin only)
- `DELETE /divisions/{id}` - Delete division (Admin only)

#### Classes
- `GET /classes` - List all classes
- `POST /classes` - Create class (Admin only)
- `GET /classes/{id}` - Get class details
- `PUT /classes/{id}` - Update class (Admin only)
- `DELETE /classes/{id}` - Delete class (Admin only)

#### Students
- `GET /students` - List students (with search, filters)
- `POST /students` - Create student (Admin only)
- `GET /students/{id}` - Get student details
- `PUT /students/{id}` - Update student (Admin only)
- `DELETE /students/{id}` - Delete student (Admin only)

#### Teachers
- `GET /teachers` - List teachers
- `POST /teachers` - Create teacher (Admin only)
- `GET /teachers/{id}` - Get teacher details
- `PUT /teachers/{id}` - Update teacher (Admin only)
- `DELETE /teachers/{id}` - Delete teacher (Admin only)

#### Subjects
- `GET /subjects` - List subjects
- `POST /subjects` - Create subject (Admin only)
- `GET /subjects/{id}` - Get subject details
- `PUT /subjects/{id}` - Update subject (Admin only)
- `DELETE /subjects/{id}` - Delete subject (Admin only)

### Academic Operations Endpoints

#### Attendance
- `GET /attendance` - List attendance records
- `POST /attendance` - Record attendance
- `POST /attendance/bulk` - Bulk attendance recording
- `GET /attendance/{id}` - Get attendance details
- `PUT /attendance/{id}` - Update attendance
- `DELETE /attendance/{id}` - Delete attendance
- `GET /attendance/student/{studentId}/history` - Student attendance history
- `GET /attendance/class/{classId}/report` - Class attendance report

#### Grades
- `GET /grades` - List grades
- `POST /grades` - Create grade
- `GET /grades/{id}` - Get grade details
- `PUT /grades/{id}` - Update grade
- `DELETE /grades/{id}` - Delete grade
- `GET /grades/student/{studentId}/report` - Student grade report
- `GET /grades/class/report` - Class grade report

#### Assignments
- `GET /assignments` - List assignments
- `POST /assignments` - Create assignment
- `GET /assignments/{id}` - Get assignment details
- `PUT /assignments/{id}` - Update assignment
- `DELETE /assignments/{id}` - Delete assignment

#### Student Comments
- `GET /student-comments` - List comments
- `POST /student-comments` - Create comment
- `GET /student-comments/{id}` - Get comment details
- `PUT /student-comments/{id}` - Update comment
- `DELETE /student-comments/{id}` - Delete comment
- `GET /student-comments/student/{studentId}` - Student comments

### Finance Endpoints

#### Fees
- `GET /fees` - List fees
- `POST /fees` - Create fee (Admin/Finance only)
- `GET /fees/{id}` - Get fee details
- `PUT /fees/{id}` - Update fee (Admin/Finance only)
- `DELETE /fees/{id}` - Delete fee (Admin/Finance only)

#### Payments
- `GET /payments` - List payments
- `POST /payments` - Create payment
- `GET /payments/{id}` - Get payment details
- `PUT /payments/{id}` - Update payment
- `DELETE /payments/{id}` - Delete payment
- `GET /payments/student/{studentId}` - Student payments

#### Receipts
- `GET /receipts` - List receipts
- `POST /receipts` - Generate receipt
- `GET /receipts/{id}` - Get receipt details
- `DELETE /receipts/{id}` - Delete receipt

#### Financial Reports
- `GET /financial-reports/daily` - Daily payment report
- `GET /financial-reports/monthly` - Monthly payment report
- `GET /financial-reports/class` - Class financial report
- `GET /financial-reports/outstanding` - Outstanding balances
- `GET /financial-reports/student/{studentId}` - Student financial history

### Synchronization Endpoints

#### Push Changes
```
POST /sync/push
Content-Type: application/json

{
  "device_uuid": "unique-device-id",
  "device_name": "Device Name",
  "platform": "web",
  "changes": [
    {
      "entity_type": "students",
      "entity_uuid": "uuid",
      "action": "create",
      "data": {...}
    }
  ]
}
```

#### Pull Changes
```
POST /sync/pull
Content-Type: application/json

{
  "device_uuid": "unique-device-id",
  "last_sync_at": "2026-01-01T00:00:00Z"
}
```

#### Sync Status
```
GET /sync/status?device_uuid=unique-device-id
```

## Database Schema

### Syncable Tables
All syncable tables include:
- `uuid` - Unique identifier for synchronization
- `sync_status` - Sync status (pending, synced, conflict)
- `last_synced_at` - Last synchronization timestamp
- `version` - Version number for conflict detection

### Tables
- `users` - User accounts
- `roles` - User roles
- `permissions` - System permissions
- `divisions` - School divisions
- `classes` - School classes
- `academic_years` - Academic year tracking
- `students` - Student records
- `teachers` - Teacher records
- `subjects` - Subject information
- `attendance` - Attendance records
- `grades` - Grade records
- `assignments` - Assignment records
- `student_comments` - Student comments
- `fees` - Fee structures
- `payments` - Payment records
- `receipts` - Receipt records
- `sync_logs` - Synchronization logs
- `devices` - Device management

## Security

- **Password Hashing**: Bcrypt with 12 rounds
- **Token Expiration**: 60 minutes (configurable)
- **SQL Injection Protection**: Eloquent ORM with parameter binding
- **CORS**: Configured for frontend domains
- **Rate Limiting**: API rate limiting enabled
- **Validation**: Request validation on all endpoints

## Testing

Run PHPUnit tests):
```bash
php artisan test
```

## Deployment

### Production Build

1. **Optimize application**
```bash
php artisan optimize
```

2. **Run migrations in production**
```bash
php artisan migrate --force
```

3. **Cache configuration**
```bash
php artisan config:cache
php artisan route:cache
```

4. **Set environment variables**
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
```

### Server Requirements

- **PHP**: 8.2 or higher
- **Composer**: 2.x or higher
- **PostgreSQL**: 12 or higher
- **Web Server**: Apache (with mod_rewrite) or Nginx
- **Extensions**: 
  - BCMath
  - Ctype
  - cURL
  - DOM
  - Fileinfo
  - JSON
  - Mbstring
  - OpenSSL
  - PCRE
  - PDO
  - PDO PostgreSQL
  - Tokenizer
  - XML

### Deployment Steps

#### 1. Server Setup

**Ubuntu/Debian:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PHP and extensions
sudo apt install php8.2 php8.2-fpm php8.2-pgsql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Git
sudo apt install git -y
```

**CentOS/RHEL:**
```bash
# Install EPEL and Remi repositories
sudo yum install epel-release -y
sudo yum install https://rpms.remirepo.net/enterprise/remi-release-8.rpm -y

# Enable PHP 8.2
sudo yum module enable php:remi-8.2 -y

# Install PHP and extensions
sudo yum install php php-pgsql php-mbstring php-xml php-curl php-zip php-bcmath -y

# Install PostgreSQL
sudo yum install postgresql postgresql-server -y

# Initialize PostgreSQL
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE sicss_management;
CREATE USER sicss_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sicss_management TO sicss_user;
\q
```

#### 3. Application Deployment

```bash
# Clone repository
git clone <repository-url> /var/www/sicss-backend
cd /var/www/sicss-backend

# Install dependencies
composer install --no-dev --optimize-autoloader

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Edit .env with production values
nano .env

# Run migrations
php artisan migrate --force

# Set permissions
sudo chown -R www-data:www-data /var/www/sicss-backend
sudo chmod -R 755 /var/www/sicss-backend/storage
sudo chmod -R 755 /var/www/sicss-backend/bootstrap/cache
```

#### 4. Web Server Configuration

**Apache:**
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/sicss-backend/public

    <Directory /var/www/sicss-backend/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/sicss-error.log
    CustomLog ${APACHE_LOG_DIR}/sicss-access.log combined
</VirtualHost>
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/sicss-backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

#### 5. SSL Configuration (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-apache -y

# Obtain SSL certificate
sudo certbot --apache -d your-domain.com

# Auto-renewal is configured automatically
```

#### 6. Queue Worker Setup

```bash
# Install Supervisor
sudo apt install supervisor -y

# Create supervisor config
sudo nano /etc/supervisor/conf.d/sicss-worker.conf
```

**Supervisor Configuration:**
```ini
[program:sicss-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/sicss-backend/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/sicss-backend/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
# Start supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start sicss-worker:*
```

#### 7. Cron Jobs

```bash
# Edit crontab
sudo crontab -e

# Add Laravel scheduler
* * * * * php /var/www/sicss-backend/artisan schedule:run >> /dev/null 2>&1
```

### Monitoring

#### Log Monitoring
```bash
# View Laravel logs
tail -f /var/www/sicss-backend/storage/logs/laravel.log

# View queue worker logs
tail -f /var/www/sicss-backend/storage/logs/worker.log
```

#### Health Checks
```bash
# Check application status
curl https://your-domain.com/api/v1/health
```

### Backup Strategy

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U sicss_user sicss_management > /backups/sicss_$DATE.sql

# Keep last 7 days
find /backups -name "sicss_*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-script.sh
```

### Troubleshooting

**Permission Issues:**
```bash
sudo chown -R www-data:www-data /var/www/sicss-backend
sudo chmod -R 755 /var/www/sicss-backend/storage
sudo chmod -R 755 /var/www/sicss-backend/bootstrap/cache
```

**Queue Not Processing:**
```bash
sudo supervisorctl restart sicss-worker:*
```

**Cache Issues:**
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

## Offline Synchronization

The system supports offline-first operation with automatic synchronization:

1. **Device Registration**: Each device is registered with a unique UUID
2. **Change Tracking**: All changes are tracked with version numbers
3. **Sync Queue**: Changes are queued for synchronization
4. **Conflict Detection**: Version-based conflict detection
5. **Conflict Resolution**: Multiple resolution strategies available

## Support

For issues and questions, please contact the development team.

## License

Proprietary - All rights reserved.

