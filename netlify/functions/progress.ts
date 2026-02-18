import type { Handler } from '@netlify/functions';
import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME ?? 'fitracker';

if (!mongoUri) {
  throw new Error('MONGODB_URI is required.');
}

type ProgressRecord = {
  date: string;
  food: string;
  exercise: string;
  wheyGrams: number;
  creatineGrams: number;
  imageData?: string;
  imageName?: string;
  createdAt: Date;
};

let cachedClient: MongoClient | null = null;

async function getCollection() {
  if (!cachedClient) {
    cachedClient = new MongoClient(mongoUri);
    await cachedClient.connect();
  }

  return cachedClient.db(dbName).collection<ProgressRecord>('progress');
}

export const handler: Handler = async (event) => {
  try {
    const collection = await getCollection();

    if (event.httpMethod === 'GET') {
      const data = await collection
        .find({})
        .sort({ date: -1, createdAt: -1 })
        .map((entry) => ({ ...entry, _id: entry._id.toString() }))
        .toArray();

      return {
        statusCode: 200,
        body: JSON.stringify({ data }),
      };
    }

    if (event.httpMethod === 'POST') {
      if (!event.body) {
        return { statusCode: 400, body: 'Missing request body' };
      }

      const payload = JSON.parse(event.body) as Omit<ProgressRecord, 'createdAt'>;
      const record: ProgressRecord = {
        date: payload.date,
        food: payload.food ?? '',
        exercise: payload.exercise ?? '',
        wheyGrams: Number(payload.wheyGrams ?? 0),
        creatineGrams: Number(payload.creatineGrams ?? 0),
        imageData: payload.imageData,
        imageName: payload.imageName,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(record);
      return {
        statusCode: 201,
        body: JSON.stringify({ data: { ...record, _id: result.insertedId.toString() } }),
      };
    }

    return { statusCode: 405, body: 'Method not allowed' };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
