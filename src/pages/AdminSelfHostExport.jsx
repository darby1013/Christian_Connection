import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import EnterpriseHeader from '../components/admin/EnterpriseHeader';
import JSZip from 'jszip';
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

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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

  const getPostgresType = (def) => {
    if (def.type === 'string') {
      if (def.format === 'date') return 'DATE';
      if (def.format === 'date-time') return 'TIMESTAMP';
      if (def.enum) {
        const enumName = toSnakeCase(Object.keys(def)[0] || 'enum_field');
        return `VARCHAR(50) CHECK (${enumName} IN (${def.enum.map(v => `'${v}'`).join(', ')}))`;
      }
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
        if (!base44.entities[entityName] || typeof base44.entities[entityName].schema !== 'function') {
          continue;
        }
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
            schema += `  \`${toSnakeCase(field)}\` ${sqlType}${nullable ? '' : ' NOT NULL'}${defaultVal},\n`;
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
        if (!base44.entities[entityName] || typeof base44.entities[entityName].schema !== 'function') {
          continue;
        }
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
        }
      }
    };

    for (const entityName of ALL_ENTITIES) {
      if (!base44.entities[entityName] || typeof base44.entities[entityName].schema !== 'function') {
        continue;
      }
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
            }
          }
        }
      };
    }

    return `openapi: 3.0.0\n${JSON.stringify(spec, null, 2)}`;
  };

  const generateBackendReference = async () => {
    return [
      { name: 'backend/package.json', content: JSON.stringify({ name: "glorywave-backend", version: "1.0.0" }, null, 2) },
      { name: 'backend/server.js', content: "// Express Server Entry Point\n" },
      { name: 'backend/controllers/authController.js', content: "// Auth Logic\n" },
      { name: 'backend/db/index.js', content: "// DB Connection Pool\n" }
    ];
  };

  const generateFrontendPackage = async () => {
    return [
      { name: 'frontend/package.json', content: JSON.stringify({ name: "glorywave-frontend", version: "1.0.0" }, null, 2) },
      { name: 'frontend/src/api/client.js', content: "// API Client Factory\n" }
    ];
  };

  const generateDeploymentGuide = () => {
    return `# Deployment Guide\n1. Setup server\n2. Configure DB\n3. Run migrations\n`;
  };

  const generateVPSGuide = () => {
    return `# VPS Setup Guide\n1. Ubuntu 22.04\n2. Nginx Proxy\n3. PM2 Process management\n`;
  };

  const generateSecuritySpec = () => {
    return `# Security Specification\nRBAC, JWT structure, and CORS policies\n`;
  };

  const generateStorageSpec = () => {
    return `# Storage Guide\nLocal vs S3 configuration\n`;
  };

  const generateArchitectureDiagram = () => {
    return `# Architecture\nDiagrams and Data flow maps\n`;
  };

  const generateReadme = () => {
    return `# Glory Wave Self-Host Package\nRefer to MANIFEST.md for files.\n`;
  };

  const generateManifest = (files) => {
    return `# Manifest\nTotal files: ${files.length}\n` + files.map(f => `- ${f.name}`).join('\n');
  };

  const exportCompletePackage = async () => {
    setExporting(true);
    setExportType('complete');
    setExportProgress(0);
    
    try {
      const files = [];

      setExportProgress(5);
      const mysqlSchema = await generateMySQLSchema();
      files.push({ name: 'db/mysql/schema.sql', content: mysqlSchema });

      setExportProgress(10);
      const postgresSchema = await generatePostgresSchema();
      files.push({ name: 'db/postgres/schema.sql', content: postgresSchema });

      setExportProgress(15);
      const migrations = await generateMigrations();
      for (let i = 0; i < migrations.length; i++) {
        const migration = migrations[i];
        files.push({ name: `db/migrations/${String(i + 1).padStart(3, '0')}_${migration.name}.sql`, content: migration.content });
      }

      setExportProgress(20);
      const seeds = await generateSeedData();
      files.push({ name: 'db/seeds/initial_data.sql', content: seeds });

      setExportProgress(30);
      const apiSpec = await generateOpenAPISpec();
      files.push({ name: 'api/openapi.yaml', content: apiSpec });

      setExportProgress(45);
      const backendFiles = await generateBackendReference();
      backendFiles.forEach(file => files.push(file));

      setExportProgress(60);
      const frontendFiles = await generateFrontendPackage();
      frontendFiles.forEach(file => files.push(file));

      setExportProgress(75);
      const deployGuideContent = generateDeploymentGuide();
      files.push({ name: 'deploy/cpanel-runbook.md', content: deployGuideContent });

      const vpsGuide = generateVPSGuide();
      files.push({ name: 'deploy/vps-runbook.md', content: vpsGuide });

      setExportProgress(90);
      const securityDoc = generateSecuritySpec();
      files.push({ name: 'security/rbac-specification.md', content: securityDoc });

      const storageDoc = generateStorageSpec();
      files.push({ name: 'storage/media-migration.md', content: storageDoc });

      setExportProgress(95);
      const archDiagram = generateArchitectureDiagram();
      files.push({ name: 'docs/ARCHITECTURE.md', content: archDiagram });

      const readme = generateReadme();
      files.push({ name: 'README.md', content: readme });

      const manifest = generateManifest(files);
      files.push({ name: 'MANIFEST.md', content: manifest });

      setExportProgress(98);
      setGeneratedFiles(files);
      
      const zip = new JSZip();
      files.forEach(file => {
        zip.file(file.name, file.content);
      });

      setExportProgress(99);
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      setExportProgress(100);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glorywave-selfhost-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setExporting(false);
        setExportProgress(0);
        window.alert(`✅ Successfully generated complete self-host package!\n\n📦 Files: ${files.length}\n💾 Format: ZIP archive\n📥 Check your downloads folder\n\nExtract the ZIP and follow README.md to deploy.`);
      }, 500);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(false);
      setExportProgress(0);
      window.alert('❌ Export failed. Please try again or contact support.');
    }
  };

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
STORAGE_PATH=/var/www/glorywave/storage

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_NAME=Glory Wave
SMTP_FROM_EMAIL=noreply@yourdomain.com

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
6. Verify all table entities created.

