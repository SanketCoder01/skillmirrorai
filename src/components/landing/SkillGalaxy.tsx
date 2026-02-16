import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import * as THREE from "three";

const skills = [
  { name: "React", matched: true, radius: 1.2, speed: 0.8, size: 0.15, color: "#61dafb" },
  { name: "Python", matched: true, radius: 1.8, speed: 0.6, size: 0.18, color: "#3776ab" },
  { name: "TypeScript", matched: true, radius: 2.4, speed: 0.5, size: 0.14, color: "#3178c6" },
  { name: "AWS", matched: false, radius: 3.0, speed: 0.4, size: 0.2, color: "#ff4466" },
  { name: "Docker", matched: false, radius: 3.6, speed: 0.35, size: 0.12, color: "#ff6688" },
  { name: "SQL", matched: true, radius: 4.2, speed: 0.3, size: 0.16, color: "#00b4d8" },
  { name: "K8s", matched: false, radius: 4.8, speed: 0.25, size: 0.22, color: "#ff4466" },
  { name: "Node.js", matched: true, radius: 5.4, speed: 0.2, size: 0.17, color: "#68a063" },
];

function Sun() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.1; });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#ffaa00" emissive="#ff8800" emissiveIntensity={2} />
      <pointLight intensity={3} distance={20} color="#ffcc44" />
    </mesh>
  );
}

function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line>
      <bufferGeometry attach="geometry" {...lineGeo} />
      <lineBasicMaterial attach="material" color="#ffffff" opacity={0.08} transparent />
    </line>
  );
}

function Planet({ name, matched, radius, speed, size, color }: typeof skills[0]) {
  const ref = useRef<THREE.Group>(null!);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 2) * 0.15;
  });

  const glowColor = matched ? color : "#ff4466";

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={matched ? 0.8 : 1.2} />
      </mesh>
      {/* Glow ring for unmatched */}
      {!matched && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size + 0.04, size + 0.08, 32]} />
          <meshBasicMaterial color="#ff4466" opacity={0.4} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
      <Text position={[0, size + 0.18, 0]} fontSize={0.13} color={glowColor} anchorX="center" anchorY="middle" font={undefined}>
        {name}
      </Text>
    </group>
  );
}

function Scene() {
  const groupRef = useRef<THREE.Group>(null!);

  return (
    <group ref={groupRef} rotation={[0.5, 0, 0]}>
      <Sun />
      {skills.map((s) => (
        <OrbitRing key={s.name + "-orbit"} radius={s.radius} />
      ))}
      {skills.map((s) => (
        <Planet key={s.name} {...s} />
      ))}
    </group>
  );
}

const SkillGalaxy = () => (
  <section id="features" className="py-24">
    <div className="container mx-auto px-4">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
        3D <span className="gradient-text">Skill Galaxy</span>
      </h2>
      <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto text-sm">
        Your skills orbit around your target job — like planets in a solar system.
      </p>
      <div className="h-[500px] glass-card overflow-hidden">
        <Canvas camera={{ position: [0, 4, 10], fov: 45 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 5, 5]} intensity={0.3} color="#ffffff" />
          <Scene />
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
