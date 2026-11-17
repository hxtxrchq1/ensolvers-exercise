import assert from 'node:assert/strict';
import test from 'node:test';
import { URL } from 'node:url';
import { getApiBaseUrl } from '../src/services/api-url.ts';

test('accepts local and production API origins and normalizes a trailing slash', () => {
  assert.equal(
    getApiBaseUrl('http://localhost:3000/api'),
    'http://localhost:3000/api',
  );
  assert.equal(
    getApiBaseUrl('https://notesbackend.chiqo.cc.cd/api/'),
    'https://notesbackend.chiqo.cc.cd/api',
  );
});

test('rejects missing, non-HTTP, or relative API URLs', () => {
  for (const value of [undefined, '', 'ftp://api.example.test/api', '/api']) {
    assert.throws(() => getApiBaseUrl(value));
  }
});

test('rejects URLs with an incorrect API path, query, hash, or credentials', () => {
  const credentialsUrl = new URL('https://api.example.test/api');
  credentialsUrl.username = 'fixture-user';
  credentialsUrl.password = 'fixture-password';

  for (const value of [
    'https://api.example.test/',
    'https://api.example.test/api/api',
    'https://api.example.test/api?debug=true',
    'https://api.example.test/api#fragment',
  ]) {
    assert.throws(() => getApiBaseUrl(value));
  }

  assert.throws(() => getApiBaseUrl(credentialsUrl.href));
});
