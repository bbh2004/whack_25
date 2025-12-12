
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

const BackgroundContent = () => {
    const starsRef = useRef();

    useFrame((state, delta) => {
        if (starsRef.current) {
            starsRef.current.rotation.x -= delta * 0.05;
            starsRef.current.rotation.y -= delta * 0.05;
        }
    });

    return (
        <>
            <Stars
                ref={starsRef}
                radius={120}
                depth={60}
                count={15000}
                factor={4}
                saturation={0}
                fade
                speed={1}
            />
            {/* Optional Fog for depth */}
            <fog attach="fog" args={['#050510', 0, 80]} />
        </>
    );
};

const StarryBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full z-[-1] bg-spaceDark pointer-events-none">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <BackgroundContent />
                <ambientLight intensity={0.2} />
            </Canvas>
        </div>
    );
};

export default StarryBackground;
