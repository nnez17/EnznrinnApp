import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { getFirestoreDb } from '@/config/firebase';
import { Transaction, Target, UserName } from '@/types';
import { toISOString } from '@/utils/dateUtils';

const TRANSACTIONS_COL = 'transactions';
const TARGETS_COL = 'targets';
const TARGET_DOC_ID = 'current';

function extractDate(value: any): string {
  if (!value) return toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (value.toDate) return value.toDate().toISOString();
  return String(value);
}

function transformDocToTransaction(id: string, data: any): Transaction {
  return {
    id: data.id || id,
    user: data.user as UserName | null,
    type: data.type as 'income' | 'expense',
    amount: Number(data.amount) || 0,
    note: data.note || '',
    date: extractDate(data.date),
    balance: Number(data.balance) || 0,
  };
}

export const firestoreService = {
  async loadTransactions(): Promise<Transaction[]> {
    const db = getFirestoreDb();
    const q = query(collection(db, TRANSACTIONS_COL), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      transformDocToTransaction(doc.id, doc.data())
    );
  },

  async appendTransaction(transaction: Transaction): Promise<void> {
    const db = getFirestoreDb();
    await addDoc(collection(db, TRANSACTIONS_COL), {
      id: transaction.id,
      user: transaction.user,
      type: transaction.type,
      amount: transaction.amount,
      note: transaction.note,
      date: transaction.date,
      balance: transaction.balance,
    });
  },

  async updateTransaction(transactionId: string, updates: Partial<Pick<Transaction, 'amount' | 'note' | 'user'>>): Promise<Transaction[]> {
    const db = getFirestoreDb();

    const allSnap = await getDocs(
      query(collection(db, TRANSACTIONS_COL), orderBy('date', 'asc'))
    );

    let runningBalance = 0;
    const updated: Transaction[] = [];

    for (const docSnap of allSnap.docs) {
      const data = docSnap.data();
      const tx: Transaction = {
        id: data.id || docSnap.id,
        user: data.user as UserName | null,
        type: data.type as 'income' | 'expense',
        amount: Number(data.amount) || 0,
        note: data.note || '',
        date: extractDate(data.date),
        balance: 0,
      };

      if (tx.id === transactionId) {
        if (updates.amount !== undefined) tx.amount = updates.amount;
        if (updates.note !== undefined) tx.note = updates.note;
        if (updates.user !== undefined) tx.user = updates.user;
      }

      runningBalance += tx.type === 'income' ? tx.amount : -tx.amount;
      tx.balance = runningBalance;
      updated.push(tx);
    }

    const batch = writeBatch(db);
    for (const docSnap of allSnap.docs) {
      batch.delete(docSnap.ref);
    }
    await batch.commit();

    if (updated.length > 0) {
      const addBatch = writeBatch(db);
      for (const tx of updated) {
        const ref = doc(collection(db, TRANSACTIONS_COL));
        addBatch.set(ref, {
          id: tx.id,
          user: tx.user,
          type: tx.type,
          amount: tx.amount,
          note: tx.note,
          date: tx.date,
          balance: tx.balance,
        });
      }
      await addBatch.commit();
    }

    return updated.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  },

  async deleteTransaction(transactionId: string): Promise<Transaction[]> {
    const db = getFirestoreDb();

    const allSnap = await getDocs(
      query(collection(db, TRANSACTIONS_COL), orderBy('date', 'asc'))
    );

    let runningBalance = 0;
    const remaining: Transaction[] = [];

    for (const docSnap of allSnap.docs) {
      const data = docSnap.data();
      if (data.id === transactionId) {
        continue;
      }
      runningBalance += data.type === 'income' ? data.amount : -data.amount;
      const tx: Transaction = {
        id: data.id || docSnap.id,
        user: data.user as UserName | null,
        type: data.type as 'income' | 'expense',
        amount: Number(data.amount) || 0,
        note: data.note || '',
        date: extractDate(data.date),
        balance: runningBalance,
      };
      remaining.push(tx);
    }

    const batch = writeBatch(db);
    for (const docSnap of allSnap.docs) {
      batch.delete(docSnap.ref);
    }
    await batch.commit();

    if (remaining.length > 0) {
      const addBatch = writeBatch(db);
      for (const tx of remaining) {
        const ref = doc(collection(db, TRANSACTIONS_COL));
        addBatch.set(ref, {
          id: tx.id,
          user: tx.user,
          type: tx.type,
          amount: tx.amount,
          note: tx.note,
          date: tx.date,
          balance: tx.balance,
        });
      }
      await addBatch.commit();
    }

    return remaining.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  },

  async loadTarget(): Promise<Target | null> {
    const db = getFirestoreDb();
    const docRef = doc(db, TARGETS_COL, TARGET_DOC_ID);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      id: data.id || TARGET_DOC_ID,
      targetAmount: Number(data.targetAmount) || 0,
      currentAmount: Number(data.currentAmount) || 0,
      deadline: extractDate(data.deadline),
      createdAt: extractDate(data.createdAt),
    };
  },

  async saveTarget(target: Target): Promise<void> {
    const db = getFirestoreDb();
    const docRef = doc(db, TARGETS_COL, TARGET_DOC_ID);
    await setDoc(docRef, {
      id: target.id,
      targetAmount: target.targetAmount,
      currentAmount: target.currentAmount,
      deadline: target.deadline,
      createdAt: target.createdAt,
    });
  },

  async updateTarget(updates: { targetAmount?: number; currentAmount?: number; deadline?: string }): Promise<void> {
    const db = getFirestoreDb();
    const docRef = doc(db, TARGETS_COL, TARGET_DOC_ID);
    await updateDoc(docRef, updates);
  },

  async deleteTarget(): Promise<void> {
    const db = getFirestoreDb();
    const docRef = doc(db, TARGETS_COL, TARGET_DOC_ID);
    await deleteDoc(docRef);
  },
};
