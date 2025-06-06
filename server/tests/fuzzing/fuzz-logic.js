require('dotenv').config();

const { FuzzedDataProvider } = require('@jazzer.js/core');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const baseUrl = 'http://localhost:5000';

function generateToken(userData) {
  return jwt.sign(userData, process.env.JWT_SECRET || 'test-secret-key', { expiresIn: '1h' });
}

function generateSpecialString(fuzzer, maxLength = 100) {
  const specialChars = "<>!@#$%^&*()_+{}|:\"<>?~`-=[]\\;',./";
  let result = '';
  const length = fuzzer.consumeIntInRange(1, maxLength);
  
  for (let i = 0; i < length; i++) {
    if (fuzzer.consumeBoolean()) {
      const charIndex = fuzzer.consumeIntInRange(0, specialChars.length - 1);
      result += specialChars[charIndex];
    } else {
      result += fuzzer.consumeString(1);
    }
  }
  
  return result;
}

function generateMalformedObject(fuzzer) {
  const obj = {};
  const keys = fuzzer.consumeIntInRange(0, 20);
  
  for (let i = 0; i < keys; i++) {
    const key = generateSpecialString(fuzzer, 10);
    const valueType = fuzzer.consumeIntInRange(0, 10);
    switch (valueType) {
      case 0: obj[key] = null; break;
      case 1: obj[key] = undefined; break;
      case 2: obj[key] = generateSpecialString(fuzzer); break;
      case 3: obj[key] = fuzzer.consumeIntInRange(-1000000, 1000000); break;
      case 4: obj[key] = { nested: generateSpecialString(fuzzer) }; break;
      case 5: obj[key] = [generateSpecialString(fuzzer), null, undefined]; break;
      case 6: obj[key] = () => {}; break;
      case 7: obj[key] = Buffer.from(fuzzer.consumeBytes(100)); break;
      case 8: obj[key] = new Date(fuzzer.consumeIntInRange(0, 2147483647)); break;
      case 9: obj[key] = fuzzer.consumeBoolean(); break;
      case 10: 
        try {
          obj[key] = new RegExp(generateSpecialString(fuzzer, 5)); 
        } catch (e) {
          obj[key] = "/invalid/";
        }
        break;
    }
  }
  return obj;
}

