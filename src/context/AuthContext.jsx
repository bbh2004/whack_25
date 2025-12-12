
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

// Force account selection every time
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    function signInWithGoogle() {
        return signInWithPopup(auth, googleProvider);
    }

    function logout() {
        return signOut(auth);
    }

    async function saveUserProfile(uid, data) {
        try {
            await setDoc(doc(db, "users", uid), data, { merge: true });
            setUserProfile(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error("Error saving profile:", error);
            throw error;
        }
    }

    async function getLevelProgress(missionId) {
        if (!currentUser) return null;
        try {
            const progressRef = doc(db, "users", currentUser.uid, "progress", missionId);
            const progressSnap = await getDoc(progressRef);
            if (progressSnap.exists()) {
                return progressSnap.data();
            }
            // Default: Level 1 unlocked for new users
            return { unlockedLevels: [1] };
        } catch (error) {
            console.error("Error fetching level progress:", error);
            return { unlockedLevels: [1] };
        }
    }

    async function saveLevelProgress(missionId, completedLevel) {
        if (!currentUser) return;
        try {
            const progressRef = doc(db, "users", currentUser.uid, "progress", missionId);
            const currentProgress = await getLevelProgress(missionId);
            const unlockedLevels = currentProgress.unlockedLevels || [1];

            // Unlock next level if not already unlocked
            if (completedLevel < 4 && !unlockedLevels.includes(completedLevel + 1)) {
                unlockedLevels.push(completedLevel + 1);
            }

            await setDoc(progressRef, {
                unlockedLevels,
                lastPlayed: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error saving level progress:", error);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                // Fetch user profile if it exists
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data());
                    } else {
                        setUserProfile(null);
                    }
                } catch (err) {
                    console.error("Error fetching profile:", err);
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        signInWithGoogle,
        logout,
        saveUserProfile,
        getLevelProgress,
        saveLevelProgress
    };

    if (loading) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Mission Data...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
