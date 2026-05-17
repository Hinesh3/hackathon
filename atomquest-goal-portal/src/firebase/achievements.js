import {
  collection, doc, addDoc, updateDoc, getDocs,
  getDoc, query, where, orderBy, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from './config';

// ─── Achievements ─────────────────────────────────────────────────────────────

export const upsertAchievement = async (achievementData) => {
  const q = query(
    collection(db, 'achievements'),
    where('goalId', '==', achievementData.goalId),
    where('quarter', '==', achievementData.quarter)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, {
      ...achievementData,
      updatedAt: serverTimestamp(),
    });
    return snap.docs[0].id;
  } else {
    const ref = await addDoc(collection(db, 'achievements'), {
      ...achievementData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }
};

export const getAchievementsByGoal = async (goalId) => {
  const q = query(
    collection(db, 'achievements'),
    where('goalId', '==', goalId),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAchievementsByGoalIds = async (goalIds) => {
  if (!goalIds.length) return [];
  const q = query(collection(db, 'achievements'), where('goalId', 'in', goalIds));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllAchievements = async () => {
  const snap = await getDocs(collection(db, 'achievements'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addCheckInComment = async (goalId, quarter, comment, managerId, managerName) => {
  const q = query(
    collection(db, 'achievements'),
    where('goalId', '==', goalId),
    where('quarter', '==', quarter)
  );
  const snap = await getDocs(q);
  const commentData = {
    text: comment,
    by: managerName,
    byId: managerId,
    at: serverTimestamp(),
  };
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, {
      checkInComment: commentData,
      checkInBy: managerId,
      checkInAt: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, 'achievements'), {
      goalId,
      quarter,
      checkInComment: commentData,
      checkInBy: managerId,
      checkInAt: serverTimestamp(),
      status: 'not_started',
      actual: null,
      createdAt: serverTimestamp(),
    });
  }
};
