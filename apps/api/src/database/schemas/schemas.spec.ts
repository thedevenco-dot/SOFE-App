import { UserSchema } from './user.schema';
import { AdminUserSchema } from './admin-user.schema';
import { AuditLogSchema } from './audit-log.schema';
import { AppConfigSchema } from './app-config.schema';

describe('Base Database Schemas', () => {
  describe('UserSchema', () => {
    it('should have required indexes registered', () => {
      const indexes = UserSchema.indexes();
      const indexKeys = indexes.map((idx) => idx[0]);

      // Check compound status+createdAt index
      const hasStatusCreatedAtIndex = indexKeys.some(
        (key) => key['status'] === 1 && key['createdAt'] === -1,
      );
      expect(hasStatusCreatedAtIndex).toBe(true);
    });

    it('should configure paths and options on relevant fields', () => {
      const paths = UserSchema.paths;
      expect(paths['firebaseUid']).toBeDefined();
      expect(paths['name']).toBeDefined();
      expect(paths['status']).toBeDefined();
      expect(paths['counters']).toBeDefined();
      expect(paths['streak']).toBeDefined();
      expect(paths['planPreferences']).toBeDefined();
      expect(paths['settings']).toBeDefined();
      expect(paths['pushTokens']).toBeDefined();
    });
  });

  describe('AdminUserSchema', () => {
    it('should have firebaseUid and email paths defined', () => {
      const paths = AdminUserSchema.paths;
      expect(paths['firebaseUid']).toBeDefined();
      expect(paths['email']).toBeDefined();
      expect(paths['roles']).toBeDefined();
      expect(paths['status']).toBeDefined();
      expect(paths['twoFactorEnabled']).toBeDefined();
    });
  });

  describe('AuditLogSchema', () => {
    it('should have compound and single indexes registered', () => {
      const indexes = AuditLogSchema.indexes();
      const indexKeys = indexes.map((idx) => idx[0]);

      const hasEntityIndex = indexKeys.some(
        (key) => key['entityType'] === 1 && key['entityId'] === 1 && key['createdAt'] === -1,
      );
      const hasActorIndex = indexKeys.some(
        (key) => key['actorAdminId'] === 1 && key['createdAt'] === -1,
      );

      expect(hasEntityIndex).toBe(true);
      expect(hasActorIndex).toBe(true);
    });
  });

  describe('AppConfigSchema', () => {
    it('should have key path defined', () => {
      const paths = AppConfigSchema.paths;
      expect(paths['key']).toBeDefined();
      expect(paths['value']).toBeDefined();
    });
  });
});
