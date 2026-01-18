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
  const [generatedFiles, setGeneratedFiles] = useState([]);

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

  const exportCompletePackage = async () => {
    setExporting(true);
    setExportType('complete');
    setExportProgress(0);
    const files = [];

    // Step 1: Generate Database Schema (10%)
    setExportProgress(5);
    const mysqlSchema = await generateMySQLSchema();
    files.push({ name: 'db/mysql/schema.sql', content: mysqlSchema });

    setExportProgress(10);
    const postgresSchema = await generatePostgresSchema();
    files.push({ name: 'db/postgres/schema.sql', content: postgresSchema });

    // Step 2: Generate Migrations (20%)
    setExportProgress(15);
    const migrations = await generateMigrations();
    migrations.forEach((migration, idx) => {
      files.push({ name: `db/migrations/${String(idx + 1).padStart(3, '0')}_${migration.name}.sql`, content: migration.content });
    });

    // Step 3: Generate Seeds (25%)
    setExportProgress(20);
    const seeds = await generateSeedData();
    files.push({ name: 'db/seeds/initial_data.sql', content: seeds });

    // Step 4: Generate API Spec (40%)
    setExportProgress(30);
    const apiSpec = await generateOpenAPISpec();
    files.push({ name: 'api/openapi.yaml', content: apiSpec });

    // Step 5: Generate Backend Reference (55%)
    setExportProgress(45);
    const backendFiles = await generateBackendReference();
    backendFiles.forEach(file => files.push(file));

    // Step 6: Generate Frontend Package (70%)
    setExportProgress(60);
    const frontendFiles = await generateFrontendPackage();
    frontendFiles.forEach(file => files.push(file));

    // Step 7: Generate Deployment Guides (85%)
    setExportProgress(75);
    const deploymentGuide = generateDeploymentGuide();
    files.push({ name: 'deploy/cpanel-runbook.md', content: deploymentGuide });

    const vpsGuide = generateVPSGuide();
    files.push({ name: 'deploy/vps-runbook.md', content: vpsGuide });

    // Step 8: Generate Security Docs (95%)
    setExportProgress(90);
    const securityDoc = generateSecuritySpec();
    files.push({ name: 'security/rbac-specification.md', content: securityDoc });

    const storageDoc = generateStorageSpec();
    files.push({ name: 'storage/media-migration.md', content: storageDoc });

    // Step 9: Generate Architecture Diagram (98%)
    setExportProgress(95);
    const archDiagram = generateArchitectureDiagram();
    files.push({ name: 'docs/ARCHITECTURE.md', content: archDiagram });

    const readme = generateReadme();
    files.push({ name: 'README.md', content: readme });

    // Step 10: Package Everything (100%)
    setExportProgress(98);
    setGeneratedFiles(files);
    
    // Create a manifest
    const manifest = generateManifest(files);
    files.push({ name: 'MANIFEST.md', content: manifest });

    setExportProgress(100);
    
    // Download all files as individual downloads (browser doesn't support zip creation natively without library)
    setTimeout(() => {
      files.forEach((file, idx) => {
        setTimeout(() => {
          downloadFile(file.content, file.name.replace(/\\//g, '_'), 'text/plain');
        }, idx * 300);
      });
    }, 500);

    setTimeout(() => {
      setExporting(false);
      setExportProgress(0);
      window.alert(`✅ Generated ${files.length} files for self-host deployment!\n\nAll files have been downloaded. Check your downloads folder.`);
    }, files.length * 300 + 1000);
  };

  const generateMySQLSchema = async () => {
    let schema = `-- ============================================
-- Glory Wave - MySQL 8.0 Database Schema
-- Generated: ${new Date().toISOString()}
-- ============================================
-- Engine: InnoDB
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- Foreign Keys: Enabled
-- ============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

-- ============================================
-- CORE TABLES
-- ============================================

-- Users Table (Built-in)
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` VARCHAR(36) PRIMARY KEY,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(255),
  \`role\` ENUM('admin', 'user', 'moderator', 'editor') DEFAULT 'user',
  \`profile_image\` TEXT,
  \`is_active\` BOOLEAN DEFAULT TRUE,
  \`email_verified\` BOOLEAN DEFAULT FALSE,
  \`created_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_email\` (\`email\`),
  INDEX \`idx_role\` (\`role\`),
  INDEX \`idx_created_date\` (\`created_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;

    for (const entityName of ALL_ENTITIES) {
      try {
        const entitySchema = await base44.entities[entityName].schema();
        const tableName = toSnakeCase(entityName);
        
        schema += `-- ${entityName} Table\nDROP TABLE IF EXISTS \`${tableName}\`;\nCREATE TABLE \`${tableName}\` (\n`;
        schema += `  \`id\` VARCHAR(36) PRIMARY KEY,\n`;
        schema += `  \`created_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
        schema += `  \`updated_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n`;
        schema += `  \`created_by\` VARCHAR(255),\n`;

        if (entitySchema?.properties) {
          Object.entries(entitySchema.properties).forEach(([field, def]) => {
            const sqlType = getMySQLType(def);
            const nullable = !entitySchema.required?.includes(field);
            const defaultVal = getDefaultValue(def);
            schema += `  \`${toSnakeCase(field)}\` ${sqlType}${nullable ? '' : ' NOT NULL'}${defaultVal}\n`;
          });
        }

        schema += `  INDEX \`idx_created_date\` (\`created_date\`),\n`;
        schema += `  INDEX \`idx_created_by\` (\`created_by\`)\n`;
        schema += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
      } catch (error) {
        console.error(`Failed to generate schema for ${entityName}`);
      }
    }

    schema += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    return schema;
  };

  const generatePostgresSchema = async () => {
    let schema = `-- ============================================
-- Glory Wave - PostgreSQL 14+ Database Schema
-- Generated: ${new Date().toISOString()}
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator', 'editor')),
  profile_image TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_date ON users(created_date);

`;

    for (const entityName of ALL_ENTITIES) {
      try {
        const entitySchema = await base44.entities[entityName].schema();
        const tableName = toSnakeCase(entityName);
        
        schema += `-- ${entityName} Table\nDROP TABLE IF EXISTS ${tableName} CASCADE;\nCREATE TABLE ${tableName} (\n`;
        schema += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
        schema += `  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
        schema += `  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
        schema += `  created_by VARCHAR(255),\n`;

        if (entitySchema?.properties) {
          Object.entries(entitySchema.properties).forEach(([field, def]) => {
            const sqlType = getPostgresType(def);
            const nullable = !entitySchema.required?.includes(field);
            const defaultVal = getPostgresDefault(def);
            schema += `  ${toSnakeCase(field)} ${sqlType}${nullable ? '' : ' NOT NULL'}${defaultVal},\n`;
          });
        }

        schema = schema.slice(0, -2) + '\n);\n\n';
        schema += `CREATE INDEX idx_${tableName}_created_date ON ${tableName}(created_date);\n`;
        schema += `CREATE INDEX idx_${tableName}_created_by ON ${tableName}(created_by);\n\n`;
      } catch (error) {
        console.error(`Failed to generate Postgres schema for ${entityName}`);
      }
    }

    return schema;
  };

  const generateMigrations = async () => {
    return [
      {
        name: 'create_core_tables',
        content: `-- Migration 001: Core Tables\n-- This creates the essential tables for the application\n\n` + await generateMySQLSchema()
      }
    ];
  };

  const generateSeedData = async () => {
    return `-- ============================================
-- Glory Wave - Seed Data
-- ============================================

-- Create default admin user
-- Password: Admin@123 (CHANGE THIS IMMEDIATELY)
INSERT INTO users (id, email, password_hash, full_name, role, email_verified, is_active)
VALUES (
  UUID(),
  'admin@glorywave.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5Ru8QxqJR6rO6',
  'System Administrator',
  'admin',
  TRUE,
  TRUE
);

-- Create default product categories
INSERT INTO product_category (id, name, slug, description, is_active)
VALUES
  (UUID(), 'Apparel', 'apparel', 'Clothing and accessories', TRUE),
  (UUID(), 'Digital Downloads', 'digital', 'Digital products and downloads', TRUE),
  (UUID(), 'Books', 'books', 'Physical and digital books', TRUE);

-- Create default site settings
INSERT INTO site_settings (id, key, value, category)
VALUES
  (UUID(), 'site_name', '"Glory Wave"', 'general'),
  (UUID(), 'site_description', '"Faith-based community platform"', 'general'),
  (UUID(), 'currency', '"USD"', 'commerce'),
  (UUID(), 'timezone', '"America/New_York"', 'general');
`;
  };

  const generateOpenAPISpec = async () => {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Glory Wave API',
        version: '1.0.0',
        description: 'Complete RESTful API for Glory Wave platform',
        contact: { email: 'api@glorywave.com' }
      },
      servers: [
        { url: 'https://api.yourdomain.com/v1', description: 'Production' },
        { url: 'http://localhost:3000/v1', description: 'Development' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token from /auth/login'
          }
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              code: { type: 'string' }
            }
          },
          PaginationMeta: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              limit: { type: 'integer' },
              skip: { type: 'integer' },
              hasMore: { type: 'boolean' }
            }
          }
        }
      },
      paths: {
        '/auth/login': {
          post: {
            summary: 'User authentication',
            tags: ['Authentication'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                      email: { type: 'string', format: 'email', example: 'user@example.com' },
                      password: { type: 'string', minLength: 8, example: 'SecurePass123!' }
                    }
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
                        token: { type: 'string', description: 'JWT access token' },
                        refreshToken: { type: 'string', description: 'Refresh token' },
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            email: { type: 'string' },
                            full_name: { type: 'string' },
                            role: { type: 'string', enum: ['admin', 'user'] }
                          }
                        }
                      }
                    }
                  }
                }
              },
              401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
            }
          }
        },
        '/auth/logout': {
          post: {
            summary: 'User logout',
            tags: ['Authentication'],
            security: [{ bearerAuth: [] }],
            responses: {
              200: { description: 'Logout successful' }
            }
          }
        },
        '/auth/refresh': {
          post: {
            summary: 'Refresh access token',
            tags: ['Authentication'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                      refreshToken: { type: 'string' }
                    }
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'Token refreshed',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        token: { type: 'string' },
                        refreshToken: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/auth/me': {
          get: {
            summary: 'Get current user',
            tags: ['Authentication'],
            security: [{ bearerAuth: [] }],
            responses: {
              200: {
                description: 'Current user data',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        full_name: { type: 'string' },
                        role: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/files/upload': {
          post: {
            summary: 'Upload file',
            tags: ['Files'],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    required: ['file'],
                    properties: {
                      file: { type: 'string', format: 'binary' }
                    }
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'File uploaded',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        file_url: { type: 'string', format: 'uri' },
                        file_id: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    // Generate CRUD endpoints for all entities
    for (const entityName of ALL_ENTITIES) {
      const path = `/entities/${toSnakeCase(entityName)}`;
      const entitySchema = await base44.entities[entityName].schema().catch(() => ({}));

      spec.paths[path] = {
        get: {
          summary: `List ${entityName} records`,
          tags: [entityName],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
            { name: 'skip', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'sort', in: 'query', schema: { type: 'string', example: '-created_date' } },
            { name: 'filter', in: 'query', schema: { type: 'string', example: 'status:active' } }
          ],
          responses: {
            200: {
              description: 'List of records',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { type: 'object' } },
                      meta: { $ref: '#/components/schemas/PaginationMeta' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: `Create ${entityName}`,
          tags: [entityName],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: entitySchema.properties || {},
                  required: entitySchema.required || []
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Created successfully',
              content: { 'application/json': { schema: { type: 'object' } } }
            },
            400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
            403: { description: 'Forbidden' }
          }
        }
      };

      spec.paths[`${path}/{id}`] = {
        get: {
          summary: `Get ${entityName} by ID`,
          tags: [entityName],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Record found', content: { 'application/json': { schema: { type: 'object' } } } },
            404: { description: 'Not found' }
          }
        },
        put: {
          summary: `Update ${entityName}`,
          tags: [entityName],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: entitySchema.properties || {} } } }
          },
          responses: {
            200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object' } } } },
            404: { description: 'Not found' },
            403: { description: 'Forbidden' }
          }
        },
        delete: {
          summary: `Delete ${entityName}`,
          tags: [entityName],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Deleted successfully' },
            404: { description: 'Not found' },
            403: { description: 'Forbidden' }
          }
        }
      };
    }

    return `openapi: 3.0.0\n${JSON.stringify(spec, null, 2)}`;
  };

  const generateBackendReference = async () => {
    const packageJson = {
      name: 'glorywave-backend',
      version: '1.0.0',
      description: 'Glory Wave API Server',
      main: 'server.js',
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js',
        migrate: 'node scripts/migrate.js',
        seed: 'node scripts/seed.js'
      },
      dependencies: {
        express: '^4.18.2',
        mysql2: '^3.6.0',
        pg: '^8.11.0',
        bcrypt: '^5.1.1',
        jsonwebtoken: '^9.0.2',
        cors: '^2.8.5',
        helmet: '^7.1.0',
        'express-rate-limit': '^7.1.0',
        'express-validator': '^7.0.1',
        multer: '^1.4.5-lts.1',
        dotenv: '^16.3.1',
        'node-cron': '^3.0.3',
        nodemailer: '^6.9.7',
        aws-sdk: '^2.1478.0'
      },
      devDependencies: {
        nodemon: '^3.0.1'
      }
    };

    const serverJs = `// server.js - Main application entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const entityRoutes = require('./routes/entities');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/entities', entityRoutes);
app.use('/v1/files', fileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(\`Glory Wave API running on port \${PORT}\`);
});
`;

    const authController = `// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    
    if (!users.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    const refreshToken = jwt.sign(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.me = async (req, res) => {
  res.json(req.user);
};

exports.logout = async (req, res) => {
  // Invalidate token in sessions table if using session management
  res.json({ message: 'Logged out successfully' });
};
`;

    const entityController = `// controllers/entityController.js
const db = require('../db');

exports.list = (tableName) => async (req, res) => {
  try {
    const { limit = 50, skip = 0, sort = '-created_date' } = req.query;
    const user = req.user;
    
    let query = \`SELECT * FROM \${tableName}\`;
    let countQuery = \`SELECT COUNT(*) as total FROM \${tableName}\`;
    const params = [];
    
    // Row-level security: non-admins see only their records
    if (user.role !== 'admin') {
      query += ' WHERE created_by = ?';
      countQuery += ' WHERE created_by = ?';
      params.push(user.email);
    }
    
    // Sorting
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDirection = sort.startsWith('-') ? 'DESC' : 'ASC';
    query += \` ORDER BY \${sortField} \${sortDirection}\`;
    
    // Pagination
    query += \` LIMIT ? OFFSET ?\`;
    params.push(parseInt(limit), parseInt(skip));
    
    const [records] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, params.slice(0, -2));
    
    res.json({
      data: records,
      meta: {
        total: countResult[0].total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + records.length < countResult[0].total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};

exports.create = (tableName) => async (req, res) => {
  try {
    const data = req.body;
    data.created_by = req.user.email;
    data.id = generateUUID();
    
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(data);
    
    await db.query(
      \`INSERT INTO \${tableName} (\${fields.join(', ')}) VALUES (\${placeholders})\`,
      values
    );
    
    const [created] = await db.query(\`SELECT * FROM \${tableName} WHERE id = ?\`, [data.id]);
    res.status(201).json(created[0]);
  } catch (error) {
    res.status(400).json({ error: 'Validation failed' });
  }
};

exports.update = (tableName) => async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const user = req.user;
    
    // Check ownership
    const [existing] = await db.query(\`SELECT * FROM \${tableName} WHERE id = ?\`, [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    if (user.role !== 'admin' && existing[0].created_by !== user.email) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const fields = Object.keys(data).map(k => \`\${k} = ?\`).join(', ');
    const values = [...Object.values(data), id];
    
    await db.query(\`UPDATE \${tableName} SET \${fields} WHERE id = ?\`, values);
    
    const [updated] = await db.query(\`SELECT * FROM \${tableName} WHERE id = ?\`, [id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(400).json({ error: 'Update failed' });
  }
};

exports.delete = (tableName) => async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    const [existing] = await db.query(\`SELECT * FROM \${tableName} WHERE id = ?\`, [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    if (user.role !== 'admin' && existing[0].created_by !== user.email) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await db.query(\`DELETE FROM \${tableName} WHERE id = ?\`, [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
`;

    const dbConfig = `// db/index.js - Database configuration
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

module.exports = pool;
`;

    const authMiddleware = `// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await db.query('SELECT * FROM users WHERE id = ? AND is_active = TRUE', [decoded.sub]);
    
    if (!users.length) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
`;

    return [
      { name: 'backend/package.json', content: JSON.stringify(packageJson, null, 2) },
      { name: 'backend/server.js', content: serverJs },
      { name: 'backend/controllers/authController.js', content: authController },
      { name: 'backend/controllers/entityController.js', content: entityController },
      { name: 'backend/db/index.js', content: dbConfig },
      { name: 'backend/middleware/auth.js', content: authMiddleware }
    ];
  };

  const generateFrontendPackage = async () => {
    const packageJson = {
      name: 'glorywave-frontend',
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^7.2.0',
        '@tanstack/react-query': '^5.84.1',
        'axios': '^1.6.0',
        'lucide-react': '^0.475.0',
        'tailwindcss': '^3.4.0',
        'framer-motion': '^11.16.4',
        'date-fns': '^3.6.0',
        'lodash': '^4.17.21'
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.2.0',
        'vite': '^5.0.0'
      }
    };

    const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
