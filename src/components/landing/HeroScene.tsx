import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/* Floating particle field */
function Particles({ count = 300 }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) arr[i] = (Math.random() - 0.5) * 20;
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#00e5ff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

/* Holographic rotating resume card */
function HoloCard() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.3;
      ref.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={ref}>
        <boxGeometry args={[2.4, 3.2, 0.05]} />
        <meshStandardMaterial
          color="#0a0a1a"
          emissive="#00e5ff"
          emissiveIntensity={0.15}
          transparent
          opacity={0.7}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Glow edges */}
      <mesh ref={ref}>
        <boxGeometry args={[2.45, 3.25, 0.02]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.12} />
      </mesh>
    </Float>
  );
}

const HeroScene = () => (
  <div className="absolute inset-0 -z-10">
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#00e5ff" />
      <pointLight position={[-5, -3, 3]} intensity={0.4} color="#a855f7" />
      <Particles />
      <HoloCard />
    </Canvas>
  </div>
);

export default HeroScene;