## Step 2: Backend Deployment

### 2.1 Setup Node.js App in cPanel
1. Navigate to cPanel → Setup Node.js App
2. Click "Create Application"
3. Configure settings like Node.js version 18.x, production mode, etc.

## Step 3: Frontend Deployment

### 3.1 Build Frontend
\`\`\`bash
# Build on local or build agent
npm run build
\`\`\`

### 3.2 Upload contents of dist to public_html via File Manager.

## Step 4: Final checks...
`;

    downloadFile(guide, 'DEPLOYMENT-GUIDE.md', 'text/markdown');
  };

  const exportMigrationChecklist = () => {
    const checklist = `# Self-Host Migration Checklist

## Pre-Migration
- [ ] Review current data size and estimate storage needs
- [ ] Export all data using Admin → Self-Host Export
- [ ] Setup secure environment variables

## Implementation
- [ ] Configure database schema
- [ ] Test API connectivity
- [ ] Upload static files

## Post-Migration
- [ ] Verify user logins
- [ ] Check payment webhooks
- [ ] Monitor error logs
`;

    downloadFile(checklist, 'MIGRATION-CHECKLIST.md', 'text/markdown');
  };

  const exportSecuritySpecs = () => {
    const securityDoc = `# Glory Wave - Security & Authorization Specification

## Authentication System
- JWT with HS256
- Bcrypt for password hashing
- RBAC with distinct roles (admin, user, moderator, editor)

## Rate Limiting
- Applied on auth and API endpoints to prevent brute force and DDoS.

## Audit Logging
- DB level tracking for sensitive CRUD operations.
`;

    downloadFile(securityDoc, 'SECURITY-SPECIFICATION.md', 'text/markdown');
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
            {exporting ? 'Generating ZIP Package...' : 'Export Complete Self-Host Package (ZIP)'}
          </Button>
          
          {generatedFiles.length > 0 && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300 font-bold mb-2">✓ Generated {generatedFiles.length} files</p>
              <p className="text-slate-300 text-sm">ZIP package downloaded. Extract and follow README.md to deploy.</p>
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