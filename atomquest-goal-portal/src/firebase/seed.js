import {
  createUserWithEmailAndPassword, updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { auth, db } from './config';

const DEMO_USERS = [
  {
    email: 'admin@performedge.com',
    password: 'Admin@123',
    name: 'Rajesh Kumar (Admin)',
    role: 'admin',
    department: 'HR',
    managerId: null,
  },
  {
    email: 'manager@performedge.com',
    password: 'Manager@123',
    name: 'Priya Sharma (Manager)',
    role: 'manager',
    department: 'Sales',
    managerId: null,
  },
  {
    email: 'employee@performedge.com',
    password: 'Employee@123',
    name: 'Arjun Singh',
    role: 'employee',
    department: 'Sales',
    managerId: null, // will be set after manager is created
  },
  {
    email: 'employee2@performedge.com',
    password: 'Employee@123',
    name: 'Meera Patel',
    role: 'employee',
    department: 'Operations',
    managerId: null,
  },
];

const SAMPLE_THRUST_AREAS = [
  'Revenue Growth',
  'Customer Satisfaction',
  'Operational Efficiency',
  'People Development',
  'Cost Reduction',
  'Digital Transformation',
  'Safety & Compliance',
  'Innovation',
];

export const seedDatabase = async () => {
  // Check if already seeded
  const usersSnap = await getDocs(collection(db, 'users'));
  if (usersSnap.size > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database...');
  const createdUsers = {};

  for (const user of DEMO_USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, user.email, user.password);
      await updateProfile(cred.user, { displayName: user.name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        managerId: null,
        avatar: null,
        createdAt: serverTimestamp(),
      });
      createdUsers[user.role] = cred.user.uid;
      console.log(`Created user: ${user.email}`);
    } catch (err) {
      if (err.code !== 'auth/email-already-in-use') {
        console.error(`Error creating ${user.email}:`, err);
      }
    }
  }

  // Update employee managerId
  if (createdUsers.employee && createdUsers.manager) {
    await setDoc(
      doc(db, 'users', createdUsers.employee),
      { managerId: createdUsers.manager },
      { merge: true }
    );
  }

  // Seed current cycle
  await setDoc(doc(db, 'cycles', 'current-2025'), {
    year: 2025,
    currentPhase: 'Q1',
    goalSettingOpen: '2025-05-01',
    goalSettingClose: '2025-06-30',
    q1Open: '2025-07-01',
    q1Close: '2025-07-31',
    q2Open: '2025-10-01',
    q2Close: '2025-10-31',
    q3Open: '2026-01-01',
    q3Close: '2026-01-31',
    q4Open: '2026-03-01',
    q4Close: '2026-04-30',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log('Database seeded successfully!');
  return createdUsers;
};

export const THRUST_AREAS = [
  'Revenue Growth',
  'Customer Satisfaction',
  'Operational Efficiency',
  'People Development',
  'Cost Reduction',
  'Digital Transformation',
  'Safety & Compliance',
  'Innovation',
];

export const UOM_TYPES = [
  { value: 'numeric_min', label: 'Numeric (Higher is Better)', description: 'e.g., Sales Revenue' },
  { value: 'numeric_max', label: 'Numeric (Lower is Better)', description: 'e.g., TAT, Cost' },
  { value: 'percentage_min', label: 'Percentage (Higher is Better)', description: 'e.g., Achievement %' },
  { value: 'percentage_max', label: 'Percentage (Lower is Better)', description: 'e.g., Defect rate' },
  { value: 'timeline', label: 'Timeline (Date-based)', description: 'e.g., Project Completion Date' },
  { value: 'zero', label: 'Zero-based (Zero = Success)', description: 'e.g., Safety Incidents' },
];

export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'Annual'];
export const GOAL_STATUS_OPTIONS = ['not_started', 'on_track', 'completed'];
