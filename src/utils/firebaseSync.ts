import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { Student, SchoolSettings, Examination, DateSheetItem, InstructionItem } from '../types';

// ==========================================
// Authentication Services
// ==========================================

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  } catch (error: any) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string): Promise<User> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  } catch (error: any) {
    console.error('Email Registration Error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ==========================================
// Firestore Student Operations
// ==========================================

export async function fetchStudentsFromFirestore(userId: string): Promise<Student[]> {
  const collectionPath = 'students';
  try {
    const q = query(collection(db, collectionPath), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const students: Student[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      students.push({
        id: d.id,
        name: data.name || '',
        fatherName: data.fatherName || '',
        motherName: data.motherName || '',
        rollNumber: data.rollNumber || data.rollNo || '',
        admissionNumber: data.admissionNumber || '',
        className: data.className || 'Class 1',
        section: data.section || 'A',
        dob: data.dob || '',
        gender: data.gender || 'Male',
        parentMobile: data.parentMobile || data.mobile || '',
        studentMobile: data.studentMobile || '',
        address: data.address || '',
        photoUrl: data.photoUrl || '',
        admitCardNumber: data.admitCardNumber || '',
        isGenerated: Boolean(data.isGenerated),
        generatedDate: data.generatedDate,
        customFieldValues: data.customFieldValues,
      });
    });
    return students;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    return [];
  }
}

export async function saveStudentToFirestore(userId: string, student: Student): Promise<void> {
  const path = `students/${student.id}`;
  try {
    const ref = doc(db, 'students', student.id);
    await setDoc(ref, {
      ...student,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStudentFromFirestore(userId: string, studentId: string): Promise<void> {
  const path = `students/${studentId}`;
  try {
    const ref = doc(db, 'students', studentId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncBatchStudentsToFirestore(userId: string, students: Student[]): Promise<void> {
  const path = 'students';
  try {
    // Firestore batches are limited to 500 operations
    const CHUNK_SIZE = 350;
    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((st) => {
        const ref = doc(db, 'students', st.id);
        batch.set(ref, {
          ...st,
          userId,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// Firestore School Settings Operations
// ==========================================

export async function fetchSchoolSettingsFromFirestore(userId: string): Promise<SchoolSettings | null> {
  const path = `schools/${userId}`;
  try {
    const ref = doc(db, 'schools', userId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      return snapshot.data() as SchoolSettings;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveSchoolSettingsToFirestore(userId: string, school: SchoolSettings): Promise<void> {
  const path = `schools/${userId}`;
  try {
    const ref = doc(db, 'schools', userId);
    await setDoc(ref, {
      ...school,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==========================================
// Firestore Examinations Operations
// ==========================================

export async function fetchExamsFromFirestore(userId: string): Promise<Examination[]> {
  const path = 'exams';
  try {
    const q = query(collection(db, path), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const exams: Examination[] = [];
    snapshot.forEach((d) => {
      exams.push({ id: d.id, ...(d.data() as any) });
    });
    return exams;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
}

export async function saveExamToFirestore(userId: string, exam: Examination): Promise<void> {
  const path = `exams/${exam.id}`;
  try {
    const ref = doc(db, 'exams', exam.id);
    await setDoc(ref, {
      ...exam,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
