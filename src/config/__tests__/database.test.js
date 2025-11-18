import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDatabaseConfig, validateDatabaseConfig, dbConfig, testDbConfig, prodDbConfig } from '../database.js';

describe('Database Configuration', () => {
    let originalEnv;

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env };
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('getDatabaseConfig', () => {
        it('should return development config by default', () => {
            process.env.NODE_ENV = 'development';
            const config = getDatabaseConfig();
            expect(config).toEqual(dbConfig());
        });

        it('should return test config when NODE_ENV is test', () => {
            process.env.NODE_ENV = 'test';
            const config = getDatabaseConfig();
            expect(config).toEqual(testDbConfig());
            expect(config.database).toBe('suzengrave_test');
        });

        it('should return production config when NODE_ENV is production', () => {
            process.env.NODE_ENV = 'production';
            const config = getDatabaseConfig();
            expect(config).toEqual(prodDbConfig());
        });
    });

    describe('Environment variable support', () => {
        it('should use environment variables when provided', () => {
            process.env.NODE_ENV = 'development';
            process.env.DB_HOST = 'custom-host';
            process.env.DB_PORT = '3306';
            process.env.DB_NAME = 'custom-db';
            process.env.DB_USER = 'custom-user';
            process.env.DB_PASSWORD = 'custom-pass';
            process.env.DB_POOL_SIZE = '10';

            const config = getDatabaseConfig();
            expect(config.host).toBe('custom-host');
            expect(config.port).toBe(3306);
            expect(config.database).toBe('custom-db');
            expect(config.user).toBe('custom-user');
            expect(config.password).toBe('custom-pass');
            expect(config.max).toBe(10);
        });

        it('should use default values when environment variables are not set', () => {
            process.env.NODE_ENV = 'development';
            // Clear relevant environment variables
            delete process.env.DB_HOST;
            delete process.env.DB_PORT;
            delete process.env.DB_NAME;
            delete process.env.DB_USER;
            delete process.env.DB_PASSWORD;

            const config = getDatabaseConfig();
            expect(config.host).toBe('localhost');
            expect(config.port).toBe(5432);
            expect(config.database).toBe('suzengrave');
            expect(config.user).toBe('postgres');
            expect(config.password).toBe('');
        });
    });

    describe('validateDatabaseConfig', () => {
        it('should pass validation for valid config', () => {
            const validConfig = {
                host: 'localhost',
                port: 5432,
                database: 'test',
                user: 'postgres',
                max: 20
            };

            expect(() => validateDatabaseConfig(validConfig)).not.toThrow();
        });

        it('should throw error for missing required fields', () => {
            const invalidConfig = {
                host: 'localhost',
                // missing port, database, user
            };

            expect(() => validateDatabaseConfig(invalidConfig)).toThrow('Database configuration missing required field: port');
        });

        it('should throw error for invalid port', () => {
            const invalidConfig = {
                host: 'localhost',
                port: 'invalid',
                database: 'test',
                user: 'postgres',
                max: 20
            };

            expect(() => validateDatabaseConfig(invalidConfig)).toThrow('Database port must be a valid number between 1 and 65535');
        });

        it('should throw error for invalid pool size', () => {
            const invalidConfig = {
                host: 'localhost',
                port: 5432,
                database: 'test',
                user: 'postgres',
                max: 0
            };

            expect(() => validateDatabaseConfig(invalidConfig)).toThrow('Database pool size (max) must be a positive number');
        });
    });

    describe('Configuration differences', () => {
        it('should have different database names for test and development', () => {
            expect(testDbConfig().database).toBe('suzengrave_test');
            expect(dbConfig().database).toBe('suzengrave');
        });

        it('should have smaller pool size for test environment', () => {
            expect(testDbConfig().max).toBeLessThan(dbConfig().max);
        });

        it('should have shorter timeouts for test environment', () => {
            expect(testDbConfig().idleTimeoutMillis).toBeLessThan(dbConfig().idleTimeoutMillis);
            expect(testDbConfig().connectionTimeoutMillis).toBeLessThan(dbConfig().connectionTimeoutMillis);
        });
    });
});