import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import { 
  Download, Database, FileCode, Settings, Package, 
  Shield, FolderOpen, CheckCircle2, AlertTriangle, Code2
} from 'lucide-react';

const ALL_ENTITIES = [
  'Product', 'Order', 'User', 'CartItem', 'WishlistItem', 'ProductCategory', 
  'ProductAttribute', 'ProductReview', 'ProductSEO', 'ProductVideo', 'DigitalProductEnhanced',
  'DigitalDownload', 'UserPersonalization', 'UserPreferenceCenter', 'UserProfileLayout',
  'EmailCampaign', 'LandingPage', 'ABTest', 'AdvancedCoupon', 'SocialMediaCampaign',
  'DynamicPromotion', 'BlogPost', 'Video', 'Podcast', 'LiveStream', 'Event',
  'Group', 'ForumThread', 'PaymentGatewayConfig', 'WebhookLog', 'AutomationRule',
  'ScheduledTask', 'BackgroundJob', 'IntegrationConfig', 'APIEndpoint', 'DataTransformation'
];

export default function AdminSelfHostExport() {
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState(null);

  const exportDatabaseSchema = async () => {
    setExporting(true);
    setExportType('database');
    setExportProgress(0);

    try {
      let schemaSQL = `-- Glory Wave - MySQL Database Schema
-- Generated: ${new Date().toISOString()}
-- Engine: InnoDB, Character Set: utf8mb4
-- WARNING: This will create/modify tables. Review before executing.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

`;

      for (let i = 0; i < ALL_ENTITIES.length; i++) {
        const entityName = ALL_ENTITIES[i];
        setExportProgress(Math.round((i / ALL_ENTITIES.length) * 100));
        
        try {
          const schema = await base44.entities[entityName].schema();
          const tableName = entityName.toLowerCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
          
          schemaSQL += `
-- Table: ${tableName}
DROP TABLE IF EXISTS \`${tableName}\`;
CREATE TABLE \`${tableName}\` (
  \`id\` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  \`created_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`created_by\` VARCHAR(255),
`;

          if (schema?.properties) {
            Object.entries(schema.properties).forEach(([field, def]) => {
              const sqlType = getSQLType(def);
              const nullable = !schema.required?.includes(field);
              schemaSQL += `  \`${field}\` ${sqlType}${nullable ? '' : ' NOT NULL'}${def.default !== undefined ? ` DEFAULT '${def.default}'` : ''},\n`;
            });
          }

          schemaSQL += `  INDEX \`idx_created_date\` (\`created_date\`),
  INDEX \`idx_created_by\` (\`created_by\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
        } catch (error) {
          console.error(`Failed to export ${entityName}:`, error);
        }
      }

      schemaSQL += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;

      downloadFile(schemaSQL, 'glorywave-mysql-schema.sql', 'text/sql');
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  const getSQLType = (def) => {
    if (def.type === 'string') {
      if (def.format === 'date') return 'DATE';
      if (def.format === 'date-time') return 'TIMESTAMP';
      if (def.enum) return `ENUM(${def.enum.map(v => `'${v}'`).join(', ')})`;
      if (def.format === 'binary') return 'MEDIUMTEXT';
      return 'VARCHAR(255)';
    }
    if (def.type === 'number') return 'DECIMAL(10, 2)';
    if (def.type === 'integer') return 'INT';
    if (def.type === 'boolean') return 'BOOLEAN';
    if (def.type === 'object') return 'JSON';
    if (def.type === 'array') return 'JSON';
    return 'TEXT';
  };

  const exportAPIContracts = async () => {
    setExporting(true);
    setExportType('api');
    setExportProgress(0);

    const openAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Glory Wave API',
        version: '1.0.0',
        description: 'Complete API specification for Glory Wave self-hosted deployment'
      },
      servers: [
        { url: 'https://api.yourdomain.com/v1', description: 'Production' },
        { url: 'http://localhost:3000/v1', description: 'Local Development' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
        },
        schemas: {}
      },
      paths: {}
    };

    // Auth endpoints
    openAPISpec.paths['/auth/login'] = {
      post: {
        summary: 'User login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    refresh_token: { type: 'string' },
                    user: { type: 'object' }
                  }
                }
              }
            }
          },
          401: { description: 'Invalid credentials' }
        }
      }
    };

    // Generate CRUD endpoints for each entity
    for (let i = 0; i < ALL_ENTITIES.length; i++) {
      const entityName = ALL_ENTITIES[i];
      setExportProgress(Math.round((i / ALL_ENTITIES.length) * 100));
      
      const path = `/entities/${entityName.toLowerCase()}`;
      
      openAPISpec.paths[path] = {
        get: {
          summary: `List ${entityName} records`,
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
            { name: 'skip', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'sort', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Success', content: { 'application/json': { schema: { type: 'array' } } } }
          }
        },
        post: {
          summary: `Create ${entityName}`,
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: {
            201: { description: 'Created' },
            400: { description: 'Validation error' }
          }
        }
      };

      openAPISpec.paths[`${path}/{id}`] = {
        get: {
          summary: `Get ${entityName} by ID`,
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Success' }, 404: { description: 'Not found' } }
        },
        put: {
          summary: `Update ${entityName}`,
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } }
        },
        delete: {
          summary: `Delete ${entityName}`,
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } }
        }
      };
    }

    const yamlContent = JSON.stringify(openAPISpec, null, 2);
    downloadFile(yamlContent, 'glorywave-api-spec.json', 'application/json');
    
    setExporting(false);
    setExportProgress(0);
  };

  const exportEnvTemplate = async () => {
    const envTemplate = `# Glory Wave - Environment Configuration Template
# Copy this to .env and fill in your values

# Application
NODE_ENV=production
APP_NAME=Glory Wave
APP_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=glorywave
DB_USER=glorywave_user
DB_PASSWORD=your_secure_password_here
DB_CONNECTION_POOL_MIN=2
DB_CONNECTION_POOL_MAX=10

# Authentication
JWT_SECRET=your_jwt_secret_min_32_chars_required
JWT_EXPIRY=24h
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_REFRESH_EXPIRY=7d
SESSION_SECRET=your_session_secret_here
COOKIE_DOMAIN=.yourdomain.com

# File Storage
STORAGE_TYPE=local
# For local: absolute path
STORAGE_PATH=/var/www/glorywave/storage
# For S3-compatible:
# STORAGE_TYPE=s3
# S3_ENDPOINT=https://s3.amazonaws.com
# S3_BUCKET=glorywave-media
# S3_ACCESS_KEY=your_access_key
# S3_SECRET_KEY=your_secret_key
# S3_REGION=us-east-1

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_NAME=Glory Wave
SMTP_FROM_EMAIL=noreply@yourdomain.com

# External APIs (if used)
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Security
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://yourdomain.com
ENABLE_AUDIT_LOG=true

# Performance
CACHE_TTL=300
ENABLE_QUERY_CACHE=true
MAX_UPLOAD_SIZE=10485760

# Monitoring
LOG_LEVEL=info
LOG_FILE_PATH=/var/www/glorywave/logs/app.log
ENABLE_METRICS=true
`;

    downloadFile(envTemplate, 'env-template.txt', 'text/plain');
  };

  const exportAllData = async () => {
    setExporting(true);
    setExportType('data');
    setExportProgress(0);

    const allData = {};

    for (let i = 0; i < ALL_ENTITIES.length; i++) {
      const entityName = ALL_ENTITIES[i];
      setExportProgress(Math.round((i / ALL_ENTITIES.length) * 100));
      
      try {
        const records = await base44.entities[entityName].list();
        allData[entityName] = records;
      } catch (error) {
        allData[entityName] = [];
      }
    }

    downloadFile(JSON.stringify(allData, null, 2), 'glorywave-data-export.json', 'application/json');
    
    setExporting(false);
    setExportProgress(0);
  };

  const exportDeploymentGuide = () => {
    const guide = `# Glory Wave - Self-Host Deployment Guide

## Prerequisites
- cPanel hosting account with:
  - Node.js 18+ support
  - MySQL 8.0+
  - SSL certificate
  - Minimum 2GB RAM, 20GB storage

## Step 1: Database Setup

### 1.1 Create MySQL Database in cPanel
1. Navigate to cPanel → MySQL® Databases
2. Create database: \`glorywave_prod\`
3. Create user: \`glorywave_user\`
4. Set secure password (minimum 16 chars)
5. Grant ALL PRIVILEGES to user on database

### 1.2 Import Schema
1. Navigate to cPanel → phpMyAdmin
2. Select \`glorywave_prod\` database
3. Click "Import" tab
4. Upload \`glorywave-mysql-schema.sql\`
5. Execute import
6. Verify all ${ALL_ENTITIES.length} tables created

## Step 2: Backend Deployment

### 2.1 Setup Node.js App in cPanel
1. Navigate to cPanel → Setup Node.js App
2. Click "Create Application"
3. Configure:
   - Node.js version: 18.x or higher
   - Application mode: Production
   - Application root: \`glorywave-backend\`
   - Application URL: \`api.yourdomain.com\`
   - Application startup file: \`server.js\`
   - Environment variables: Copy from \`.env\` file

### 2.2 Upload Backend Files
\`\`\`bash
# Via SSH or File Manager
mkdir -p ~/glorywave-backend
cd ~/glorywave-backend

# Upload these files:
# - server.js
# - package.json
# - routes/
# - middleware/
# - controllers/
# - models/
# - .env (from template)
\`\`\`

### 2.3 Install Dependencies
\`\`\`bash
cd ~/glorywave-backend
npm install
\`\`\`

### 2.4 Start Application
- In cPanel Node.js App interface, click "Start"
- Application will be available at api.yourdomain.com

## Step 3: Frontend Deployment

### 3.1 Build Frontend
\`\`\`bash
# On your local machine
cd glorywave-frontend
npm install
npm run build
# This creates a 'dist' folder
\`\`\`

### 3.2 Upload to cPanel
1. Navigate to cPanel → File Manager
2. Go to \`public_html\` (or subdomain folder)
3. Upload contents of \`dist\` folder
4. Set permissions: 755 for folders, 644 for files

### 3.3 Configure .htaccess
Create \`.htaccess\` in public_html:
\`\`\`apache
# Enable React Router
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "no-referrer-when-downgrade"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript
</IfModule>
\`\`\`

## Step 4: SSL & Domain Configuration

1. Ensure SSL certificate is installed for both:
   - yourdomain.com
   - api.yourdomain.com
2. Force HTTPS redirection
3. Update API_URL in frontend build

## Step 5: Storage Configuration

### Option A: Local Storage
\`\`\`bash
mkdir -p ~/glorywave-storage
chmod 755 ~/glorywave-storage
\`\`\`

Update .env:
\`\`\`
STORAGE_TYPE=local
STORAGE_PATH=/home/yourusername/glorywave-storage
\`\`\`

### Option B: S3-Compatible Storage
Update .env with your S3 credentials

## Step 6: Cron Jobs (Background Tasks)

Add to cPanel → Cron Jobs:

\`\`\`
# Every 5 minutes - Process scheduled tasks
*/5 * * * * cd ~/glorywave-backend && node jobs/scheduler.js

# Daily at 2 AM - Database backup
0 2 * * * mysqldump -u glorywave_user -p'password' glorywave_prod > ~/backups/db_\$(date +\\%Y\\%m\\%d).sql

# Daily at 3 AM - Cleanup old logs
0 3 * * * find ~/glorywave-backend/logs -name "*.log" -mtime +30 -delete
\`\`\`

## Step 7: Testing

1. Test API health: \`curl https://api.yourdomain.com/health\`
2. Test frontend: Visit \`https://yourdomain.com\`
3. Test login functionality
4. Verify database connections
5. Test file uploads

## Step 8: Monitoring & Backup

### Monitoring
- Setup uptime monitoring (UptimeRobot, Pingdom)
- Enable error logging to file
- Monitor disk space usage

### Backup Strategy
1. **Database**: Daily automated backups via cron
2. **Files**: Weekly backup of storage folder
3. **Code**: Keep in Git repository
4. **Retention**: 30 days for daily, 90 days for weekly

## Troubleshooting

### Application won't start
- Check Node.js version
- Verify all env vars are set
- Check logs: \`tail -f ~/glorywave-backend/logs/app.log\`

### Database connection errors
- Verify MySQL credentials
- Check if database exists
- Ensure user has proper privileges

### File upload fails
- Check storage path permissions
- Verify MAX_UPLOAD_SIZE setting
- Check disk space

## Security Checklist
- [ ] All passwords changed from defaults
- [ ] SSL certificates installed and auto-renewing
- [ ] Firewall rules configured
- [ ] Database user has minimal required privileges
- [ ] .env file has restricted permissions (600)
- [ ] Regular security updates enabled
- [ ] Backup verification scheduled

## Performance Optimization
- Enable MySQL query cache
- Configure OPcache for PHP (if using)
- Use CDN for static assets
- Enable gzip compression
- Implement Redis for session storage (optional)

## Support
For issues, check:
1. Application logs
2. MySQL error logs
3. cPanel error logs
4. Browser console (frontend issues)
`;

    downloadFile(guide, 'DEPLOYMENT-GUIDE.md', 'text/markdown');
  };

  const exportMigrationChecklist = () => {
    const checklist = `# Self-Host Migration Checklist

## Pre-Migration
- [ ] Review current data size and estimate storage needs
- [ ] Export all data using Admin → Self-Host Export
- [ ] Download all uploaded media files
- [ ] Document all active integrations (Stripe, email, etc.)
- [ ] List all custom configurations

## Infrastructure Setup
- [ ] Provision cPanel hosting or VPS
- [ ] Configure domain and subdomains
- [ ] Install SSL certificates
- [ ] Create MySQL database and user
- [ ] Configure storage (local or S3)

## Database Migration
- [ ] Import MySQL schema (glorywave-mysql-schema.sql)
- [ ] Verify all tables created successfully
- [ ] Import data (glorywave-data-export.json)
- [ ] Run data validation queries
- [ ] Create database backup

## Backend Deployment
- [ ] Upload backend code to server
- [ ] Configure .env file with production values
- [ ] Install Node.js dependencies (npm install)
- [ ] Test database connectivity
- [ ] Start Node.js application
- [ ] Verify API health endpoint

## Frontend Deployment
- [ ] Build frontend (npm run build)
- [ ] Upload dist files to public_html
- [ ] Configure .htaccess for SPA routing
- [ ] Update API endpoint URLs
- [ ] Test frontend loads correctly

## Integration Configuration
- [ ] Configure SMTP for email sending
- [ ] Setup Stripe webhook endpoints (if using payments)
- [ ] Configure any third-party APIs
- [ ] Test email delivery
- [ ] Test payment processing (sandbox first)

## Background Jobs
- [ ] Setup cron jobs for scheduled tasks
- [ ] Configure job runner for background processing
- [ ] Test automation rules execution
- [ ] Verify webhook processing

## Security Hardening
- [ ] Change all default passwords
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Setup firewall rules
- [ ] Enable audit logging
- [ ] Restrict database user permissions
- [ ] Set proper file permissions (chmod)

## Testing Phase
- [ ] User registration and login
- [ ] Admin panel access
- [ ] Product browsing and search
- [ ] Shopping cart functionality
- [ ] Order placement
- [ ] File uploads
- [ ] Email notifications
- [ ] Live streaming features
- [ ] Community features (forums, groups)
- [ ] Admin CRUD operations

## Monitoring Setup
- [ ] Configure uptime monitoring
- [ ] Setup error tracking
- [ ] Enable performance monitoring
- [ ] Configure log rotation
- [ ] Setup disk space alerts

## Backup Strategy
- [ ] Automated daily database backups
- [ ] Weekly storage folder backups
- [ ] Offsite backup location configured
- [ ] Backup restoration tested
- [ ] Backup retention policy documented

## Go-Live
- [ ] DNS cutover to new infrastructure
- [ ] Monitor error logs for 24h
- [ ] Verify all features working
- [ ] Test performance under load
- [ ] Communicate migration to users

## Post-Migration
- [ ] Document any issues encountered
- [ ] Update internal documentation
- [ ] Schedule regular maintenance windows
- [ ] Review and optimize performance
- [ ] Plan for scaling if needed

## Rollback Plan (if needed)
- [ ] Keep old system running for 7 days
- [ ] Document rollback procedure
- [ ] Have database restoration tested
- [ ] Keep DNS TTL low initially (300s)

---
Estimated Migration Time: 4-8 hours
Recommended Team: 2 people (backend + frontend)
`;

    downloadFile(checklist, 'MIGRATION-CHECKLIST.md', 'text/markdown');
  };

  const exportSecuritySpecs = () => {
    const securityDoc = `# Glory Wave - Security & Authorization Specification

## 1. Authentication System

### 1.1 User Authentication Flow
\`\`\`
1. User submits email + password
2. Server validates credentials
3. Password verified using bcrypt (cost factor: 12)
4. JWT access token issued (24h expiry)
5. JWT refresh token issued (7d expiry)
6. Tokens returned to client
\`\`\`

### 1.2 Token Structure
**Access Token (JWT)**:
\`\`\`json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234654290
}
\`\`\`

### 1.3 Password Requirements
- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number
- Hashed using bcrypt with salt rounds: 12
- Password reset token expires: 1 hour

## 2. Role-Based Access Control (RBAC)

### 2.1 Roles
\`\`\`sql
CREATE TABLE roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name, description) VALUES
  (UUID(), 'admin', 'Full system access'),
  (UUID(), 'user', 'Standard user access'),
  (UUID(), 'moderator', 'Content moderation access'),
  (UUID(), 'editor', 'Content editing access');
\`\`\`

### 2.2 Permissions
\`\`\`sql
CREATE TABLE permissions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resource (resource)
);

-- Example permissions
INSERT INTO permissions (id, name, resource, action, description) VALUES
  (UUID(), 'products.create', 'products', 'create', 'Create new products'),
  (UUID(), 'products.read', 'products', 'read', 'View products'),
  (UUID(), 'products.update', 'products', 'update', 'Edit products'),
  (UUID(), 'products.delete', 'products', 'delete', 'Delete products'),
  (UUID(), 'orders.manage', 'orders', 'manage', 'Manage all orders'),
  (UUID(), 'users.manage', 'users', 'manage', 'Manage users'),
  (UUID(), 'settings.update', 'settings', 'update', 'Update site settings');
\`\`\`

### 2.3 Role-Permission Mapping
\`\`\`sql
CREATE TABLE role_permissions (
  id VARCHAR(36) PRIMARY KEY,
  role_id VARCHAR(36) NOT NULL,
  permission_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id)
);
\`\`\`

### 2.4 User Roles
Users table already has \`role\` column. For multiple roles:
\`\`\`sql
CREATE TABLE user_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role_id VARCHAR(36) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  granted_by VARCHAR(36),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
);
\`\`\`

## 3. Access Control Rules

### 3.1 Entity-Level Security
\`\`\`javascript
// Example middleware
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    const user = req.user; // from JWT
    
    // Admin bypass
    if (user.role === 'admin') return next();
    
    // Check permission
    const hasPermission = await db.query(\`
      SELECT 1 FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ? AND p.resource = ? AND p.action = ?
    \`, [user.id, resource, action]);
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};
\`\`\`

### 3.2 Row-Level Security
Users can only access their own records unless admin:
\`\`\`javascript
// Apply to queries
const applyRowLevelSecurity = (query, user, entity) => {
  if (user.role === 'admin') return query;
  
  // User can only see their own records
  return query.where('created_by', user.email);
};
\`\`\`

## 4. Rate Limiting

### 4.1 Configuration
\`\`\`javascript
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime
    });
  }
};
\`\`\`

### 4.2 Endpoint-Specific Limits
- Login: 5 attempts / 15 min
- API calls: 100 requests / 15 min
- File upload: 10 uploads / hour
- Admin endpoints: 1000 requests / 15 min

## 5. Audit Logging

### 5.1 Audit Log Table
\`\`\`sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(36),
  changes JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created_date (created_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
\`\`\`

### 5.2 Events to Log
- User login/logout
- Entity create/update/delete
- Permission changes
- Configuration updates
- Failed authentication attempts

## 6. CORS Configuration

\`\`\`javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://yourdomain.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};
\`\`\`

## 7. Input Validation

### 7.1 SQL Injection Prevention
- Use parameterized queries ALWAYS
- Never concatenate user input into SQL
- Use ORM/query builder with escaping

### 7.2 XSS Prevention
- Sanitize all user input before storage
- Escape output in templates
- Use Content Security Policy headers

### 7.3 CSRF Protection
- Use CSRF tokens for state-changing requests
- Verify origin/referer headers
- Use SameSite cookie attribute

## 8. Data Retention & Compliance

### 8.1 GDPR Compliance
- User data export endpoint: \`GET /api/users/me/export\`
- User data deletion: \`DELETE /api/users/me\` (marks for deletion)
- Cookie consent tracking
- Privacy policy acceptance logging

### 8.2 Data Retention Policies
| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Orders | 7 years | Financial/legal |
| Audit Logs | 5 years | Security/compliance |
| User Sessions | 30 days | Performance |
| Webhook Logs | 90 days | Debugging |
| Error Logs | 180 days | Analysis |

## 9. Session Management

### 9.1 Session Storage
\`\`\`sql
CREATE TABLE sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
\`\`\`

### 9.2 Session Invalidation
- On logout: Delete session
- On password change: Delete all sessions
- On account deletion: Delete all sessions
- Automatic cleanup of expired sessions (cron)

## 10. API Security Best Practices

1. **Always use HTTPS** in production
2. **Validate all input** server-side
3. **Implement rate limiting** on all endpoints
4. **Log security events** to audit log
5. **Regular security audits** of dependencies
6. **Keep secrets in .env** never in code
7. **Principle of least privilege** for database users
8. **Regular backups** with tested restoration
9. **Monitor for anomalies** in access patterns
10. **Keep software updated** (Node.js, MySQL, dependencies)
`;

    downloadFile(securityDoc, 'SECURITY-SPECIFICATION.md', 'text/markdown');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <EnterpriseHeader
        title="Self-Host Portability Package"
        subtitle="Export everything needed to run Glory Wave on your own infrastructure"
        icon={Package}
        badge="ENTERPRISE"
      />

      {exporting && (
        <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/50">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">Exporting {exportType}...</span>
                <span className="text-cyan-400 font-black">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-950/30 to-cyan-950/30 border-blue-500/40 hover:border-blue-500/60 transition-all">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-400" />
              Database Schema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-300 mb-4">
              Complete MySQL 8.0 schema with all {ALL_ENTITIES.length} entities, indexes, and constraints
            </p>
            <Button 
              onClick={exportDatabaseSchema}
              disabled={exporting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export MySQL Schema
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 border-purple-500/40 hover:border-purple-500/60 transition-all">
          <CardHeader className="border-b border-purple-500/20">
            <CardTitle className="text-white flex items-center gap-2">
              <FileCode className="w-6 h-6 text-purple-400" />
              API Specification
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-300 mb-4">
              OpenAPI 3.0 contracts for all endpoints with auth, validation, and error handling
            </p>
            <Button 
              onClick={exportAPIContracts}
              disabled={exporting}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export API Spec
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950/30 to-emerald-950/30 border-green-500/40 hover:border-green-500/60 transition-all">
          <CardHeader className="border-b border-green-500/20">
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-green-400" />
              Environment Config
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-300 mb-4">
              Complete .env template with all required configuration variables
            </p>
            <Button 
              onClick={exportEnvTemplate}
              disabled={exporting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export .env Template
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-950/30 to-red-950/30 border-orange-500/40 hover:border-orange-500/60 transition-all">
          <CardHeader className="border-b border-orange-500/20">
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-400" />
              Complete Data Export
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-300 mb-4">
              Full JSON export of all entities with current production data
            </p>
            <Button 
              onClick={exportAllData}
              disabled={exporting}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Data
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border-cyan-500/40 hover:border-cyan-500/60 transition-all">
          <CardHeader className="border-b border-cyan-500/20">
            <CardTitle className="text-white flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-cyan-400" />
              Deployment Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-300 mb-4">
              Step-by-step cPanel deployment runbook with all commands and configurations
            </p>
            <Button 
              onClick={exportDeploymentGuide}
              disabled={exporting}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Deployment Guide
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950/30 to-pink-950/30 border-red-500/40 hover:border-red-500/60 transition-all">
          <CardHeader className="border-b border-red-500/20">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-400" />
              Security Specification
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-300 mb-4">
              Complete RBAC model, auth flows, and security hardening guidelines
            </p>
            <Button 
              onClick={exportSecuritySpecs}
              disabled={exporting}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Security Docs
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border-purple-500/30">
        <CardHeader className="border-b border-purple-500/20">
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-purple-400" />
            Migration Checklist Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-slate-300 mb-4">
            Complete migration checklist with pre-migration, migration, and post-migration tasks
          </p>
          <Button 
            onClick={exportMigrationChecklist}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Generate Migration Checklist
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-500/30">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-white font-black text-lg mb-3">Important Notes</h3>
              <div className="space-y-2 text-slate-300 text-sm">
                <p>• Review all exported files before deploying to production</p>
                <p>• Update all placeholder values in .env template</p>
                <p>• Test the migration in a staging environment first</p>
                <p>• Ensure your hosting meets minimum requirements (Node 18+, MySQL 8.0+, 2GB RAM)</p>
                <p>• Keep backups of all data before migration</p>
                <p>• Monitor logs closely for first 24 hours after deployment</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}