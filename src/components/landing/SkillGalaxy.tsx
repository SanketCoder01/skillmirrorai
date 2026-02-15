import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import * as THREE from "three";

const skills = [
  { name: "React", matched: true, pos: [2, 1, 0] as [number, number, number] },
  { name: "Python", matched: true, pos: [-1.5, 2, -1] as [number, number, number] },
  { name: "TypeScript", matched: true, pos: [0.5, -1.5, 1] as [number, number, number] },
  { name: "AWS", matched: false, pos: [-2, -0.5, 0.5] as [number, number, number] },
  { name: "Docker", matched: false, pos: [1.5, 0.5, -2] as [number, number, number] },
  { name: "SQL", matched: true, pos: [-0.5, 1, 2] as [number, number, number] },
  { name: "Kubernetes", matched: false, pos: [0, -2, -1] as [number, number, number] },
  { name: "Node.js", matched: true, pos: [2.5, -1, 1] as [number, number, number] },
];

function SkillNode({ name, matched, position }: { name: string; matched: boolean; position: [number, number, number] }) {
  const color = matched ? "#00ff88" : "#ff4466";
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <group position={position}>
        <mesh>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </mesh>
        <Text position={[0, 0.35, 0]} fontSize={0.18} color={color} anchorX="center" anchorY="middle">
          {name}
        </Text>
      </group>
    </Float>
  );
}

function RotatingGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });
  return <group ref={ref}>{children}</group>;
}

const SkillGalaxy = () => (
  <section id="features" className="py-24">
    <div className="container mx-auto px-4">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
        3D <span className="gradient-text">Skill Galaxy</span>
      </h2>
      <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto text-sm">
        Visualize matched and missing skills in an interactive 3D space.
      </p>
      <div className="h-[400px] glass-card overflow-hidden">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#00e5ff" />
          <RotatingGroup>
            {skills.map((s) => (
              <SkillNode key={s.name} name={s.name} matched={s.matched} position={s.pos} />
            ))}
          </RotatingGroup>
        </Canvas>
      </div>
      <div className="flex justify-center gap-6 mt-6 text-sm">
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-neon-green" /> Matched</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-accent" /> Missing</span>
      </div>
    </div>
  </section>
);

export default SkillGalaxy;
