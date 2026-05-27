/**
 * DB connection utility tests.
 * We mock mongoose.connect so no real DB connection is made.
 */

// Mock mongoose before importing connectDB
jest.mock('mongoose', () => {
  const actual = jest.requireActual<typeof import('mongoose')>('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({ connection: { readyState: 1 } }),
  };
});

describe('connectDB', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost:27017/test' };
    // Reset the global cache before each test
    (global as Record<string, unknown>).__mongoose = undefined;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws if MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI;
    expect(() => require('@/lib/db')).toThrow(
      'Please define MONGODB_URI in your .env.local file'
    );
  });

  it('calls mongoose.connect with the provided URI', async () => {
    const mongoose = require('mongoose');
    const { connectDB } = require('@/lib/db');
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://localhost:27017/test',
      expect.objectContaining({ bufferCommands: false })
    );
  });

  it('reuses the cached connection on subsequent calls', async () => {
    const mongoose = require('mongoose');
    const { connectDB } = require('@/lib/db');
    await connectDB();
    await connectDB();
    // connect should only be called once despite two calls
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });
});
