import { createClient } from '@libsql/client';

const tursoUrl = "libsql://kacc-hris-ragilramadhani.aws-ap-northeast-1.turso.io";
const tursoAuthToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE0MTAyNDQsImlkIjoiMzJiMWM3ZmYtMDExMC00YmI2LTg5YTQtOWM1NWVmZjUzODFlIiwicmlkIjoiZDQ4Yjg0NWYtMzExMi00N2EzLWI1ZjQtMmJmYWQxZWY2YmVhIn0.jKGm82AwGSPoO8BFduwb5v8LMX1cEHKL2W4nMQBOfMgdBOKAsaYto9ZtPhFMVeYtTv-VzHiFNqQgaEPNlg7DCA";

const client = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
});

async function check() {
    try {
        // List all tables
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables:', tables.rows);

        // Check Employee table schema
        const employeeSchema = await client.execute("PRAGMA table_info('Employee')");
        console.log('Employee columns:', employeeSchema.rows);

        // Check Department table schema
        const deptSchema = await client.execute("PRAGMA table_info('Department')");
        console.log('Department columns:', deptSchema.rows);

        // Check Attendance table schema
        const attendSchema = await client.execute("PRAGMA table_info('Attendance')");
        console.log('Attendance columns:', attendSchema.rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.close();
    }
}

check();
