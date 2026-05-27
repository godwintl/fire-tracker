import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { getDatabase, ref, set, onValue } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyDHX7mz0L5q-hheL1CF-cTfR0dpm0slHgA",
  authDomain: "fire-tracker-bdbda.firebaseapp.com",
  databaseURL: "https://fire-tracker-bdbda-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fire-tracker-bdbda",
  storageBucket: "fire-tracker-bdbda.firebasestorage.app",
  messagingSenderId: "645905053352",
  appId: "1:645905053352:web:693b4a0f978b94d4d4f49d",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getDatabase(app)

const ALLOWED_EMAIL = 'godwintl@gmail.com'

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  if (result.user.email !== ALLOWED_EMAIL) {
    await signOut(auth)
    throw new Error('Unauthorized. This dashboard is private.')
  }
  return result
}

export function signOutUser() {
  return signOut(auth)
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export function saveInputs(uid, inputs) {
  return set(ref(db, `users/${uid}/inputs`), inputs)
}

export function subscribeToInputs(uid, callback) {
  return onValue(ref(db, `users/${uid}/inputs`), (snapshot) => {
    const data = snapshot.val()
    if (data) callback(data)
  })
}
