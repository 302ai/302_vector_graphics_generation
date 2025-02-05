import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type IFinishedProduct = {
    id?: number;
    videoUrl?: string;
    oldImageUrl?: string;
    newImageUrl?: string;
    type: "text" | "image" | "video";
    status?: 'succeed' | 'submitted';
}

const DB_NAME = 'ai-vector-graphics-finished-product-database';
const STORE_NAME = 'ai-vector-graphics-finished-product-store';

interface MyDB extends DBSchema {
    [STORE_NAME]: {
        key: number;
        value: IFinishedProduct
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

export async function addFinishedProductData(data: IFinishedProduct): Promise<IFinishedProduct> {
    delete data.id;
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const id = await store.add(data);
    await tx.done;
    return { ...data, id };
}

export async function deleteFinishedProductData(id: number): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).delete(id);
    await tx.done;
}

export async function getFinishedProductLsit(): Promise<IFinishedProduct[]> {
    const db = await getDB();
    const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
    const allRecords = await store.getAll();
    const data = allRecords.sort((a, b) => (b.id || 0) - (a.id || 0))
    return data;
}

export async function updateFinishedProductData(id: number, updatedData: Partial<IFinishedProduct>): Promise<IFinishedProduct> {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const existingData = await store.get(id);
    if (!existingData) {
        throw new Error('Product not found');
    }
    const updatedProduct = { ...existingData, ...updatedData };
    await store.put(updatedProduct);
    await tx.done;
    return updatedProduct;
}

export async function deleteSubmittedAndEmptyProductsAndGetRemaining(): Promise<IFinishedProduct[]> {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    let cursor = await store.openCursor();

    const remainingProducts: IFinishedProduct[] = [];

    while (cursor) {
        const product = cursor.value;
        if (product.status === 'submitted' || 
            (!product.videoUrl && !product.oldImageUrl && !product.newImageUrl)) {
            await cursor.delete();
        } else {
            remainingProducts.push(product);
        }
        cursor = await cursor.continue();
    }

    await tx.done;

    // 按 id 降序排序
    return remainingProducts.sort((a, b) => (b.id || 0) - (a.id || 0));
}