`;

    const envExample = `# Frontend Environment Variables
VITE_API_URL=https://api.yourdomain.com/v1
VITE_APP_NAME=Glory Wave
`;

    const apiClient = `// src/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

// Handle token refresh on 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const entities = {
  ${ALL_ENTITIES.map(e => `${e}: {
    list: (sort, limit) => client.get(\`/entities/${toSnakeCase(e)}\`, { params: { sort, limit } }).then(r => r.data.data),
    filter: (query, sort, limit) => client.get(\`/entities/${toSnakeCase(e)}\`, { params: { filter: JSON.stringify(query), sort, limit } }).then(r => r.data.data),
    create: (data) => client.post(\`/entities/${toSnakeCase(e)}\`, data).then(r => r.data),
    update: (id, data) => client.put(\`/entities/${toSnakeCase(e)}/\${id}\`, data).then(r => r.data),
    delete: (id) => client.delete(\`/entities/${toSnakeCase(e)}/\${id}\`),
    schema: () => Promise.resolve({})
  }`).join(',\n  ')}
};

export const auth = {
  login: (email, password) => client.post('/auth/login', { email, password }).then(r => r.data),
  logout: () => client.post('/auth/logout'),
  me: () => client.get('/auth/me').then(r => r.data),
  isAuthenticated: async () => {
    try {
      await client.get('/auth/me');
      return true;
    } catch {
      return false;
    }
  }
};

