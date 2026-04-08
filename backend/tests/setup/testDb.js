import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;
let mongoUri;

export async function connectTestDb() {
  // Spin up a temporary MongoDB instance so tests never touch the normal development database.
  mongoServer = await MongoMemoryServer.create();
  mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}

export function getTestDbUri() {
  return mongoUri;
}

export async function clearTestDb() {
  // Remove data between tests while keeping the same in-memory database server alive.
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}
