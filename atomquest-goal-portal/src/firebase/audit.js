import {
  collection, addDoc, getDocs, query,
  orderBy, serverTimestamp, where, limit,
} from 'firebase/firestore';
import { db } from './config';

export const addAuditLog = async (data) => {
  await addDoc(collection(db, 'auditLogs'), {
    ...data,
    timestamp: serverTimestamp(),
  });
};

export const getAuditLogs = async (filters = {}) => {
  let q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAuditLogsByGoal = async (goalId) => {
  const q = query(
    collection(db, 'auditLogs'),
    where('goalId', '==', goalId),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
