
import React, { useState } from 'react';
import Level1 from '../levels/Level1';
import Level2 from '../levels/Level2';
import Level3 from '../levels/Level3';
import Level4 from '../levels/Level4';
import Level5 from '../levels/Level5';
import Level6 from '../levels/Level6';
import LevelSelection from './LevelSelection';
import { useAuth } from '../context/AuthContext';

const MissionControl = ({ mission, onBack }) => {
    const { saveLevelProgress } = useAuth();
    const [selectedLevel, setSelectedLevel] = useState(null);

    const handleLevelComplete = async (levelId) => {
        // Save progress to unlock next level
        await saveLevelProgress(mission?.id || 'mangalyaan', levelId);

        // Advance to next level (if not the last level)
        if (levelId < 6) {
            setSelectedLevel(levelId + 1);
        } else {
            // Last level - return to level selection
            setSelectedLevel(null);
        }
    };

    const handleBackToLevelSelection = () => {
        setSelectedLevel(null);
    };

    // Mangalyaan mission - show level selection
    if ((mission?.id === 'mangalyaan' || mission === "MANGALYAAN") && !selectedLevel) {
        return (
            <LevelSelection
                mission={mission?.id ? mission : { id: 'mangalyaan', name: 'MARS ORBIT' }}
                onBack={onBack}
                onSelectLevel={setSelectedLevel}
            />
        );
    }

    // Render selected level
    if (selectedLevel === 1) {
        return <Level1 onNextLevel={() => handleLevelComplete(1)} onBack={handleBackToLevelSelection} />;
    }
    if (selectedLevel === 2) {
        return <Level2 onNextLevel={() => handleLevelComplete(2)} onBack={handleBackToLevelSelection} />;
    }
    if (selectedLevel === 3) {
        return <Level3 onNextLevel={() => handleLevelComplete(3)} onBack={handleBackToLevelSelection} />;
    }
    if (selectedLevel === 4) {
        return <Level4 onNextLevel={() => handleLevelComplete(4)} onBack={handleBackToLevelSelection} />;
    }
    if (selectedLevel === 5) {
        return <Level5 onNextLevel={() => handleLevelComplete(5)} onBack={handleBackToLevelSelection} />;
    }
    if (selectedLevel === 6) {
        return <Level6 onNextLevel={() => handleLevelComplete(6)} onBack={handleBackToLevelSelection} />;
    }

    // Other missions - locked
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">MISSION LOCKED</h2>
                <p className="mb-6">This mission is currently in development.</p>
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded"
                >
                    RETURN TO MAP
                </button>
            </div>
        </div>
    );
};

export default MissionControl;
