// karnataka-travel-ai-backend/runner.js
const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'auth-service', dir: 'services/auth-service' },
  { name: 'user-service', dir: 'services/user-service' },
  { name: 'itinerary-service', dir: 'services/itinerary-service' },
  { name: 'alert-service', dir: 'services/alert-service' },
  { name: 'reroute-service', dir: 'services/reroute-service' },
  { name: 'language-culture-service', dir: 'services/language-culture-service' },
  { name: 'admin-service', dir: 'services/admin-service' },
  { name: 'api-gateway', dir: 'services/api-gateway' }, // Gateway boots alongside them
];

services.forEach(({ name, dir }) => {
  const fullDir = path.join(__dirname, dir);
  // Run the compiled dist/index.js for each microservice
  const child = spawn('node', ['dist/index.js'], {
    cwd: fullDir,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err.message);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.warn(`[${name}] exited with code ${code}`);
    }
  });

  console.log(`[BOOT] Started ${name} from ${dir}`);
});