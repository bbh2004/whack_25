import { motion } from 'framer-motion';

const FeatureCard = ({ title, icon, delay }) => {
    return (
        <motion.div
            className="p-8 text-center group transition-all duration-300 transform hover:-translate-y-2 relative"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: delay }}
            viewport={{ once: true }}
        >
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300 opacity-80 group-hover:opacity-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-white/70 group-hover:text-neonBlue transition-colors tracking-wide">{title}</h3>
        </motion.div>
    );
};

const ScrollSection2 = () => {
    return (
        <section className="relative py-12 bg-transparent flex flex-col items-center justify-center">
            {/* Subtle gradient overlay to help readability if needed */}
            {/* <div className="absolute inset-0 bg-spaceDark/30 -z-10 pointer-events-none"></div> */}

            <div className="container mx-auto px-6">
                <motion.h2
                    className="text-4xl md:text-5xl font-bold text-center mb-10 text-white tracking-tight"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    Mission Capabilities
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                        title="Build Rockets"
                        icon="🚀"
                        delay={0.2}
                    />
                    <FeatureCard
                        title="Launch Missions"
                        icon="🌌"
                        delay={0.4}
                    />
                    <FeatureCard
                        title="Orbital Maneuvers"
                        icon="🪐"
                        delay={0.6}
                    />
                </div>
            </div>
        </section>
    );
};

export default ScrollSection2;
