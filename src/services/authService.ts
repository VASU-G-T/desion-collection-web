import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { AdminUser } from '../types';

const googleProvider = new GoogleAuthProvider();

export function subscribeToAuthChanges(callback: (user: AdminUser | null) => void) {
  // Check if mock admin is logged in
  const mockAdminStr = localStorage.getItem('mock_admin_user');
  if (mockAdminStr) {
    try {
      const mockUser = JSON.parse(mockAdminStr);
      callback(mockUser);
    } catch (_) {}
  }

  return onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin',
        photoURL: firebaseUser.photoURL,
        isAdmin: true, // Authenticated users have administrative access in this Vault
      });
    } else {
      // Only set to null if no mock admin exists
      if (!localStorage.getItem('mock_admin_user')) {
        callback(null);
      }
    }
  });
}

export async function loginWithGoogle(): Promise<AdminUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Google Admin',
      photoURL: user.photoURL,
      isAdmin: true,
    };
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    throw new Error(error.message || 'Google sign in failed');
  }
}

export async function loginWithEmail(emailOrUserId: string, pass: string): Promise<AdminUser> {
  const trimmedId = emailOrUserId.trim();
  
  // Instant local override for demo admin credentials (takes 0ms)
  if (trimmedId === 'next' && pass === 'printers') {
    const mockUser: AdminUser = {
      uid: 'mock-admin-uid-123',
      email: 'next@nextprinters.com',
      displayName: 'Admin',
      photoURL: null,
      isAdmin: true,
    };
    localStorage.setItem('mock_admin_user', JSON.stringify(mockUser));
    
    // Dispatch a custom auth state event to notify subscribeToAuthChanges
    const event = new Event('storage');
    window.dispatchEvent(event);
    
    return mockUser;
  }

  const formattedEmail = trimmedId.includes('@') ? trimmedId : `${trimmedId}@nextprinters.com`;
  try {
    const result = await signInWithEmailAndPassword(auth, formattedEmail, pass);
    const user = result.user;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
      photoURL: user.photoURL,
      isAdmin: true,
    };
  } catch (error: any) {
    // If user doesn't exist yet, attempt automatic creation for admin demo credentials
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/invalid-email'
    ) {
      try {
        const createResult = await createUserWithEmailAndPassword(auth, formattedEmail, pass);
        const user = createResult.user;
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.email?.split('@')[0] || 'Admin',
          photoURL: null,
          isAdmin: true,
        };
      } catch (createErr: any) {
        if (createErr.code === 'auth/weak-password') {
          throw new Error('Password must be at least 6 characters long.');
        }
        throw new Error('Invalid credentials. Please verify your Admin User ID and password.');
      }
    }
    throw new Error(error.message || 'Authentication failed');
  }
}

export async function logout(): Promise<void> {
  localStorage.removeItem('mock_admin_user');
  await firebaseSignOut(auth);
}
