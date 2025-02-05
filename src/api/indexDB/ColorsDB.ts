import { Color } from '@/stores';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type ICustomColors = {
  id?: number;
  uid: string;
  colors: Color[];
}

const DB_NAME = 'ai-vector-graphics-Colos-database';
const STORE_NAME = 'ai-vector-graphics-Colos-store';

interface MyDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: ICustomColors
  };
}

export async function initDB(): Promise<IDBPDatabase<MyDB>> {
  const db = await openDB<MyDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  return db;
}
let db: IDBPDatabase<MyDB> | null = null;

async function getDB(): Promise<IDBPDatabase<MyDB>> {
  if (!db) {
    db = await initDB();
  }
  return db;
}

export async function addColorsData(data: ICustomColors): Promise<ICustomColors> {
  delete data.id;
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const id = await store.add(data);
  await tx.done;
  return { ...data, id };
}

export async function deleteColorsData(id: number): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).delete(id);
  await tx.done;
}

export async function getColorsLsit(): Promise<ICustomColors[]> {
  const db = await getDB();
  const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
  const allRecords = await store.getAll();
  const data = allRecords.sort((a, b) => (b.id || 0) - (a.id || 0))
  return data;
}