import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, useTexture, OrbitControls, Bounds, Html } from '@react-three/drei'
import * as THREE from 'three'

useGLTF.preload('/models/WineCellar_Clayette.glb')
useGLTF.preload('/models/WineCellar_Bottle.glb')

function Scene({ count }) {
  const { scene: claySrc } = useGLTF('/models/WineCellar_Clayette.glb')
  const { scene: bottleSrc } = useGLTF('/models/WineCellar_Bottle.glb')

  const [colorMap, normalMap, roughMap] = useTexture([
    '/textures/Wood093_4K-JPG_Color.jpg',
    '/textures/Wood093_4K-JPG_NormalGL.jpg',
    '/textures/Wood093_4K-JPG_Roughness.jpg',
  ])

  const clayette = useMemo(() => {
    const clone = claySrc.clone(true)
    ;[colorMap, normalMap, roughMap].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(2, 2)
    })
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: colorMap,
          normalMap,
          roughnessMap: roughMap,
          roughness: 0.9,
          metalness: 0.05,
        })
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [claySrc, colorMap, normalMap, roughMap])

  const { clayTop, spacing } = useMemo(() => {
    const clayBox = new THREE.Box3().setFromObject(clayette)
    const bottleBox = new THREE.Box3().setFromObject(bottleSrc)
    const bw = bottleBox.getSize(new THREE.Vector3()).x
    return {
      clayTop: clayBox.max.y,
      spacing: Math.max(bw * 1.1, 0.09),
    }
  }, [clayette, bottleSrc])

  const bottles = useMemo(() => {
    const n = Math.min(count, 12)
    const cols = Math.min(n, 6)
    return Array.from({ length: n }).map((_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const clone = bottleSrc.clone(true)
      clone.traverse((c) => { if (c.isMesh) c.castShadow = true })
      return {
        clone,
        pos: [
          (col - (cols - 1) / 2) * spacing,
          clayTop,
          (row - 0.5) * spacing * 1.6,
        ],
      }
    })
  }, [bottleSrc, count, clayTop, spacing])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[2, 5, 3]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-3, 2, -1]} intensity={0.25} />
      <Bounds fit clip observe margin={1.5}>
        <group>
          <primitive object={clayette} receiveShadow />
          {bottles.map(({ clone, pos }, i) => (
            <primitive key={i} object={clone} position={pos} />
          ))}
        </group>
      </Bounds>
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 1.9} />
    </>
  )
}

function Loader() {
  return (
    <Html center>
      <div style={{ color: '#9d8e87', fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
        Chargement 3D…
      </div>
    </Html>
  )
}

export function CaveView3D({ quantite = 6 }) {
  return (
    <div style={{
      width: '100%',
      height: 320,
      borderRadius: 12,
      overflow: 'hidden',
      background: 'linear-gradient(160deg, #1a0d10 0%, #0e0608 100%)',
      marginTop: 12,
    }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 3.5], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={<Loader />}>
          <Scene count={quantite} />
        </Suspense>
      </Canvas>
    </div>
  )
}
