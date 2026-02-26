import { createClient } from '@libsql/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
    console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env');
    process.exit(1);
}

console.log('Connecting to Turso at:', tursoUrl);
const client = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
});

async function run() {
    try {
        // Step 1: Drop ALL existing tables (including new ones)
        console.log('Dropping existing tables...');
        const dropSQL = `
            DROP TABLE IF EXISTS "PayrollIncentive";
            DROP TABLE IF EXISTS "Attendance";
            DROP TABLE IF EXISTS "Employee";
            DROP TABLE IF EXISTS "Shift";
            DROP TABLE IF EXISTS "Outlet";
            DROP TABLE IF EXISTS "Department";
            DROP TABLE IF EXISTS "Setting";
            DROP TABLE IF EXISTS "Admin";
            DROP TABLE IF EXISTS "_prisma_migrations";
        `;
        await client.executeMultiple(dropSQL);
        console.log('All tables dropped.');

        // Step 2: Generate SQL migration script from Prisma schema
        console.log('Generating SQL from Prisma schema...');
        const sql = execSync(
            'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
            { encoding: 'utf-8' }
        );

        if (!sql || sql.trim() === '') {
            console.log('No SQL generated.');
            process.exit(0);
        }

        console.log('SQL to execute:');
        console.log(sql);

        // Step 3: Execute on Turso
        console.log('Pushing schema to Turso...');
        await client.executeMultiple(sql);
        console.log('Schema pushed successfully!');

        // Step 4: Quick verify
        const rs = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        console.log('Created tables:', rs.rows.map(r => r.name));

    } catch (error) {
        console.error('FULL ERROR:', error);
        process.exit(1);
    } finally {
        client.close();
    }
}

run();
