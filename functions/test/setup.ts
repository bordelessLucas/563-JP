import { vi } from "vitest";

process.env.VITEST = "true";
process.env.APP_ENV = "test";
process.env.PAYMENT_PROVIDER = "mock";
process.env.DELIVERY_PROVIDER = "mock";
process.env.ENABLE_MOCK_PAYMENT = "true";
process.env.UBER_DIRECT_MODE = "test";

vi.mock("firebase-admin", () => {
  const firestoreFn = Object.assign(
    () => ({
      doc: vi.fn(),
      collection: vi.fn(),
      runTransaction: vi.fn(),
    }),
    {
      FieldValue: {
        serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
        arrayUnion: vi.fn((...args: unknown[]) => args),
        delete: vi.fn(() => "DELETE_FIELD"),
      },
    },
  );

  return {
    apps: [{ name: "[DEFAULT]" }],
    initializeApp: vi.fn(),
    firestore: firestoreFn,
  };
});
