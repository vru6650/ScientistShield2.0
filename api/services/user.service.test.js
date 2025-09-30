import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import bcryptjs from 'bcryptjs';

import User from '../models/user.model.js';
import { updateUserById } from './user.service.js';

test('updateUserById hashes incoming password updates before saving', async () => {
  const userDoc = {
    username: 'alice',
    email: 'alice@example.com',
    password: 'old-hash',
    save: mock.fn(async function () {
      return this;
    }),
  };

  const findByIdMock = mock.method(User, 'findById', async () => userDoc);

  try {
    const result = await updateUserById('user-id', { password: 'new-secret' });

    assert.equal(userDoc.save.mock.callCount(), 1, 'user document should be saved once');
    assert.notEqual(result.password, 'new-secret', 'plain text password must not be stored');
    assert.ok(
      await bcryptjs.compare('new-secret', result.password),
      'stored password should be a bcrypt hash of the new password'
    );
  } finally {
    findByIdMock.mock.restore();
  }
});

test('updateUserById leaves password unchanged when update is missing', async () => {
  const existingHash = await bcryptjs.hash('original-secret', 10);
  const userDoc = {
    username: 'bob',
    email: 'bob@example.com',
    password: existingHash,
    save: mock.fn(async function () {
      return this;
    }),
  };

  const findByIdMock = mock.method(User, 'findById', async () => userDoc);

  try {
    const result = await updateUserById('user-id', { username: 'updated-bob' });

    assert.equal(result.password, existingHash, 'existing hash should be preserved');
    assert.equal(userDoc.save.mock.callCount(), 1, 'user document should still be saved');
  } finally {
    findByIdMock.mock.restore();
  }
});
