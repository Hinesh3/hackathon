import {
  collection, doc, getDocs, getDoc, query, where,
  orderBy, serverTimestamp, updateDoc, setDoc, addDoc, deleteDoc
} from 'firebase/firestore';
import { db } from './config';

export const getAllUsers = async () => {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getUserById = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getUsersByManager = async (managerId) => {
  const q = query(collection(db, 'users'), where('managerId', '==', managerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateUser = async (uid, updates) => {
  await updateDoc(doc(db, 'users', uid), { ...updates, updatedAt: serverTimestamp() });
};

export const createUserDoc = async (uid, userData) => {
  await setDoc(doc(db, 'users', uid), {
    ...userData,
    createdAt: serverTimestamp(),
  });
};

export const deleteUser = async (uid) => {
  await deleteDoc(doc(db, 'users', uid));
};

// ─── Cycles ───────────────────────────────────────────────────────────────────

export const getCurrentCycle = async () => {
  const snap = await getDocs(
    query(collection(db, 'cycles'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.length ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
};

export const getAllCycles = async () => {
  const snap = await getDocs(query(collection(db, 'cycles'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createCycle = async (cycleData) => {
  const ref = await addDoc(collection(db, 'cycles'), {
    ...cycleData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateCycle = async (cycleId, updates) => {
  await updateDoc(doc(db, 'cycles', cycleId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};
