import Hero from './components/Hero';
import ScrollSection2 from './components/ScrollSection2';
import StarryBackground from './components/ui/StarryBackground';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const LandingPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleEnterMission = () => {
        if (currentUser) {
            navigate('/missions');
        } else {
            navigate('/register'); // CTA goes to register for new users
        }
    };

    return (
        <div className="relative min-h-screen text-white overflow-hidden selection:bg-neonBlue selection:text-black flex flex-col items-center justify-center">
            <StarryBackground />
            {/* Pass handleEnterMission to Hero. Hero functionality needs to be compatible. */}
            <Hero user={currentUser} onEnterMission={handleEnterMission} />
        </div>
    );
};



export default LandingPage;
