/**
 * DB connection utility tests.
 * We mock mongoose completely to avoid loading bson (which ships as ESM
 * and isn't compatible with Jest's CommonJS transform).
 */

// Full mock — no jest.requireActual to avoid the bson ESM import error
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({ connection: { readyState: 1 } }),
}));

describe('connectDB', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost:27017/test' };
    // Reset the global cache before each test
    (global as Record<string, unknown>).__mongoose = undefined;

    // Re-apply the mock after module reset
    jest.mock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue({ connection: { readyState: 1 } }),
    }));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws if MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI;
    const { connectDB } = require('@/lib/db') as { connectDB: () => Promise<unknown> };
    await expect(connectDB()).rejects.toThrow(
      'Please define MONGODB_URI in your environment variables'
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
