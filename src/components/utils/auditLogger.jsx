import { base44 } from "@/api/base44Client";

/**
 * Comprehensive Audit Logger Utility
 * Automatically logs all significant system actions for compliance and traceability
 */

export const AuditLogger = {
  /**
   * Log a general action
   */
  async logAction({
    actionType,
    entityType = null,
    entityId = null,
    entityName = null,
    description,
    changes = null,
    severity = 'medium',
    status = 'success',
    errorMessage = null,
    metadata = {},
    tags = [],
    duration = null,
    affectedRecordsCount = null
  }) {
    try {
      const user = await base44.auth.me();
      
      const logEntry = {
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        user_role: user.role,
        action_description: description,
        changes: changes,
        ip_address: await this.getIpAddress(),
        user_agent: navigator.userAgent,
        session_id: this.getSessionId(),
        severity: severity,
        status: status,
        error_message: errorMessage,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        tags: tags,
        duration: duration,
        affected_records_count: affectedRecordsCount,
        is_automated: false
      };

      await base44.entities.AuditLog.create(logEntry);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  },

  /**
   * Log a creation action
   */
  async logCreate(entityType, entityId, entityName, data = {}) {
    await this.logAction({
      actionType: 'create',
      entityType,
      entityId,
      entityName,
      description: `Created new ${entityType}: ${entityName}`,
      changes: {
        after: data,
        fields_changed: Object.keys(data)
      },
      severity: 'low',
      tags: ['create', entityType.toLowerCase()]
    });
  },

  /**
   * Log an update action
   */
  async logUpdate(entityType, entityId, entityName, before, after) {
    const changedFields = Object.keys(after).filter(
      key => JSON.stringify(before[key]) !== JSON.stringify(after[key])
    );

    await this.logAction({
      actionType: 'update',
      entityType,
      entityId,
      entityName,
      description: `Updated ${entityType}: ${entityName} (${changedFields.length} fields changed)`,
      changes: {
        before,
        after,
        fields_changed: changedFields
      },
      severity: 'medium',
      tags: ['update', entityType.toLowerCase()]
    });
  },

  /**
   * Log a deletion action
   */
  async logDelete(entityType, entityId, entityName, data = {}) {
    await this.logAction({
      actionType: 'delete',
      entityType,
      entityId,
      entityName,
      description: `Deleted ${entityType}: ${entityName}`,
      changes: {
        before: data
      },
      severity: 'high',
      tags: ['delete', entityType.toLowerCase()]
    });
  },

  /**
   * Log a login action
   */
  async logLogin() {
    const user = await base44.auth.me();
    await this.logAction({
      actionType: 'login',
      description: `User logged in: ${user.email}`,
      severity: 'low',
      tags: ['authentication', 'login']
    });
  },

  /**
   * Log a logout action
   */
  async logLogout() {
    try {
      const user = await base44.auth.me();
      await this.logAction({
        actionType: 'logout',
        description: `User logged out: ${user.email}`,
        severity: 'low',
        tags: ['authentication', 'logout']
      });
    } catch (error) {
      // User might be already logged out
    }
  },

  /**
   * Log an export action
   */
  async logExport(format, tables, recordCount) {
    await this.logAction({
      actionType: 'export',
      description: `Exported ${tables.length} tables (${recordCount} records) as ${format}`,
      metadata: {
        format,
        tables,
        record_count: recordCount
      },
      severity: 'medium',
      affectedRecordsCount: recordCount,
      tags: ['export', 'data-transfer', format.toLowerCase()]
    });
  },

  /**
   * Log an import action
   */
  async logImport(entityType, recordCount, fileName) {
    await this.logAction({
      actionType: 'import',
      entityType,
      description: `Imported ${recordCount} ${entityType} records from ${fileName}`,
      metadata: {
        file_name: fileName,
        record_count: recordCount
      },
      severity: 'high',
      affectedRecordsCount: recordCount,
      tags: ['import', 'data-transfer', entityType.toLowerCase()]
    });
  },

  /**
   * Log a permission change
   */
  async logPermissionChange(targetUserId, targetUserName, action, details) {
    await this.logAction({
      actionType: 'permission_change',
      description: `Permission changed for ${targetUserName}: ${action}`,
      metadata: {
        target_user_id: targetUserId,
        target_user_name: targetUserName,
        action,
        details
      },
      severity: 'critical',
      tags: ['security', 'permissions', 'rbac']
    });
  },

  /**
   * Log a role assignment
   */
  async logRoleAssign(targetUserId, targetUserName, roleName) {
    await this.logAction({
      actionType: 'role_assign',
      description: `Assigned role "${roleName}" to ${targetUserName}`,
      metadata: {
        target_user_id: targetUserId,
        target_user_name: targetUserName,
        role_name: roleName
      },
      severity: 'high',
      tags: ['security', 'role-management']
    });
  },

  /**
   * Log a password change
   */
  async logPasswordChange() {
    await this.logAction({
      actionType: 'password_change',
      description: 'User changed their password',
      severity: 'medium',
      tags: ['security', 'authentication']
    });
  },

  /**
   * Log a settings change
   */
  async logSettingsChange(settingKey, oldValue, newValue) {
    await this.logAction({
      actionType: 'settings_change',
      description: `Changed setting: ${settingKey}`,
      changes: {
        before: { [settingKey]: oldValue },
        after: { [settingKey]: newValue },
        fields_changed: [settingKey]
      },
      severity: 'medium',
      tags: ['configuration', 'settings']
    });
  },

  /**
   * Log a backup creation
   */
  async logBackupCreate(backupType, size) {
    await this.logAction({
      actionType: 'backup_create',
      description: `Created ${backupType} backup (${size} MB)`,
      metadata: {
        backup_type: backupType,
        size_mb: size
      },
      severity: 'low',
      tags: ['backup', 'data-protection']
    });
  },

  /**
   * Log a query execution
   */
  async logQueryExecute(query, responseTime, recordCount) {
    await this.logAction({
      actionType: 'query_execute',
      description: `Executed database query`,
      metadata: {
        query: query.substring(0, 500), // Truncate long queries
        response_time: responseTime,
        record_count: recordCount
      },
      severity: 'low',
      duration: responseTime,
      affectedRecordsCount: recordCount,
      tags: ['database', 'query']
    });
  },

  /**
   * Log a security event
   */
  async logSecurityEvent(eventType, description, details = {}) {
    await this.logAction({
      actionType: 'security_event',
      description: `Security event: ${description}`,
      metadata: {
        event_type: eventType,
        ...details
      },
      severity: 'critical',
      tags: ['security', 'alert', eventType]
    });
  },

  /**
   * Log an access denied event
   */
  async logAccessDenied(resource, reason) {
    await this.logAction({
      actionType: 'access_denied',
      description: `Access denied to ${resource}: ${reason}`,
      metadata: {
        resource,
        reason
      },
      severity: 'high',
      status: 'failure',
      tags: ['security', 'access-control', 'denied']
    });
  },

  /**
   * Helper: Get IP address (simplified)
   */
  async getIpAddress() {
    try {
      // In production, this would call a service to get real IP
      return 'Client IP';
    } catch {
      return 'Unknown';
    }
  },

  /**
   * Helper: Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }
};

export default AuditLogger;