export default client;
`;

    return [
      { name: 'frontend/package.json', content: JSON.stringify(packageJson, null, 2) },
      { name: 'frontend/vite.config.js', content: viteConfig },
      { name: 'frontend/.env.example', content: envExample },
      { name: 'frontend/src/api/client.js', content: apiClient }
    ];
  };

  const generateDeploymentGuide = () => {
    return `# Glory Wave - cPanel Deployment Runbook

## Infrastructure Requirements

### Minimum Specifications
- **CPU**: 2 cores
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 20GB minimum, 50GB recommended
- **OS**: Linux (CentOS 7+, Ubuntu 20.04+, or cPanel compatible)
- **Node.js**: v18.0.0 or higher
- **Database**: MySQL 8.0+ OR PostgreSQL 14+
- **SSL**: Required for production

## Pre-Deployment Checklist

- [ ] cPanel account with Node.js support
- [ ] MySQL database created
- [ ] Domain/subdomain configured
- [ ] SSL certificate installed
- [ ] SMTP credentials obtained
- [ ] Backup of any existing data

## Step 1: Database Setup (MySQL)

### 1.1 Create Database
\`\`\`bash
# In cPanel → MySQL® Databases
Database name: glorywave_prod
Database user: glorywave_user
Password: [Generate strong password, 16+ chars]
Privileges: ALL PRIVILEGES
\`\`\`

### 1.2 Import Schema
\`\`\`bash
# Via cPanel → phpMyAdmin
1. Select 'glorywave_prod' database
2. Import → Choose file: db/mysql/schema.sql
3. Execute
4. Verify ${ALL_ENTITIES.length + 1} tables created
\`\`\`

### 1.3 Run Seeds
\`\`\`bash
# Import: db/seeds/initial_data.sql
# This creates admin user with email: admin@glorywave.com
# DEFAULT PASSWORD: Admin@123 (CHANGE IMMEDIATELY AFTER FIRST LOGIN)
\`\`\`

## Step 2: Backend Deployment

### 2.1 Upload Files
\`\`\`bash
# Via SSH or cPanel File Manager
mkdir -p ~/glorywave-backend
cd ~/glorywave-backend

# Upload entire backend/ directory contents:
# - server.js
# - package.json
# - routes/
# - controllers/
# - middleware/
# - db/
\`\`\`

### 2.2 Configure Environment
\`\`\`bash
# Create .env file from template
nano .env

# REQUIRED VARIABLES:
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=glorywave_prod
DB_USER=glorywave_user
DB_PASSWORD=your_database_password_here

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Application
APP_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_smtp_app_password
SMTP_FROM_NAME=Glory Wave

# Storage
STORAGE_TYPE=local
STORAGE_PATH=/home/username/glorywave-storage

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
\`\`\`

### 2.3 Install Dependencies
\`\`\`bash
cd ~/glorywave-backend
npm install --production
\`\`\`

### 2.4 Setup Node.js App in cPanel
\`\`\`
1. Navigate to: cPanel → Setup Node.js App
2. Click "Create Application"

Configuration:
- Node.js version: 18.x
- Application mode: Production
- Application root: glorywave-backend
- Application URL: api.yourdomain.com
- Application startup file: server.js
- Passenger log file: enabled

3. Click "Create"
4. Click "Enter to virtual environment"
5. Run: npm install
6. Click "Start Application"
\`\`\`

### 2.5 Verify Backend
\`\`\`bash
curl https://api.yourdomain.com/health
# Expected: {"status":"healthy","timestamp":"2026-01-18T..."}
\`\`\`

## Step 3: Frontend Deployment

### 3.1 Build Frontend Locally
\`\`\`bash
# On your development machine
cd frontend/
npm install
npm run build
# Creates: dist/ folder
\`\`\`

### 3.2 Configure API Endpoint
\`\`\`bash
# Before building, create frontend/.env.production
echo "VITE_API_URL=https://api.yourdomain.com/v1" > .env.production
npm run build
\`\`\`

### 3.3 Upload to cPanel
\`\`\`bash
# Via cPanel File Manager
1. Navigate to public_html (or subdomain folder)
2. Delete default index.html
3. Upload ALL files from dist/ folder
4. Set permissions:
   - Folders: 755
   - Files: 644
\`\`\`

### 3.4 Configure .htaccess for SPA
\`\`\`apache
# Create: public_html/.htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html
  RewriteRule ^(.*)$ /index.html [L,QSA]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>

# Enable Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Cache Static Assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
\`\`\`

## Step 4: Storage Configuration

### 4.1 Create Storage Directory
\`\`\`bash
mkdir -p ~/glorywave-storage/{uploads,temp,private}
chmod 755 ~/glorywave-storage
chmod 755 ~/glorywave-storage/uploads
chmod 700 ~/glorywave-storage/private
\`\`\`

### 4.2 Configure Web Access
\`\`\`apache
# Create: ~/glorywave-storage/uploads/.htaccess
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
</IfModule>
Options -Indexes
\`\`\`

## Step 5: Background Jobs & Cron

### 5.1 Create Job Runner
\`\`\`javascript
// backend/jobs/runner.js
const cron = require('node-cron');
const db = require('../db');

// Process scheduled tasks every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  const [tasks] = await db.query(
    'SELECT * FROM scheduled_task WHERE is_active = TRUE AND next_run_at <= NOW()'
  );
  
  for (const task of tasks) {
    console.log(\`Executing task: \${task.name}\`);
    // Execute task logic here
  }
});

// Cleanup old sessions daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  await db.query('DELETE FROM sessions WHERE expires_at < NOW()');
});

console.log('Job runner started');
\`\`\`

### 5.2 Setup Cron Jobs in cPanel
\`\`\`
# Navigate to: cPanel → Cron Jobs

# Every 5 minutes - Background tasks
*/5 * * * * cd ~/glorywave-backend && /usr/bin/node jobs/runner.js >> ~/logs/jobs.log 2>&1

# Daily at 2 AM - Database backup
0 2 * * * /usr/bin/mysqldump -u glorywave_user -p'password' glorywave_prod | gzip > ~/backups/db_$(date +\%Y\%m\%d).sql.gz

# Daily at 3 AM - Log rotation
0 3 * * * find ~/glorywave-backend/logs -name "*.log" -mtime +30 -delete

# Weekly on Sunday at 4 AM - Storage cleanup
0 4 * * 0 find ~/glorywave-storage/temp -mtime +7 -delete
\`\`\`

## Step 6: SSL & Domain Configuration

### 6.1 Install SSL Certificate
\`\`\`
1. cPanel → SSL/TLS
2. Install Let's Encrypt certificate for:
   - yourdomain.com
   - api.yourdomain.com
3. Enable "Force HTTPS Redirect"
\`\`\`

### 6.2 Subdomain Setup
\`\`\`
# cPanel → Subdomains
Subdomain: api
Document root: /home/username/glorywave-backend/public
\`\`\`

## Step 7: Testing & Verification

### 7.1 Backend Health Check
\`\`\`bash
curl https://api.yourdomain.com/health
# Expected: {"status":"healthy",...}
\`\`\`

### 7.2 Authentication Test
\`\`\`bash
curl -X POST https://api.yourdomain.com/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@glorywave.com","password":"Admin@123"}'
# Expected: {"token":"...", "user":{...}}
\`\`\`

### 7.3 Frontend Test
- Visit: https://yourdomain.com
- Verify page loads
- Test navigation
- Login with admin credentials
- Check browser console for errors

### 7.4 Database Connectivity
\`\`\`bash
# SSH into server
mysql -u glorywave_user -p glorywave_prod -e "SHOW TABLES;"
# Should list all ${ALL_ENTITIES.length + 1} tables
\`\`\`

## Step 8: Monitoring & Logs

### 8.1 Application Logs
\`\`\`bash
# Backend logs
tail -f ~/glorywave-backend/logs/app.log

# Passenger logs (cPanel)
tail -f ~/glorywave-backend/logs/passenger.log

# MySQL error log
tail -f /var/log/mysql/error.log
\`\`\`

### 8.2 Setup Monitoring
- Configure uptime monitoring (UptimeRobot, Pingdom)
- Monitor disk space: \`df -h\`
- Monitor database size: \`SELECT table_schema, SUM(data_length + index_length) / 1024 / 1024 AS "Size (MB)" FROM information_schema.tables GROUP BY table_schema;\`

## Step 9: Backup Strategy

### 9.1 Automated Database Backups
Already configured in cron (Step 5.2)
Retention: 30 days

### 9.2 Storage Backups
\`\`\`bash
# Weekly backup script
#!/bin/bash
tar -czf ~/backups/storage_$(date +%Y%m%d).tar.gz ~/glorywave-storage
find ~/backups -name "storage_*.tar.gz" -mtime +90 -delete
\`\`\`

### 9.3 Code Backups
- Keep code in Git repository
- Tag releases
- Document configuration changes

## Step 10: Security Hardening

### 10.1 File Permissions
\`\`\`bash
chmod 600 ~/glorywave-backend/.env
chmod 700 ~/glorywave-storage/private
chmod 755 ~/glorywave-storage/uploads
\`\`\`

### 10.2 Database User Privileges
\`\`\`sql
-- Restrict to only needed privileges
REVOKE ALL ON glorywave_prod.* FROM 'glorywave_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON glorywave_prod.* TO 'glorywave_user'@'localhost';
FLUSH PRIVILEGES;
\`\`\`

### 10.3 Firewall Rules
\`\`\`bash
# Allow only necessary ports
# 80 (HTTP), 443 (HTTPS), 22 (SSH), 3306 (MySQL - localhost only)
\`\`\`

## Troubleshooting

### Backend won't start
\`\`\`bash
# Check Node.js version
node --version  # Should be 18+

# Check for syntax errors
cd ~/glorywave-backend
node --check server.js

# Check logs
tail -f ~/glorywave-backend/logs/passenger.log
\`\`\`

### Database connection errors
\`\`\`bash
# Test MySQL connection
mysql -u glorywave_user -p -h localhost glorywave_prod

# Check if user has access
SHOW GRANTS FOR 'glorywave_user'@'localhost';
\`\`\`

### CORS errors
- Verify CORS_ORIGIN in .env matches frontend URL
- Check browser console for exact error
- Ensure API subdomain SSL is valid

### File upload failures
\`\`\`bash
# Check permissions
ls -la ~/glorywave-storage
# Ensure Node process can write to storage directory
\`\`\`

## Performance Optimization

### Enable MySQL Query Cache
\`\`\`sql
SET GLOBAL query_cache_size = 67108864;  -- 64MB
SET GLOBAL query_cache_type = 1;
\`\`\`

### Enable Node.js Clustering
\`\`\`javascript
// server.js - Add at top
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Regular server code here
}
\`\`\`

## Scaling Considerations

### When to Scale
- CPU usage consistently > 70%
- Database connections > 80% of max
- Response times > 500ms
- Storage > 80% capacity

### Vertical Scaling (cPanel)
- Upgrade hosting plan
- Increase RAM allocation
- Add more CPU cores

### Horizontal Scaling (Advanced)
- Load balancer (nginx/HAProxy)
- Multiple app instances
- Database read replicas
- CDN for static assets

## Maintenance Windows

### Recommended Schedule
- **Daily**: Automated backups (2 AM)
- **Weekly**: Security updates (Sunday 4 AM)
- **Monthly**: Dependency updates (1st Sunday)
- **Quarterly**: Full disaster recovery test

## Rollback Procedure

### If deployment fails:
1. Restore database from backup
2. Revert to previous code version
3. Clear application cache
4. Restart services
5. Verify health checks pass

---
**Deployment Time Estimate**: 2-4 hours
**Recommended Team Size**: 1-2 engineers
**Testing Phase**: 24-48 hours monitoring
`;
  };

  const generateVPSGuide = () => {
    return `# Glory Wave - VPS Deployment Guide (Ubuntu 22.04)

## Server Provisioning

### Minimum Specifications
- Ubuntu 22.04 LTS
- 2 CPU cores, 4GB RAM
- 50GB SSD storage
- Root or sudo access

## Step 1: Initial Server Setup

### 1.1 Update System
\`\`\`bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
\`\`\`

### 1.2 Create Application User
\`\`\`bash
sudo adduser glorywave
sudo usermod -aG sudo glorywave
su - glorywave
\`\`\`

### 1.3 Install Node.js 18
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verify 18+
npm --version
\`\`\`

### 1.4 Install MySQL 8.0
\`\`\`bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
# Follow prompts: set root password, remove anonymous users, etc.
\`\`\`

### 1.5 Install Nginx
\`\`\`bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
\`\`\`

### 1.6 Install PM2 (Process Manager)
\`\`\`bash
sudo npm install -g pm2
\`\`\`

## Step 2: Database Setup

### 2.1 Create Database and User
\`\`\`bash
sudo mysql -u root -p

# In MySQL shell:
CREATE DATABASE glorywave_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'glorywave'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON glorywave_prod.* TO 'glorywave'@'localhost';
FLUSH PRIVILEGES;
EXIT;
\`\`\`

### 2.2 Import Schema
\`\`\`bash
mysql -u glorywave -p glorywave_prod < db/mysql/schema.sql
mysql -u glorywave -p glorywave_prod < db/seeds/initial_data.sql
\`\`\`

## Step 3: Backend Deployment

### 3.1 Clone/Upload Code
\`\`\`bash
cd /home/glorywave
mkdir -p apps
cd apps
# Upload backend files or:
# git clone https://your-repo/glorywave-backend.git
cd glorywave-backend
\`\`\`

### 3.2 Install Dependencies
\`\`\`bash
npm install --production
\`\`\`

### 3.3 Configure Environment
\`\`\`bash
nano .env
# Copy from template and fill in values
\`\`\`

### 3.4 Start with PM2
\`\`\`bash
pm2 start server.js --name glorywave-api
pm2 save
pm2 startup
# Follow the command it outputs to enable auto-start on boot
\`\`\`

### 3.5 Verify Running
\`\`\`bash
pm2 status
pm2 logs glorywave-api
curl http://localhost:3000/health
\`\`\`

## Step 4: Nginx Configuration

### 4.1 Configure API Reverse Proxy
\`\`\`nginx
# /etc/nginx/sites-available/api.yourdomain.com
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

### 4.2 Configure Frontend
\`\`\`nginx
# /etc/nginx/sites-available/yourdomain.com
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/glorywave-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
\`\`\`

### 4.3 Enable Sites
\`\`\`bash
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
\`\`\`

### 4.4 Install SSL with Certbot
\`\`\`bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
# Auto-renewal is configured automatically
\`\`\`

## Step 5: Frontend Deployment

### 5.1 Upload Built Files
\`\`\`bash
sudo mkdir -p /var/www/glorywave-frontend
sudo chown glorywave:glorywave /var/www/glorywave-frontend
# Upload dist/ contents to /var/www/glorywave-frontend
\`\`\`

## Step 6: Firewall Configuration

### 6.1 UFW Setup
\`\`\`bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
\`\`\`

## Step 7: Monitoring & Logging

### 7.1 PM2 Monitoring
\`\`\`bash
pm2 monit  # Real-time monitoring
pm2 logs   # View logs
\`\`\`

### 7.2 Setup Log Rotation
\`\`\`bash
sudo nano /etc/logrotate.d/glorywave

/home/glorywave/apps/glorywave-backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 glorywave glorywave
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
\`\`\`

## Step 8: Performance Tuning

### 8.1 MySQL Optimization
\`\`\`sql
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 1G
max_connections = 200
query_cache_size = 64M
query_cache_type = 1
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
\`\`\`

### 8.2 Nginx Optimization
\`\`\`nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;
gzip on;
gzip_types text/plain text/css application/json application/javascript;
client_max_body_size 10M;
\`\`\`

## Maintenance Commands

\`\`\`bash
# Restart application
pm2 restart glorywave-api

# Reload nginx
sudo systemctl reload nginx

# View application logs
pm2 logs glorywave-api --lines 100

# Database backup manual
mysqldump -u glorywave -p glorywave_prod > backup.sql

# Restore database
mysql -u glorywave -p glorywave_prod < backup.sql

# Check disk space
df -h

# Monitor process
htop
\`\`\`

## Scaling for Production

### Load Balancing with Nginx
\`\`\`nginx
upstream backend {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
\`\`\`

### Start Multiple Instances
\`\`\`bash
PORT=3001 pm2 start server.js --name api-1
PORT=3002 pm2 start server.js --name api-2
PORT=3003 pm2 start server.js --name api-3
\`\`\`
`;
  };

  const generateSecuritySpec = () => {
    return `# Glory Wave - Security & RBAC Specification

## Authentication System

### Password Hashing
- **Algorithm**: bcrypt
- **Cost Factor**: 12 (adjustable in code)
- **Salt**: Automatically generated per password

### JWT Token Strategy
**Access Token**:
- Lifetime: 24 hours
- Claims: { sub: user_id, email, role, iat, exp }
- Algorithm: HS256
- Secret: Minimum 32 characters

**Refresh Token**:
- Lifetime: 7 days
- Stored in httpOnly cookie (recommended) or returned in response
- Used to obtain new access tokens

### Token Refresh Flow
\`\`\`
1. Access token expires (401 response)
2. Client sends refresh token to /auth/refresh
3. Server validates refresh token
4. New access token issued
5. Optional: New refresh token issued (rotation)
\`\`\`

## Role-Based Access Control (RBAC)

### Database Schema

\`\`\`sql
CREATE TABLE roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB;

CREATE TABLE permissions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resource (resource),
  INDEX idx_action (action)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
  id VARCHAR(36) PRIMARY KEY,
  role_id VARCHAR(36) NOT NULL,
  permission_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_id)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role_id VARCHAR(36) NOT NULL,
  granted_by VARCHAR(36),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB;
\`\`\`

### Default Roles & Permissions

\`\`\`sql
-- Seed default roles
INSERT INTO roles (id, name, description) VALUES
  (UUID(), 'admin', 'Full system access'),
  (UUID(), 'user', 'Standard user access'),
  (UUID(), 'moderator', 'Content moderation'),
  (UUID(), 'editor', 'Content editing');

-- Seed permissions
INSERT INTO permissions (id, name, resource, action) VALUES
  -- Products
  (UUID(), 'products:create', 'products', 'create'),
  (UUID(), 'products:read', 'products', 'read'),
  (UUID(), 'products:update', 'products', 'update'),
  (UUID(), 'products:delete', 'products', 'delete'),
  -- Orders
  (UUID(), 'orders:read', 'orders', 'read'),
  (UUID(), 'orders:update', 'orders', 'update'),
  (UUID(), 'orders:manage_all', 'orders', 'manage'),
  -- Users
  (UUID(), 'users:read', 'users', 'read'),
  (UUID(), 'users:update', 'users', 'update'),
  (UUID(), 'users:delete', 'users', 'delete'),
  -- Content
  (UUID(), 'content:create', 'content', 'create'),
  (UUID(), 'content:moderate', 'content', 'moderate'),
  (UUID(), 'content:publish', 'content', 'publish'),
  -- Settings
  (UUID(), 'settings:update', 'settings', 'update');
\`\`\`

### Permission Check Implementation

\`\`\`javascript
// middleware/permissions.js
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    const user = req.user;
    
    // Admin bypass
    if (user.role === 'admin') {
      return next();
    }
    
    // Query permission
    const [hasPermission] = await db.query(\`
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ? AND p.resource = ? AND p.action = ?
      LIMIT 1
    \`, [user.id, resource, action]);
    
    if (!hasPermission.length) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    next();
  };
};

// Usage in routes:
router.post('/products', 
  requireAuth, 
  checkPermission('products', 'create'), 
  productController.create
);
\`\`\`

## Row-Level Security

### Implementation Pattern
\`\`\`javascript
// Apply to all queries
const applyRowSecurity = (query, user, tableName) => {
  // Admins see everything
  if (user.role === 'admin') return query;
  
  // Users see only their own records
  return query + ' AND created_by = ?';
};

// Example usage
let query = 'SELECT * FROM orders WHERE status = ?';
const params = ['completed'];

if (user.role !== 'admin') {
  query += ' AND created_by = ?';
  params.push(user.email);
}

const [results] = await db.query(query, params);
\`\`\`

## Rate Limiting

### Configuration
\`\`\`javascript
const rateLimit = require('express-rate-limit');

// Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

// Apply
app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
\`\`\`

### Rate Limit Storage
\`\`\`sql
CREATE TABLE rate_limits (
  id VARCHAR(36) PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  count INT DEFAULT 1,
  reset_at TIMESTAMP NOT NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_identifier (identifier),
  INDEX idx_reset (reset_at)
) ENGINE=InnoDB;
\`\`\`

## Audit Logging

### Audit Log Schema
\`\`\`sql
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(36),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_method VARCHAR(10),
  request_path VARCHAR(255),
  response_status INT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource),
  INDEX idx_created_date (created_date)
) ENGINE=InnoDB;
\`\`\`

### Audit Middleware
\`\`\`javascript
const auditLog = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the action
    db.query(\`
      INSERT INTO audit_logs 
      (id, user_id, user_email, action, resource, ip_address, user_agent, request_method, request_path, response_status)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`, [
      req.user?.id,
      req.user?.email,
      req.method,
      req.path.split('/')[2] || 'unknown',
      req.ip,
      req.get('user-agent'),
      req.method,
      req.path,
      res.statusCode
    ]);
    
    originalSend.call(this, data);
  };
  
  next();
};
\`\`\`

## Input Validation & Sanitization

### Using express-validator
\`\`\`javascript
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateProduct = [
  body('name').trim().isLength({ min: 1, max: 255 }).escape(),
  body('price').isFloat({ min: 0 }),
  body('description').optional().trim().escape(),
  body('category_id').isUUID(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.post('/products', validateProduct, productController.create);
\`\`\`

## SQL Injection Prevention

**ALWAYS use parameterized queries:**
\`\`\`javascript
// ✅ SAFE
const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

// ❌ UNSAFE - NEVER DO THIS
const results = await db.query(\`SELECT * FROM users WHERE email = '\${email}'\`);
\`\`\`

## XSS Prevention

### Content Security Policy
\`\`\`javascript
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.yourdomain.com"]
  }
}));
\`\`\`

### Output Escaping
- React automatically escapes JSX content
- For dangerouslySetInnerHTML, use DOMPurify library

## CSRF Protection

\`\`\`javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply to state-changing endpoints
app.post('/api/*', csrfProtection, ...);

// Send token to client
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
\`\`\`

## Data Retention & GDPR Compliance

### User Data Export
\`\`\`javascript
router.get('/users/me/export', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  const userData = {
    profile: await getUser(userId),
    orders: await getUserOrders(userId),
    reviews: await getUserReviews(userId),
    preferences: await getUserPreferences(userId)
  };
  
  res.json(userData);
});
\`\`\`

### Data Deletion
\`\`\`javascript
router.delete('/users/me', requireAuth, async (req, res) => {
  const userId = req.user.id;
  
  // Mark for deletion (soft delete)
  await db.query('UPDATE users SET deleted_at = NOW(), is_active = FALSE WHERE id = ?', [userId]);
  
  // Schedule permanent deletion after 30 days
  await db.query(\`
    INSERT INTO scheduled_task (id, task_type, parameters, schedule)
    VALUES (UUID(), 'permanent_delete_user', ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
  \`, [JSON.stringify({ userId })]);
  
  res.status(204).send();
});
\`\`\`

### Retention Policies
| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| Orders | 7 years | Legal/Financial |
| Audit Logs | 5 years | Security/Compliance |
| User Sessions | 30 days | Performance |
| Webhook Logs | 90 days | Debugging |
| Error Logs | 180 days | Analysis |
| Deleted User Data | 30 days | GDPR grace period |

## Security Headers

\`\`\`javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
\`\`\`

## Secrets Management

### Environment Variables (Never in code)
\`\`\`bash
# .env file (permissions: 600)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=secure_password_here
\`\`\`

### Encryption at Rest
- Database: Enable MySQL encryption
- Files: Encrypt sensitive files before storage
- Backups: Encrypt backup files

## Security Checklist

### Before Go-Live
- [ ] All default passwords changed
- [ ] JWT secrets are strong and unique
- [ ] SSL certificates installed and valid
- [ ] Firewall configured (only 80, 443, 22)
- [ ] Database user has minimal privileges
- [ ] .env file permissions set to 600
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Audit logging enabled
- [ ] Error messages don't leak sensitive info
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF tokens implemented
- [ ] Security headers configured
- [ ] Dependency vulnerability scan passed
- [ ] Backup and restoration tested

### Ongoing Maintenance
- [ ] Weekly security updates
- [ ] Monthly dependency updates
- [ ] Quarterly penetration testing
- [ ] Review audit logs weekly
- [ ] Monitor failed login attempts
- [ ] Rotate JWT secrets every 90 days
- [ ] Review and revoke old API keys

## Incident Response

### Suspected Breach
1. Immediately rotate all secrets
2. Force logout all users
3. Review audit logs for unauthorized access
4. Check for data exfiltration
5. Notify affected users if data compromised
6. Document incident and response

### Password Reset Flow
\`\`\`javascript
1. User requests reset → Generate token (valid 1 hour)
2. Send email with reset link
3. User clicks link → Verify token
4. User sets new password
5. Invalidate all existing sessions
6. Send confirmation email
\`\`\`
`;
  };

  const generateStorageSpec = () => {
    return `# Glory Wave - File Storage & Media Migration Guide

## Storage Architecture

### Files Stored by Application

1. **User Profile Images**
   - Entity: User (\`profile_image\` field)
   - Format: JPEG, PNG
   - Max size: 5MB
   - Location: \`/uploads/profiles/\`

2. **Product Images**
   - Entity: Product (\`images\` array field)
   - Format: JPEG, PNG, WebP
   - Max size: 10MB per image
   - Location: \`/uploads/products/\`

3. **Digital Products**
   - Entity: DigitalProductEnhanced (\`file_url\` field)
   - Format: PDF, ZIP, MP3, MP4
   - Max size: 500MB
   - Location: \`/uploads/digital/\`
   - Access: Private, requires authentication

4. **Video Content**
   - Entity: Video (\`video_url\` field)
   - Format: MP4, WebM
   - Max size: 2GB
   - Location: \`/uploads/videos/\`

5. **Blog/Content Images**
   - Entity: BlogPost (embedded in content)
   - Format: JPEG, PNG, GIF
   - Max size: 5MB
   - Location: \`/uploads/content/\`

## Storage Options

### Option A: Local Filesystem (cPanel/VPS)

#### Directory Structure
\`\`\`
/home/glorywave/glorywave-storage/
├── uploads/
│   ├── profiles/
│   ├── products/
│   ├── digital/
│   ├── videos/
│   └── content/
├── temp/
└── private/
    └── digital/
\`\`\`

#### Setup Commands
\`\`\`bash
mkdir -p ~/glorywave-storage/{uploads/{profiles,products,digital,videos,content},temp,private/digital}
chmod 755 ~/glorywave-storage
chmod 755 ~/glorywave-storage/uploads
chmod 700 ~/glorywave-storage/private
chmod 1777 ~/glorywave-storage/temp
\`\`\`

#### Backend Configuration
\`\`\`javascript
// config/storage.js
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const type = req.body.type || 'uploads';
    const dest = path.join(process.env.STORAGE_PATH, type);
    await fs.mkdir(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|zip|mp3|mp4|webm/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

module.exports = upload;
\`\`\`

#### File URL Generation
\`\`\`javascript
// Returns public URL for uploaded file
const getFileUrl = (filePath) => {
  return \`\${process.env.APP_URL}/storage/\${path.relative(process.env.STORAGE_PATH, filePath)}\`;
};
\`\`\`

#### Nginx Configuration for File Serving
\`\`\`nginx
# Serve public uploads
location /storage/uploads {
    alias /home/glorywave/glorywave-storage/uploads;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Private files require authentication
location /storage/private {
    internal;
    alias /home/glorywave/glorywave-storage/private;
}
\`\`\`

### Option B: S3-Compatible Storage (Recommended for Scale)

#### Supported Providers
- Amazon S3
- DigitalOcean Spaces
- Wasabi
- Backblaze B2
- MinIO (self-hosted)

#### Configuration
\`\`\`javascript
// config/s3.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  region: process.env.S3_REGION,
  s3ForcePathStyle: true
});

exports.uploadFile = async (file, key) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };
  
  const result = await s3.upload(params).promise();
  return result.Location;
};

exports.uploadPrivateFile = async (file, key) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: \`private/\${key}\`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private'
  };
  
  const result = await s3.upload(params).promise();
  return result.Key;
};

exports.getSignedUrl = (key, expiresIn = 3600) => {
  return s3.getSignedUrl('getObject', {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: expiresIn
  });
};
\`\`\`

## Migration from Platform to Self-Host

### Step 1: Inventory Current Files
\`\`\`bash
# Query database for all file references
SELECT 'User' as entity, id, profile_image as file_url FROM users WHERE profile_image IS NOT NULL
UNION ALL
SELECT 'Product', id, JSON_EXTRACT(images, '$[0]') FROM product WHERE images IS NOT NULL
UNION ALL
SELECT 'DigitalProduct', id, file_url FROM digital_product_enhanced WHERE file_url IS NOT NULL;
\`\`\`

### Step 2: Download Files
\`\`\`bash
# Create download script
#!/bin/bash
while IFS=',' read -r entity id url; do
  mkdir -p "./migration/$entity"
  wget -O "./migration/$entity/$id.file" "$url"
done < file_inventory.csv
\`\`\`

### Step 3: Upload to New Storage
\`\`\`bash
# For local storage
cp -r ./migration/* ~/glorywave-storage/uploads/

# For S3
aws s3 sync ./migration/ s3://your-bucket/uploads/ --acl public-read
\`\`\`

### Step 4: Update Database URLs
\`\`\`sql
-- Update User profile images
UPDATE users 
SET profile_image = REPLACE(profile_image, 'old-cdn-url.com', 'yourdomain.com/storage/uploads');

-- Update Product images (JSON field)
UPDATE product 
SET images = JSON_REPLACE(images, '$[0]', REPLACE(JSON_EXTRACT(images, '$[0]'), 'old-cdn-url.com', 'yourdomain.com/storage/uploads'));

-- Update Digital products
UPDATE digital_product_enhanced
SET file_url = REPLACE(file_url, 'old-cdn-url.com', 'yourdomain.com/storage/uploads');
\`\`\`

## File Upload API Endpoint

### Implementation
\`\`\`javascript
// routes/files.js
const express = require('express');
const router = express.Router();
const upload = require('../config/storage');
const { requireAuth } = require('../middleware/auth');

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = \`\${process.env.APP_URL}/storage/uploads/\${req.file.filename}\`;
    
    res.json({
      file_url: fileUrl,
      file_id: req.file.filename,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
\`\`\`

## Storage Quotas & Cleanup

### Quota Tracking
\`\`\`sql
CREATE TABLE storage_quotas (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  used_bytes BIGINT DEFAULT 0,
  quota_bytes BIGINT DEFAULT 10737418240, -- 10GB default
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
) ENGINE=InnoDB;
\`\`\`

### Cleanup Old Temp Files
\`\`\`bash
# Cron job
0 4 * * * find ~/glorywave-storage/temp -type f -mtime +1 -delete
\`\`\`

## Backup Strategy

### Database Includes File References
- Regular DB backups include all file URLs
- Restoration requires both DB + storage files

### Storage Backup
\`\`\`bash
# Daily incremental backup
rsync -av --delete ~/glorywave-storage/ ~/backups/storage-latest/

# Weekly full backup to remote
tar -czf storage-$(date +%Y%m%d).tar.gz ~/glorywave-storage
scp storage-*.tar.gz backup-server:/backups/glorywave/
\`\`\`

## CDN Integration (Optional)

### CloudFlare Setup
1. Point domain to your server IP
2. Enable proxy (orange cloud)
3. Page Rules:
   - Cache everything on \`/storage/uploads/*\`
   - Edge Cache TTL: 1 year
4. Purge cache when files updated

### Custom CDN
\`\`\`nginx
# Serve static files with long cache
location /storage/uploads {
    alias /home/glorywave/glorywave-storage/uploads;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header Access-Control-Allow-Origin "*";
}
\`\`\`
`;
  };

  const generateArchitectureDiagram = () => {
    return `# Glory Wave - System Architecture

## High-Level Architecture Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   React SPA (Vite)                                   │   │
│  │   - Pages: ${ALL_ENTITIES.length}+ views                                    │   │
│  │   - State: React Query + Local Storage              │   │
│  │   - Routing: React Router                           │   │
│  │   - UI: Tailwind CSS + Shadcn/ui                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓ HTTPS/REST                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     LOAD BALANCER / NGINX                    │
│  - SSL Termination                                           │
│  - Rate Limiting                                             │
│  - Reverse Proxy                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND API (Node.js/Express)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │   Entities   │  │    Files     │      │
│  │  - Login     │  │  - CRUD Ops  │  │  - Upload    │      │
│  │  - JWT       │  │  - Filter    │  │  - Download  │      │
│  │  - Refresh   │  │  - Search    │  │  - Signed URL│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                   ↓             │
│  ┌─────────────────────────────────────────────────┐       │
│  │            Middleware Layer                      │       │
│  │  - Authentication (JWT)                          │       │
│  │  - Authorization (RBAC)                          │       │
│  │  - Validation (express-validator)                │       │
│  │  - Audit Logging                                 │       │
│  │  - Error Handling                                │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (MySQL 8.0)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Core Tables (${ALL_ENTITIES.length + 1} tables)                           │  │
│  │  - users, products, orders, cart_items, etc.        │  │
│  │  - All with: id, created_date, updated_date         │  │
│  │  - Indexes on foreign keys and search fields        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RBAC Tables                                         │  │
│  │  - roles, permissions, role_permissions             │  │
│  │  - user_roles                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Security & Audit                                    │  │
│  │  - audit_logs, rate_limits, sessions                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                             │
│  ┌──────────────┐              ┌──────────────┐            │
│  │    Local FS  │      OR      │  S3-Compatible│           │
│  │  ~/storage/  │              │  (AWS/Spaces) │           │
│  └──────────────┘              └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKGROUND JOBS                            │
│  - Node-cron (in-process) OR Queue System (Bull/BullMQ)     │
│  - Scheduled tasks, email sending, data processing          │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## Data Flow Examples

### User Registration & Login
\`\`\`
1. User submits email + password → Frontend
2. Frontend POST /v1/auth/login → Backend API
3. Backend validates → MySQL users table
4. Password verified with bcrypt
5. JWT token generated and returned
6. Frontend stores token → localStorage
7. Subsequent requests include: Authorization: Bearer <token>
\`\`\`

### Product Browse & Purchase
\`\`\`
1. User visits /store → Frontend loads
2. Frontend GET /v1/entities/product?limit=50&sort=-created_date
3. Backend queries MySQL → Returns products
4. User adds to cart → POST /v1/entities/cart_item
5. User checks out → POST /v1/entities/order
6. Backend creates order → Triggers email notification
7. Background job processes payment webhook
\`\`\`

### File Upload Flow
\`\`\`
1. User selects file → Frontend
2. Frontend POST /v1/files/upload (multipart/form-data)
3. Backend receives file → Validates size/type
4. Multer stores file → Local FS or S3
5. Backend returns file_url
6. Frontend updates entity with file_url → PUT /v1/entities/{entity}/{id}
\`\`\`

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Router**: React Router v7
- **State**: React Query (TanStack Query)
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Icons**: Lucide React
- **Animation**: Framer Motion

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database Driver**: mysql2 (pooled connections)
- **Authentication**: JWT (jsonwebtoken)
- **Password**: bcrypt (cost factor 12)
- **Validation**: express-validator
- **File Upload**: multer
- **Email**: nodemailer
- **Jobs**: node-cron
- **Security**: helmet, cors, express-rate-limit

### Database
- **Primary**: MySQL 8.0 (InnoDB engine)
- **Alternative**: PostgreSQL 14+
- **Character Set**: utf8mb4
- **Collation**: utf8mb4_unicode_ci

### Infrastructure
- **Web Server**: Nginx (reverse proxy + static files)
- **Process Manager**: PM2
- **SSL**: Let's Encrypt (Certbot)
- **Monitoring**: PM2 + custom health checks
- **Backups**: mysqldump + rsync

## Port Allocation

| Service | Port | Purpose |
|---------|------|---------|
| Frontend (dev) | 5173 | Vite dev server |
| Backend API | 3000 | Main API server |
| MySQL | 3306 | Database (localhost only) |
| Nginx | 80 | HTTP (redirects to 443) |
| Nginx | 443 | HTTPS |
| SSH | 22 | Server access |

## Environment Variables Required

### Backend (.env)
\`\`\`
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=glorywave_prod
DB_USER=glorywave_user
DB_PASSWORD=***
JWT_SECRET=***
JWT_REFRESH_SECRET=***
APP_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=***
SMTP_PASSWORD=***
STORAGE_TYPE=local|s3
STORAGE_PATH=/home/glorywave/glorywave-storage
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
\`\`\`

### Frontend (.env.production)
\`\`\`
VITE_API_URL=https://api.yourdomain.com/v1
VITE_APP_NAME=Glory Wave
\`\`\`

## Database Engine Declaration

**PRIMARY: MySQL 8.0+**
- InnoDB storage engine
- utf8mb4 character set
- ACID compliance
- Foreign key constraints
- Full-text search support

**ALTERNATIVE: PostgreSQL 14+**
- UUID primary keys (gen_random_uuid())
- JSONB for object/array fields
- Full-text search with tsvector
- Row-level security (RLS) optional

**Migration Between Engines**:
- Use provided schema files for target engine
- Data export/import via JSON
- Field mapping automated in migration scripts

## Scalability Path

### Phase 1: Single Server (0-10K users)
- One VPS running everything
- MySQL on same server
- Local file storage

### Phase 2: Separated Services (10K-100K users)
- Frontend: CDN (CloudFlare)
- Backend: Dedicated app server
- Database: Dedicated MySQL server
- Storage: S3-compatible

### Phase 3: Distributed (100K+ users)
- Frontend: Multi-region CDN
- Backend: Load-balanced API servers (3+)
- Database: Primary + Read replicas
- Cache: Redis cluster
- Queue: RabbitMQ/Redis
- Storage: Multi-region S3

## Dependencies

### Backend Runtime Dependencies
- express: Web framework
- mysql2: MySQL driver with promises
- bcrypt: Password hashing
- jsonwebtoken: JWT implementation
- cors: CORS middleware
- helmet: Security headers
- express-rate-limit: Rate limiting
- express-validator: Input validation
- multer: File upload handling
- dotenv: Environment config
- node-cron: Scheduled jobs
- nodemailer: Email sending
- aws-sdk: S3 storage (optional)

### Frontend Build Dependencies
- react, react-dom: UI framework
- react-router-dom: Routing
- @tanstack/react-query: Data fetching
- axios: HTTP client
- tailwindcss: Styling
- vite: Build tool
- lucide-react: Icons
- framer-motion: Animations

All dependencies are open-source and self-hostable.
`;
  };

  const generateReadme = () => {
    return `# Glory Wave - Self-Host Deployment Package

**Generated**: ${new Date().toISOString()}

This package contains everything needed to deploy Glory Wave on your own infrastructure, independent of any managed platform.

## Package Contents

\`\`\`
glorywave-selfhost/
├── README.md                          (this file)
├── MANIFEST.md                        (complete file listing)
├── ARCHITECTURE.md                    (system architecture)
├── db/
│   ├── mysql/
│   │   └── schema.sql                 (MySQL 8.0 DDL)
│   ├── postgres/
│   │   └── schema.sql                 (PostgreSQL 14+ DDL)
│   ├── migrations/
│   │   └── 001_create_core_tables.sql
│   └── seeds/
│       └── initial_data.sql           (admin user + defaults)
├── api/
│   └── openapi.yaml                   (Complete API specification)
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── controllers/
│   ├── middleware/
│   └── db/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── src/
│       └── api/client.js
├── deploy/
│   ├── cpanel-runbook.md              (cPanel deployment guide)
│   └── vps-runbook.md                 (VPS deployment guide)
├── security/
│   └── rbac-specification.md          (RBAC implementation)
└── storage/
    └── media-migration.md             (File storage guide)
\`\`\`

## Quick Start

### Option 1: cPanel Deployment
1. Read: \`deploy/cpanel-runbook.md\`
2. Import: \`db/mysql/schema.sql\` via phpMyAdmin
3. Upload backend code, configure .env
4. Build frontend: \`npm run build\`
5. Upload dist/ to public_html
6. Configure cron jobs
7. Test: https://yourdomain.com

### Option 2: VPS Deployment (Ubuntu)
1. Read: \`deploy/vps-runbook.md\`
2. Install: Node.js, MySQL, Nginx
3. Import database schema
4. Deploy backend with PM2
5. Configure Nginx reverse proxy
6. Install SSL with Certbot
7. Deploy frontend build
8. Test all endpoints

## Database Engine

**Primary**: MySQL 8.0+ (recommended)
**Alternative**: PostgreSQL 14+

Use the schema in \`db/mysql/\` or \`db/postgres/\` depending on your choice.

## Default Credentials

⚠️ **SECURITY WARNING**: Change immediately after first login!

**Admin Account**:
- Email: \`admin@glorywave.com\`
- Password: \`Admin@123\`

## Required Environment Variables

See \`frontend/.env.example\` and \`backend/.env.example\` for complete lists.

**Critical**:
- JWT_SECRET (min 32 chars)
- DB_PASSWORD
- SMTP credentials

## API Endpoints

Complete API documentation: \`api/openapi.yaml\`

**Base URL**: https://api.yourdomain.com/v1

**Key Endpoints**:
- POST /auth/login
- GET /auth/me
- GET /entities/{entity}
- POST /entities/{entity}
- PUT /entities/{entity}/{id}
- DELETE /entities/{entity}/{id}
- POST /files/upload

## Storage Requirements

### Minimum
- Database: 1GB
- Application code: 500MB
- File storage: 10GB

### Recommended
- Database: 20GB (with growth)
- File storage: 100GB+
- Temp/cache: 5GB

## Support & Troubleshooting

1. Check deployment runbooks for common issues
2. Review application logs
3. Verify all environment variables set
4. Test database connectivity
5. Check firewall/security groups
6. Verify SSL certificates valid

## License

Proprietary - Glory Wave Application
This deployment package is for self-hosting your own instance.

## Version

Application Version: 1.0.0
Export Package Version: 1.0.0
Export Date: ${new Date().toISOString()}
`;
  };

  const generateManifest = (files) => {
    return `# Glory Wave - Self-Host Package Manifest

**Total Files**: ${files.length}
**Generated**: ${new Date().toISOString()}

## File Listing

${files.map(f => `- \`${f.name}\` (${(f.content.length / 1024).toFixed(2)} KB)`).join('\n')}

