import { MongoClient } from "mongodb";

let cachedUri = "";
let clientPromise = null;

async function getClient(env) {
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI secret is not configured");
  if (!clientPromise || cachedUri !== env.MONGODB_URI) {
    cachedUri = env.MONGODB_URI;
    const client = new MongoClient(env.MONGODB_URI);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb(env) {
  const client = await getClient(env);
  return client.db("ai_slang");
}

export async function saveMessage(env, message) {
  const db = await getDb(env);
  await db.collection("messages").insertOne({ ...message, created_at: message.created_at || new Date() });
}

export async function getRecentMessages(env, roomId, limit = 20) {
  const db = await getDb(env);
  return db.collection("messages").find({ room_id: roomId }).sort({ created_at: -1 }).limit(limit).toArray();
}

export async function upsertUserPreferences(env, user) {
  const db = await getDb(env);
  await db.collection("users").updateOne(
    { username: user.username },
    { $set: { ...user, updated_at: new Date() }, $setOnInsert: { created_at: new Date() } },
    { upsert: true }
  );
}

export async function getUser(env, username) {
  const db = await getDb(env);
  return db.collection("users").findOne({ username });
}
