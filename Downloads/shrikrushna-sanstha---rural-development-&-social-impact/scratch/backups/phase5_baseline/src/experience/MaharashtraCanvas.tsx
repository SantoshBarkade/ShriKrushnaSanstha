import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePageVisible } from './hooks';

type SceneProps = {
  reducedMotion: boolean;
};

function makeHillGeometry(width: number, depth: number, segments: number, height: number, seed: number) {
  const geometry = new THREE.PlaneGeometry(width, depth, segments, Math.floor(segments / 2));
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const ridge =
      Math.sin((x + seed) * 0.12) * height +
      Math.cos((y + seed) * 0.18) * (height * 0.45) +
      Math.sin(x * 0.35 + y * 0.2) * (height * 0.18);
    position.setZ(i, Math.max(0.05, ridge + 1.2));
  }
  geometry.computeVertexNormals();
  return geometry;
}

const Hills: React.FC<{ color: string; position: [number, number, number]; scale?: number; seed: number }> = ({
  color,
  position,
  scale = 1,
  seed,
}) => {
  const geometry = useMemo(() => makeHillGeometry(46, 18, 36, 3.4, seed), [seed]);
  return (
    <mesh geometry={geometry} position={position} rotation={[-Math.PI / 2.35, 0, 0]} scale={scale}>
      <meshLambertMaterial color={color} />
    </mesh>
  );
};

const Field: React.FC = () => {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(90, 48, 24, 12);
    const position = g.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const y = position.getY(i);
      position.setZ(i, Math.sin(x * 0.22) * 0.18 + Math.cos(y * 0.3) * 0.12);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, -4]}>
      <meshLambertMaterial color="#7ea03a" />
    </mesh>
  );
};

const Grove: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const layouts = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => ({
        x: -22 + (index % 12) * 3.8 + ((index * 17) % 7) * 0.18,
        z: -6 - Math.floor(index / 12) * 4.4 - ((index * 13) % 5) * 0.3,
        scale: 0.55 + ((index * 9) % 8) * 0.08,
        phase: index * 0.37,
      })),
    []
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    layouts.forEach((item, index) => {
      const sway = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.7 + item.phase) * 0.04;
      dummy.position.set(item.x, item.scale * 0.55 - 1.05, item.z);
      dummy.rotation.set(0, sway, sway * 0.4);
      dummy.scale.set(item.scale, item.scale * 1.6, item.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(index, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, layouts.length]}>
      <coneGeometry args={[0.42, 1.5, 6]} />
      <meshLambertMaterial color="#1f4a2d" />
    </instancedMesh>
  );
};

const Village: React.FC = () => {
  const houses = useMemo(
    () => [
      { x: -6.4, z: -9.2, w: 1.4, h: 1.1, d: 1.1, color: '#efe3c8' },
      { x: -4.6, z: -10.4, w: 1.8, h: 1.35, d: 1.2, color: '#f4ead2' },
      { x: -2.4, z: -9.6, w: 2.2, h: 1.55, d: 1.4, color: '#f7f0dc' },
      { x: 0.2, z: -11.2, w: 1.5, h: 1.2, d: 1.1, color: '#ead9b4' },
      { x: 2.4, z: -9.8, w: 1.9, h: 1.4, d: 1.25, color: '#f1e4c4' },
    ],
    []
  );

  return (
    <group>
      {houses.map((house) => (
        <group key={`${house.x}-${house.z}`} position={[house.x, -0.4, house.z]}>
          <mesh position={[0, house.h / 2, 0]}>
            <boxGeometry args={[house.w, house.h, house.d]} />
            <meshLambertMaterial color={house.color} />
          </mesh>
          <mesh position={[0, house.h + 0.22, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[house.w * 0.72, 0.55, 4]} />
            <meshLambertMaterial color="#c4453c" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const Clouds: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current || reducedMotion) return;
    group.current.children.forEach((child, index) => {
      child.position.x += Math.sin(state.clock.elapsedTime * 0.08 + index) * 0.002;
    });
  });

  const clouds = [
    { x: -8, y: 6.4, z: -18, s: 2.4 },
    { x: -1, y: 7.2, z: -22, s: 3.1 },
    { x: 7, y: 6.8, z: -20, s: 2.6 },
    { x: 12, y: 8, z: -26, s: 3.4 },
  ];

  return (
    <group ref={group}>
      {clouds.map((cloud) => (
        <mesh key={`${cloud.x}-${cloud.z}`} position={[cloud.x, cloud.y, cloud.z]}>
          <sphereGeometry args={[cloud.s, 10, 10]} />
          <meshLambertMaterial color="#f7fbff" transparent opacity={0.42} />
        </mesh>
      ))}
    </group>
  );
};

const DustMotes: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(240);
    for (let i = 0; i < 80; i += 1) {
      data[i * 3] = (Math.random() - 0.5) * 28;
      data[i * 3 + 1] = Math.random() * 8;
      data[i * 3 + 2] = -4 - Math.random() * 18;
    }
    return data;
  }, []);

  useFrame((state) => {
    if (!points.current || reducedMotion) return;
    points.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.08;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f4e3b2" size={0.045} transparent opacity={0.45} />
    </points>
  );
};

const World: React.FC<SceneProps> = ({ reducedMotion }) => {
  const world = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!world.current) return;
    const targetY = reducedMotion ? 0 : state.pointer.x * 0.09;
    const targetX = reducedMotion ? 0 : -state.pointer.y * 0.035;
    world.current.rotation.y = THREE.MathUtils.lerp(world.current.rotation.y, targetY, 0.045);
    world.current.rotation.x = THREE.MathUtils.lerp(world.current.rotation.x, targetX, 0.045);
  });

  return (
    <>
      <color attach="background" args={['#9ec8e6']} />
      <fog attach="fog" args={['#c9dff0', 14, 48]} />
      <hemisphereLight args={['#fff4d6', '#4a6a3a', 0.85]} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.35}
        color="#ffe3a3"
      />
      <ambientLight intensity={0.32} />
      <mesh position={[14, 9.5, -20]}>
        <sphereGeometry args={[1.35, 24, 24]} />
        <meshBasicMaterial color="#ffd27a" />
      </mesh>
      <group ref={world}>
        <Hills color="#6d8f78" position={[0, 1.6, -28]} seed={4} />
        <Hills color="#3f5f4a" position={[4, 0.2, -22]} scale={0.82} seed={11} />
        <Hills color="#2f4c3c" position={[-6, -0.4, -18]} scale={0.7} seed={19} />
        <Field />
        <Village />
        <Grove reducedMotion={reducedMotion} />
        <Clouds reducedMotion={reducedMotion} />
        <DustMotes reducedMotion={reducedMotion} />
      </group>
    </>
  );
};

type MaharashtraCanvasProps = SceneProps & {
  inView?: boolean;
};

export const MaharashtraCanvas: React.FC<MaharashtraCanvasProps> = ({ reducedMotion, inView = true }) => {
  const visible = usePageVisible();

  return (
    <Canvas
      camera={{ position: [0, 2.4, 11.5], fov: 42, near: 0.1, far: 80 }}
      dpr={[1, 1.25]}
      frameloop={visible && inView && !reducedMotion ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <World reducedMotion={reducedMotion} />
    </Canvas>
  );
};

export default MaharashtraCanvas;