## File Descriptions

### Database Files
- **db/mysql/schema.sql**: Complete MySQL 8.0 schema with all ${ALL_ENTITIES.length + 1} tables
- **db/postgres/schema.sql**: PostgreSQL 14+ equivalent schema
- **db/migrations/**: Idempotent migration scripts
- **db/seeds/initial_data.sql**: Default admin user and initial data

### API Documentation
- **api/openapi.yaml**: OpenAPI 3.0 specification with all endpoints, request/response schemas, authentication, and error codes

### Backend Reference Implementation
- **backend/package.json**: All required npm dependencies
- **backend/server.js**: Express application entry point
- **backend/controllers/**: Auth and entity CRUD controllers
- **backend/middleware/auth.js**: JWT authentication middleware
- **backend/db/index.js**: MySQL connection pool configuration

### Frontend Package
- **frontend/package.json**: React app dependencies
- **frontend/vite.config.js**: Vite build configuration
- **frontend/.env.example**: Environment variables template
- **frontend/src/api/client.js**: API client with entity methods

### Deployment Guides
- **deploy/cpanel-runbook.md**: Complete cPanel deployment steps
- **deploy/vps-runbook.md**: Ubuntu VPS deployment with nginx
- **security/rbac-specification.md**: RBAC implementation and security hardening
- **storage/media-migration.md**: File storage and migration guide

### Documentation
- **docs/ARCHITECTURE.md**: System architecture diagram and component descriptions
- **README.md**: Quick start guide
- **MANIFEST.md**: This file

## Checksums

${files.slice(0, 10).map(f => `- ${f.name}: ${hashString(f.content)}`).join('\n')}
(First 10 files shown)

## Installation Steps

1. Extract all files maintaining directory structure
2. Choose database engine (MySQL recommended)
3. Follow deployment runbook for your hosting type
4. Import database schema
5. Configure environment variables
6. Deploy backend and frontend
7. Test all functionality
8. Change default admin password

## Notes

- All files are text-based for easy review
- No binary dependencies included (install via npm)
- Secrets are in .example files (not actual secrets)
- Default admin password MUST be changed
- Review security specification before production deployment
`;
  };

  const toSnakeCase = (str) => {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  };

  const getMySQLType = (def) => {
    if (def.type === 'string') {
      if (def.format === 'date') return 'DATE';
      if (def.format === 'date-time') return 'TIMESTAMP';
      if (def.enum) return `ENUM(${def.enum.map(v => `'${v}'`).join(', ')})`;
      if (def.format === 'binary') return 'MEDIUMTEXT';
      return def.maxLength > 255 ? 'TEXT' : 'VARCHAR(255)';
    }
    if (def.type === 'number') return 'DECIMAL(12, 2)';
    if (def.type === 'integer') return 'INT';
    if (def.type === 'boolean') return 'BOOLEAN';
    if (def.type === 'object') return 'JSON';
    if (def.type === 'array') return 'JSON';
    return 'TEXT';
  };

  const getPostgresType = (def) => {
    if (def.type === 'string') {
      if (def.format === 'date') return 'DATE';
      if (def.format === 'date-time') return 'TIMESTAMP';
      if (def.enum) return `VARCHAR(50) CHECK (${toSnakeCase(Object.keys(def)[0])} IN (${def.enum.map(v => `'${v}'`).join(', ')}))`;
      return 'TEXT';
    }
    if (def.type === 'number') return 'NUMERIC(12, 2)';
    if (def.type === 'integer') return 'INTEGER';
    if (def.type === 'boolean') return 'BOOLEAN';
    if (def.type === 'object') return 'JSONB';
    if (def.type === 'array') return 'JSONB';
    return 'TEXT';
  };

  const getDefaultValue = (def) => {
    if (def.default === undefined) return '';
    if (typeof def.default === 'string') return ` DEFAULT '${def.default}'`;
    if (typeof def.default === 'number') return ` DEFAULT ${def.default}`;
    if (typeof def.default === 'boolean') return ` DEFAULT ${def.default ? 'TRUE' : 'FALSE'}`;
    return '';
  };

  const getPostgresDefault = (def) => {
    if (def.default === undefined) return '';
    if (typeof def.default === 'string') return ` DEFAULT '${def.default}'`;
    if (typeof def.default === 'number') return ` DEFAULT ${def.default}`;
    if (typeof def.default === 'boolean') return ` DEFAULT ${def.default}`;
    return '';
  };

  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
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

      <Card className="bg-gradient-to-br from-green-950/30 to-emerald-950/30 border-green-500/40 hover:border-green-500/60 transition-all">
        <CardHeader className="border-b border-green-500/20">
          <CardTitle className="text-white flex items-center gap-2 text-xl">
            <Package className="w-7 h-7 text-green-400" />
            Complete Self-Host Package
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4 mb-6">
            <p className="text-slate-300 text-lg font-semibold">
              Export entire deployment package with:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">MySQL & PostgreSQL schemas</span>
              </div>
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">OpenAPI 3.0 specification</span>
              </div>
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Backend reference code</span>
              </div>
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Frontend API client</span>
              </div>
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">cPanel + VPS runbooks</span>
              </div>
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Security & RBAC specs</span>
              </div>
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Storage migration guide</span>
              </div>
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Environment templates</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={exportCompletePackage}
            disabled={exporting}
            size="lg"
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 font-black text-lg py-6"
          >
            <Download className="w-5 h-5 mr-3" />
            {exporting ? 'Generating Package...' : 'Export Complete Self-Host Package'}
          </Button>
          
          {generatedFiles.length > 0 && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300 font-bold mb-2">✓ Generated {generatedFiles.length} files</p>
              <p className="text-slate-300 text-sm">All files have been downloaded to your Downloads folder. Extract and follow README.md to deploy.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-500/30">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-white font-black text-lg mb-3">Important Notes</h3>
              <div className="space-y-2 text-slate-300 text-sm">
                <p>• <strong>Default Admin Password</strong>: admin@glorywave.com / Admin@123 (CHANGE IMMEDIATELY)</p>
                <p>• Review all exported files before deploying to production</p>
                <p>• Update all placeholder values in .env templates</p>
                <p>• Test the migration in a staging environment first</p>
                <p>• Minimum requirements: Node 18+, MySQL 8.0+, 2GB RAM, 20GB storage</p>
                <p>• Keep backups of all data before migration</p>
                <p>• Monitor logs closely for first 24-48 hours after deployment</p>
                <p>• The package includes {ALL_ENTITIES.length} entity tables + auth/rbac tables</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}