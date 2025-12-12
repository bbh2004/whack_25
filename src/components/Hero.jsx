import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useLoader, extend } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

// --- Custom Shader for Pixelated Transition ---
const PixelPlanetMaterial = shaderMaterial(
    {
        uTexture1: new THREE.Texture(),
        uTexture2: new THREE.Texture(),
        uMix: 0,
        uPixels: 100.0,
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment Shader
    `
    uniform sampler2D uTexture1;
    uniform sampler2D uTexture2;
    uniform float uMix;
    uniform float uPixels;
    varying vec2 vUv;

    void main() {
        vec4 c1 = texture2D(uTexture1, vUv);
        vec4 c2 = texture2D(uTexture2, vUv);
        gl_FragColor = mix(c1, c2, uMix); 
    }
    `
);

extend({ PixelPlanetMaterial });

function RotatingEarth({ onColorChange }) {
    const groupRef = useRef();
    const materialRef = useRef();

    // Load local high-res textures
    // Ensure these files exist in your public/assets/planets/ folder
    const [moon, mars, jupiter, venus] = useLoader(THREE.TextureLoader, [
        '/assets/planets/moon.jpg',
        '/assets/planets/mars.jpg',
        '/assets/planets/jupyter.jpg', // Keeping your filename 'jupyter.jpg'
        '/assets/planets/venus.jpg'
    ]);

    const textures = useMemo(() => [moon, mars, jupiter, venus], [moon, mars, jupiter, venus]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextIndex, setNextIndex] = useState(1);
    const [transitioning, setTransitioning] = useState(false);

    // Planet Cycle Logic
    useEffect(() => {
        const cycleInterval = setInterval(() => {
            if (!transitioning) {
                setTransitioning(true);
                // Trigger Color Change STARTING with the transition
                // This syncs the UI color fade with the texture morph
                if (onColorChange) onColorChange(nextIndex);
            }
        }, 5000);

        return () => clearInterval(cycleInterval);
    }, [transitioning, nextIndex, onColorChange]);

    // Animation Loop
    useFrame((state, delta) => {
        // Rotation
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.1;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }

        // Transition Logic
        if (transitioning && materialRef.current) {
            materialRef.current.uMix += delta * 0.5;
            if (materialRef.current.uMix >= 1) {
                materialRef.current.uMix = 0;
                setTransitioning(false);

                const newCurrentIndex = nextIndex;
                const newNextIndex = (nextIndex + 1) % textures.length;

                materialRef.current.uTexture1 = textures[newCurrentIndex];
                materialRef.current.uTexture2 = textures[newNextIndex];

                setCurrentIndex(newCurrentIndex);
                setNextIndex(newNextIndex);

                // Removed onColorChange from here (moved to start)
            }
        }
    });

    // Initial setup of uniforms (Run once)
    useEffect(() => {
        if (materialRef.current) {
            materialRef.current.uTexture1 = textures[currentIndex];
            materialRef.current.uTexture2 = textures[nextIndex];
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <group ref={groupRef} scale={3.5}>
            <mesh>
                <sphereGeometry args={[1, 64, 64]} />
                {/* @ts-ignore */}
                <pixelPlanetMaterial
                    ref={materialRef}
                    uPixels={120}
                    transparent
                />
            </mesh>
        </group>
    );
}

const Hero = ({ user, onEnterMission }) => {
    // Dynamic Theme State using index from RotatingEarth
    const [themeIndex, setThemeIndex] = useState(0);

    // Planet Themes: "Deep Space Aesthetic" (Rich, Vibrant Neons)
    const planetThemes = [
        // Moon: Cyber Cyan & Ice White
        { accent: '#22D3EE', glow: 'rgba(34, 211, 238, 0.8)', name: 'MOON BASE' },
        // Mars: Neon Crimson & Hot Pink
        { accent: '#FF0055', glow: 'rgba(255, 0, 85, 0.8)', name: 'MARS COLONY' },
        // Jupiter: Electric Violet & Deep Purple
        { accent: '#A855F7', glow: 'rgba(168, 85, 247, 0.8)', name: 'JUPITER ORBIT' },
        // Venus: Solar Gold & Bright Orange
        { accent: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)', name: 'VENUS STATION' },
    ];

    const activeTheme = planetThemes[themeIndex] || planetThemes[0];

    return (
        <section className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center text-center bg-transparent">

            {/* Font Injection */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                .font-pixel { font-family: 'Press Start 2P', cursive; }
                
                .hud-shadow {
                    text-shadow: 0 0 10px rgba(0,0,0,0.8);
                }
            `}</style>

            {/* 3D Background */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                <Canvas>
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 3, 5]} intensity={3.0} color="#ffffff" />
                    <Suspense fallback={null}>
                        {/* Pass callback to sync color */}
                        <RotatingEarth onColorChange={setThemeIndex} />
                    </Suspense>
                </Canvas>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full w-full pointer-events-auto px-4">

                {/* HEADLINE: GYANYAAN 1.0 */}
                <motion.h1
                    className="text-5xl md:text-8xl font-black text-white z-20 transition-all duration-[3000ms] ease-in-out"
                    style={{
                        textShadow: `0 0 30px ${activeTheme.glow}, 0 0 60px ${activeTheme.glow}`,
                        WebkitTextStroke: `1px ${activeTheme.accent}`
                    }}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    G Y A N Y A A N&nbsp;&nbsp;1.0
                </motion.h1>

                {/* SUBTITLE */}
                <motion.p
                    className="mt-6 text-xl md:text-2xl text-white tracking-[0.2em] font-bold z-20 uppercase hud-shadow transition-all duration-[3000ms] ease-in-out"
                    style={{
                        borderBottom: `2px solid ${activeTheme.accent}`,
                        paddingBottom: '10px',
                        letterSpacing: '0.3em'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                >
                    STATUS: <span style={{ color: 'white', textShadow: `0 0 20px ${activeTheme.accent}`, transition: 'text-shadow 3s ease-in-out' }}>{activeTheme.name}</span>
                </motion.p>

                {/* BUTTON: Premium Glass with Neon Glow */}
                <motion.button
                    className="mt-12 px-12 py-5 bg-black/30 border text-xl font-bold uppercase tracking-widest transition-all duration-[3000ms] z-20 backdrop-blur-xl"
                    style={{
                        borderColor: activeTheme.accent,
                        color: 'white',
                        boxShadow: `0 0 20px ${activeTheme.glow}, inset 0 0 10px ${activeTheme.glow}`
                    }}
                    whileHover={{
                        backgroundColor: activeTheme.accent,
                        color: '#000',
                        boxShadow: `0 0 60px ${activeTheme.accent}, 0 0 30px ${activeTheme.accent}`,
                        scale: 1.05
                    }}
                    onClick={() => {
                        onEnterMission();
                    }}
                >
                    {user ? `ENTER COCKPIT` : "START ENGINE"}
                </motion.button>
            </div>

            {/* Bottom Fade Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black via-black/60 to-transparent z-10 pointer-events-none" />
        </section>
    );
};
export default Hero;