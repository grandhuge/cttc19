
import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_siLrELAuTt3VOx2JxzcNbT1maHV9jLk",
  authDomain: "training-portal-aistudio.firebaseapp.com",
  projectId: "training-portal-aistudio",
  storageBucket: "training-portal-aistudio.firebasestorage.app",
  messagingSenderId: "1046304865031",
  appId: "1:1046304865031:web:2d82a09eba80d21d2a23a2",
  measurementId: "G-L8QQR7766D"
};

// --- INITIALIZE FIREBASE ---
const app = initializeApp(firebaseConfig);

// --- EXPORT FIREBASE SERVICES ---
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// --- RE-EXPORT AUTH FUNCTIONS ---
export {
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";

// --- RE-EXPORT FIRESTORE FUNCTIONS & TYPES ---
// This allows other files to import everything from a single place.
export { 
    doc, 
    collection, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    onSnapshot, 
    addDoc, 
    Timestamp,
    query,
    where
} from "firebase/firestore";


// --- CUSTOM SERVICE FUNCTIONS ---

/**
 * Performs a cascading delete for a course on a live Firestore database.
 * This function deletes the course, its subcollections (quiz, survey),
 * the associated chat room and its messages, and all user enrollments for that course.
 * NOTE: For production applications, it is highly recommended to move this
 * logic to a server-side Cloud Function for better performance, security, and reliability.
 * Executing this many reads and writes from the client can be slow and is not ideal.
 */
export const deleteCourseAndAssociatedData = async (courseId: string) => {
    // 1. Delete quiz and survey subcollections
    const subcollections = ['quiz', 'survey'];
    for (const sub of subcollections) {
        const subcollectionRef = collection(firestore, `courses/${courseId}/${sub}`);
        const snapshot = await getDocs(subcollectionRef);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
    }
    
    // 2. Delete user enrollments for this course
    const usersSnapshot = await getDocs(collection(firestore, 'users'));
    const enrollmentDeletionPromises = usersSnapshot.docs.map(async (userDoc) => {
        const enrollmentRef = doc(firestore, `users/${userDoc.id}/enrollments/${courseId}`);
        // Check if enrollment exists before trying to delete to avoid unnecessary errors
        const enrollmentSnap = await getDoc(enrollmentRef);
        if (enrollmentSnap.exists()) {
            return deleteDoc(enrollmentRef);
        }
    });
    await Promise.all(enrollmentDeletionPromises);

    // 3. Delete chat room and its messages
    const messagesRef = collection(firestore, `chat_rooms/${courseId}/messages`);
    const messagesSnapshot = await getDocs(messagesRef);
    const messageDeletePromises = messagesSnapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(messageDeletePromises);
    
    const chatRoomRef = doc(firestore, `chat_rooms/${courseId}`);
    const chatRoomSnap = await getDoc(chatRoomRef);
    if (chatRoomSnap.exists()) {
        await deleteDoc(chatRoomRef);
    }
    
    // 4. Delete the main course document
    await deleteDoc(doc(firestore, `courses/${courseId}`));
};