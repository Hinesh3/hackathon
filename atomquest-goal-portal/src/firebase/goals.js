import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy,
  serverTimestamp, writeBatch, arrayUnion,
} from 'firebase/firestore';
import { db } from './config';
import { addAuditLog } from './audit';

// ─── Goals ────────────────────────────────────────────────────────────────────

export const createGoal = async (goalData, userId) => {
  const ref = await addDoc(collection(db, 'goals'), {
    ...goalData,
    employeeId: userId,
    status: 'draft',
    isShared: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateGoal = async (goalId, updates, changedBy, userName, originalData) => {
  const ref = doc(db, 'goals', goalId);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });

  // Audit log for each changed field
  for (const [field, newVal] of Object.entries(updates)) {
    if (originalData && originalData[field] !== newVal) {
      await addAuditLog({
        goalId,
        userId: changedBy,
        userName,
        action: 'update',
        field,
        oldValue: String(originalData[field] ?? ''),
        newValue: String(newVal),
      });
    }
  }
};

export const getGoalsByEmployee = async (employeeId) => {
  const q = query(
    collection(db, 'goals'),
    where('employeeId', '==', employeeId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getGoalsByManager = async (managerEmployeeIds) => {
  if (!managerEmployeeIds.length) return [];
  const q = query(
    collection(db, 'goals'),
    where('employeeId', 'in', managerEmployeeIds)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllGoals = async () => {
  const snap = await getDocs(collection(db, 'goals'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getGoal = async (goalId) => {
  const snap = await getDoc(doc(db, 'goals', goalId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const submitGoals = async (employeeId) => {
  const q = query(
    collection(db, 'goals'),
    where('employeeId', '==', employeeId),
    where('status', '==', 'draft')
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) =>
    batch.update(d.ref, { status: 'submitted', updatedAt: serverTimestamp() })
  );
  await batch.commit();
};

export const approveGoals = async (goalIds, changedBy, userName) => {
  const batch = writeBatch(db);
  for (const id of goalIds) {
    batch.update(doc(db, 'goals', id), {
      status: 'approved',
      lockedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await addAuditLog({ goalId: id, userId: changedBy, userName, action: 'approved', field: 'status', oldValue: 'submitted', newValue: 'approved' });
  }
  await batch.commit();
};

export const returnGoals = async (goalIds, reason, changedBy, userName) => {
  const batch = writeBatch(db);
  for (const id of goalIds) {
    batch.update(doc(db, 'goals', id), {
      status: 'returned',
      returnReason: reason,
      updatedAt: serverTimestamp(),
    });
    await addAuditLog({ goalId: id, userId: changedBy, userName, action: 'returned', field: 'status', oldValue: 'submitted', newValue: 'returned' });
  }
  await batch.commit();
};

export const deleteGoal = async (goalId) => {
  await deleteDoc(doc(db, 'goals', goalId));
};

// ─── Shared Goals ─────────────────────────────────────────────────────────────

export const pushSharedGoal = async (sharedGoalData, targetEmployeeIds, adminId) => {
  const batch = writeBatch(db);
  const primaryRef = doc(collection(db, 'goals'));

  batch.set(primaryRef, {
    ...sharedGoalData,
    employeeId: adminId,
    isShared: true,
    primaryOwnerId: primaryRef.id,
    linkedEmployees: targetEmployeeIds,
    status: 'approved',
    lockedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  for (const empId of targetEmployeeIds) {
    const ref = doc(collection(db, 'goals'));
    batch.set(ref, {
      ...sharedGoalData,
      employeeId: empId,
      isShared: true,
      primaryOwnerId: primaryRef.id,
      status: 'approved',
      lockedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
};
