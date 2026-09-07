// tests/unit/memory.test.js

const {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
} = require('../../src/model/data');

describe('memory data model', () => {
  test('writeFragment() and readFragment() store and retrieve fragment metadata', async () => {
    const fragment = {
      id: 'fragment-1',
      ownerId: 'owner-1',
      type: 'text/plain',
      size: 5,
    };

    await writeFragment(fragment);

    expect(await readFragment(fragment.ownerId, fragment.id)).toEqual(fragment);
  });

  test('readFragment() returns undefined for an unknown fragment', async () => {
    expect(await readFragment('unknown-owner', 'unknown-fragment')).toBeUndefined();
  });

  test('writeFragmentData() and readFragmentData() store and retrieve a Buffer', async () => {
    const ownerId = 'owner-2';
    const id = 'fragment-2';
    const buffer = Buffer.from('hello');

    await writeFragmentData(ownerId, id, buffer);

    expect(await readFragmentData(ownerId, id)).toEqual(buffer);
  });

  test('readFragmentData() returns undefined for unknown fragment data', async () => {
    expect(await readFragmentData('unknown-owner-data', 'unknown-data')).toBeUndefined();
  });

  test('listFragments() returns fragment IDs for an owner', async () => {
    const ownerId = 'owner-3';

    await writeFragment({
      id: 'fragment-3a',
      ownerId,
      type: 'text/plain',
      size: 1,
    });

    await writeFragment({
      id: 'fragment-3b',
      ownerId,
      type: 'text/plain',
      size: 2,
    });

    expect(await listFragments(ownerId)).toEqual(['fragment-3a', 'fragment-3b']);
  });

  test('listFragments() returns serialized fragments when expand is true', async () => {
    const ownerId = 'owner-4';
    const fragment = {
      id: 'fragment-4',
      ownerId,
      type: 'text/plain',
      size: 4,
    };

    await writeFragment(fragment);

    expect(await listFragments(ownerId, true)).toEqual([JSON.stringify(fragment)]);
  });

  test('deleteFragment() deletes fragment metadata and data', async () => {
    const ownerId = 'owner-5';
    const id = 'fragment-5';
    const fragment = {
      id,
      ownerId,
      type: 'text/plain',
      size: 5,
    };

    await writeFragment(fragment);
    await writeFragmentData(ownerId, id, Buffer.from('hello'));
    await deleteFragment(ownerId, id);

    expect(await readFragment(ownerId, id)).toBeUndefined();
    expect(await readFragmentData(ownerId, id)).toBeUndefined();
  });
});
