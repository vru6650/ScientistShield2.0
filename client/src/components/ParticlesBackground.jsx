import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useMediaQuery } from 'react-responsive';

export default function ParticlesBackground() {
    const [init, setInit] = useState(false);
    const prefersDarkMode = useMediaQuery({ query: '(prefers-color-scheme: dark)' });
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    const currentMode = prefersDarkMode ? 'dark' : 'light';

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const options = useMemo(
        () => ({
            background: {
                color: {
                    value: "transparent",
                },
            },
            fpsLimit: isMobile ? 60 : 120,
            interactivity: {
                events: {
                    onHover: {
                        enable: !isMobile,
                        mode: "grab", // Change to grab for a more sci-fi feel
                        parallax: {
                            enable: true,
                            force: 60,
                            smooth: 10,
                        },
                    },
                    onClick: {
                        enable: true,
                        mode: "push",
                    },
                    resize: true,
                },
                modes: {
                    grab: {
                        distance: 200,
                        links: {
                            opacity: 0.8,
                            color: currentMode === 'dark' ? "#6C85FF" : "#4C62F5",
                        },
                    },
                    push: {
                        quantity: isMobile ? 2 : 4,
                    },
                    repulse: {
                        distance: 120,
                        duration: 0.4,
                    },
                },
            },
            particles: {
                color: {
                    // Harmonise particle palette with Aurora Horizon brand hues
                    value: currentMode === 'dark' ? ["#6C85FF", "#2DD4BF", "#F26B2A"] : ["#8EA6FF", "#2DD4BF", "#F26B2A"],
                },
                links: {
                    color: {
                        value: currentMode === 'dark' ? "#1f2937" : "#d8ddff",
                    },
                    distance: 180,
                    enable: true,
                    opacity: 0.35,
                    width: 1,
                    triangles: {
                        enable: true,
                        color: {
                            value: currentMode === 'dark' ? "#6C85FF" : "#8EA6FF",
                        },
                        opacity: 0.05,
                    },
                },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: {
                        default: "bounce",
                    },
                    random: true,
                    speed: 0.8,
                    straight: false,
                    attract: {
                        enable: true,
                        rotateX: 600,
                        rotateY: 1200,
                    },
                    gravity: {
                        enable: false,
                    },
                    vibrate: false,
                    warp: false,
                },
                number: {
                    density: {
                        enable: true,
                        area: 1000,
                    },
                    value: isMobile ? 30 : 60,
                },
                opacity: {
                    value: { min: 0.1, max: 0.5 },
                    animation: {
                        enable: true,
                        speed: 0.8,
                        minimumValue: 0.1,
                        sync: false,
                    },
                },
                shape: {
                    type: ["circle", "star", "polygon"],
                    options: {
                        polygon: {
                            sides: 5,
                        },
                    },
                },
                size: {
                    value: { min: 0.5, max: 2 },
                    animation: {
                        enable: true,
                        speed: 1.5,
                        minimumValue: 0.5,
                        sync: false,
                    },
                },
                twinkle: {
                    particles: {
                        enable: true,
                        frequency: 0.05,
                        opacity: 1,
                        color: {
                            value: "#FFFFFF",
                        },
                    },
                },
            },
            detectRetina: true,
        }),
        [currentMode, isMobile],
    );

    if (init) {
        return (
            <Particles
                id="tsparticles"
                options={options}
                className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
            />
        );
    }

    return null;
}