function generateBadToken(fuzzer) {
  const tokenType = fuzzer.consumeIntInRange(0, 5);
  switch (tokenType) {
    case 0: return '';
    case 1:
      return jwt.sign(
        { userId: fuzzer.consumeIntInRange(1, 1000), role: 'user' },
        'wrong-secret-key', 
        { expiresIn: '1h' }
      );
    case 2:
      return jwt.sign(
        { userId: fuzzer.consumeIntInRange(1, 1000), role: 'user' },
        process.env.JWT_SECRET || 'test-secret-key', 
        { expiresIn: '-10h' }
      );
    case 3: return generateSpecialString(fuzzer, 50);
    case 4: return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(crypto.randomBytes(30)).toString('base64')}.invalid`;
    case 5:
      return jwt.sign(
        { userId: fuzzer.consumeIntInRange(1, 1000), role: fuzzer.consumeBoolean() ? 'user' : 'admin' },
        process.env.JWT_SECRET || 'test-secret-key', 
        { expiresIn: '1h' }
      );
  }
}

async function authFuzzer(data) {
  const fuzzer = new FuzzedDataProvider(data);
  const username = fuzzer.consumeString(10);
  const email = `${fuzzer.consumeString(8)}@${fuzzer.consumeString(5)}.com`;
  const password = fuzzer.consumeString(12);
  
  await request(baseUrl).post('/api/auth/register').send({ username, email, password });
  
  const loginData = {
    email: fuzzer.consumeBoolean() ? email : fuzzer.consumeString(15),
    password: fuzzer.consumeBoolean() ? password : fuzzer.consumeString(10),
    deviceId: fuzzer.consumeString(8),
    deviceName: fuzzer.consumeString(10),
    deviceType: fuzzer.consumeString(8)
  };
  await request(baseUrl).post('/api/auth/login').send(loginData);
}

async function trackFuzzer(data) {
  const fuzzer = new FuzzedDataProvider(data);
  const trackId = fuzzer.consumeIntInRange(1, 1000);
  await request(baseUrl).get(`/api/tracks/${trackId}`);
}

async function playlistFuzzer(data) {
  const fuzzer = new FuzzedDataProvider(data);
  const playlistId = fuzzer.consumeIntInRange(1, 1000);
  await request(baseUrl).get(`/api/playlists/${playlistId}`);
  
  const token = generateToken({ userId: fuzzer.consumeIntInRange(1, 10), role: 'user' });
  const createPlaylistData = { name: fuzzer.consumeString(15) };
  await request(baseUrl).post('/api/playlists').set('Authorization', `Bearer ${token}`).send(createPlaylistData);
}

async function validationFuzzer(data) {
  const fuzzer = new FuzzedDataProvider(data);
  const userId = fuzzer.consumeIntInRange(1, 10);
  const token = jwt.sign({ userId, role: 'user' }, process.env.JWT_SECRET || 'test-secret-key');
  
  const endpoints = [
    { path: '/api/auth/register', method: 'post' },
    { path: '/api/auth/login', method: 'post' },
    { path: '/api/tracks', method: 'post' },
    { path: '/api/playback/position', method: 'post' }
  ];
  const endpoint = endpoints[fuzzer.consumeIntInRange(0, endpoints.length - 1)];
  const malformedData = generateMalformedObject(fuzzer);
  
  const req = request(baseUrl)[endpoint.method](endpoint.path);
  if (!endpoint.path.includes('auth')) {
    req.set('Authorization', `Bearer ${token}`);
  }
  await req.send(malformedData);
}

async function aggressiveAuthFuzzer(data) {
  const fuzzer = new FuzzedDataProvider(data);
  const endpoints = [
    { path: '/api/auth/register', method: 'post' },
    { path: '/api/auth/login', method: 'post' },
    { path: '/api/auth/token', method: 'post' },
    { path: '/api/auth/refresh', method: 'post' }
  ];
  const endpoint = endpoints[fuzzer.consumeIntInRange(0, endpoints.length - 1)];
  const malformedData = generateMalformedObject(fuzzer);
  
  if (fuzzer.consumeBoolean()) {
    malformedData.email = `${fuzzer.consumeString(10)}@${fuzzer.consumeString(5)}.com`;
    malformedData.password = fuzzer.consumeString(8);
    malformedData.username = fuzzer.consumeString(10);
  }
  
  await request(baseUrl)[endpoint.method](endpoint.path)
    .set('Content-Type', fuzzer.consumeBoolean() ? 'application/json' : 'text/plain')
    .send(malformedData);
}

async function aggressiveTrackFuzzer(data) {
  const fuzzer = new FuzzedDataProvider(data);
  const methods = ['get', 'post', 'put', 'delete'];
  const method = methods[fuzzer.consumeIntInRange(0, methods.length - 1)];
  
  let endpoint = '/api/tracks';
  if (method !== 'post' && fuzzer.consumeBoolean()) {
    const idType = fuzzer.consumeIntInRange(0, 3);
    switch (idType) {
      case 0: endpoint += `/${fuzzer.consumeIntInRange(-1000, 1000)}`; break;
      case 1: endpoint += `/${generateSpecialString(fuzzer, 20)}`; break;
      case 2: endpoint += '/undefined'; break;
      case 3: endpoint += '/null'; break;
    }
  }
  
  const headers = {};
  if (fuzzer.consumeBoolean()) {
    headers['Authorization'] = `Bearer ${generateBadToken(fuzzer)}`;
  }
  if (fuzzer.consumeBoolean()) {
    headers['Content-Type'] = fuzzer.consumeBoolean() ? 'application/json' : generateSpecialString(fuzzer, 20);
  }
  
  const req = request(baseUrl)[method](endpoint).set(headers);
  if (method === 'post' || method === 'put') {
    await req.send(generateMalformedObject(fuzzer));
  } else {
    await req.send();
  }
}

async function aggressiveUserFuzzer(data) {
  const fuzzer = new FuzzedDataProvider(data);
  const endpoints = ['/api/users', '/api/users/profile', '/api/users/settings'];
  let endpoint = endpoints[fuzzer.consumeIntInRange(0, endpoints.length - 1)];
  
  if (endpoint === '/api/users' && fuzzer.consumeBoolean()) {
    const idType = fuzzer.consumeIntInRange(0, 3);
    switch (idType) {
      case 0: endpoint += `/${fuzzer.consumeIntInRange(-1000, 1000)}`; break;
      case 1: endpoint += `/${generateSpecialString(fuzzer, 20)}`; break;
      case 2: endpoint += '/undefined'; break;
      case 3: endpoint += '/null'; break;
    }
  }
  
  const methods = ['get', 'put', 'delete'];
  const method = methods[fuzzer.consumeIntInRange(0, methods.length - 1)];
  const token = generateBadToken(fuzzer);
  const req = request(baseUrl)[method](endpoint).set('Authorization', `Bearer ${token}`);
  
  if (method === 'put') {
    await req.send(generateMalformedObject(fuzzer));
  } else {
    await req.send();
  }
}

module.exports = {
  authFuzzer,
  trackFuzzer,
  playlistFuzzer,
  validationFuzzer,
  aggressiveAuthFuzzer,
  aggressiveTrackFuzzer,
  aggressiveUserFuzzer,
}; 