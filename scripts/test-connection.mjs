import { createClient } from '@libsql/client';

const tursoUrl = "libsql://kacc-hris-ragilramadhani.aws-ap-northeast-1.turso.io";
const tursoAuthToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE0MTAyNDQsImlkIjoiMzJiMWM3ZmYtMDExMC00YmI2LTg5YTQtOWM1NWVmZjUzODFlIiwicmlkIjoiZDQ4Yjg0NWYtMzExMi00N2EzLWI1ZjQtMmJmYWQxZWY2YmVhIn0.jKGm82AwGSPoO8BFduwb5v8LMX1cEHKL2W4nMQBOfMgdBOKAsaYto9ZtPhFMVeYtTv-VzHiFNqQgaEPNlg7DCA";

console.log('Testing connection to:', tursoUrl);

const client = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
});

async function test() {
    try {
        const rs = await client.execute('SELECT 1');
        console.log('Connection successful!', rs);
    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        client.close();
    }
}

test();
