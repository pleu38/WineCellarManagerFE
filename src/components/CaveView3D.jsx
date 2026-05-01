import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { X } from 'lucide-react'
import * as THREE from 'three'

useGLTF.preload('/models/WineCellar_Clayette.glb')
useGLTF.preload('/models/WineCellar_Bottle.glb')

/* ── Shelf ───────────────────────────────────────────────── */

function Shelf({ position = [0, 0, 0] }) {
  const { scene } = useGLTF('/models/WineCellar_Clayette.glb')
  const woodTexture = useTexture({
    map:          '/textures/Wood093_4K-JPG_Color.jpg',
    normalMap:    '/textures/Wood093_4K-JPG_NormalGL.jpg',
    roughnessMap: '/textures/Wood093_4K-JPG_Roughness.jpg',
  })
  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (!child.isMesh) return
      ;[woodTexture.map, woodTexture.normalMap, woodTexture.roughnessMap].forEach((t) => {
        if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2) }
      })
      child.castShadow = true
      child.receiveShadow = true
      child.material = new THREE.MeshStandardMaterial({
        map:          woodTexture.map,
        normalMap:    woodTexture.normalMap,
        roughnessMap: woodTexture.roughnessMap,
        roughness: 0.8,
        metalness: 0.1,
      })
    })
    return clone
  }, [scene, woodTexture])
  return <primitive object={model} position={position} rotation={[-Math.PI / 2, 0, 0]} />
}

/* ── Bottle ──────────────────────────────────────────────── */

function Bottle({ position = [-0.15, 0.05, -0.05], rotation = [0, 0, Math.PI / 2], rack = 0, row = 0, index = 0, highlightId }) {
  const { scene } = useGLTF('/models/WineCellar_Bottle.glb')
  const greyTexture = useTexture({
    map:          '/textures/Fabric082A_2K-PNG_Color.png',
    normalMap:    '/textures/Fabric082A_2K-PNG_NormalGL.png',
    roughnessMap: '/textures/Fabric082A_2K-PNG_Roughness.png',
  })
  const matsRef = useRef([])
  const isHighlight =
    highlightId != null &&
    Number(highlightId.rack)  === rack &&
    Number(highlightId.row)   === row  &&
    Number(highlightId.index) === index

  useFrame(({ clock }) => {
    if (!matsRef.current.length) return
    const intensity = isHighlight ? Math.abs(Math.sin(clock.getElapsedTime() * 4)) * 2 : 0
    for (const mat of matsRef.current) {
      if (isHighlight) mat.emissive.set(1, 0, 0)
      else mat.emissive.set(0, 0, 0)
      mat.emissiveIntensity = intensity
    }
  })

  const model = useMemo(() => {
    const clone = scene.clone(true)
    const mats = []
    clone.traverse((child) => {
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true
      child.material = new THREE.MeshStandardMaterial({
        map:          greyTexture.map,
        normalMap:    greyTexture.normalMap,
        roughnessMap: greyTexture.roughnessMap,
        roughness: 0.8,
        metalness: 0.1,
      })
      mats.push(child.material)
    })
    matsRef.current = mats
    return clone
  }, [scene, greyTexture])

  return (
    <group position={position} rotation={rotation} scale={0.001}>
      <primitive object={model} />
    </group>
  )
}

/* ── BottleGrid ──────────────────────────────────────────── */

function BottleGrid({ offsetX = 0, offsetY = 0, offsetZ = 0, rackNumber = 0, highlightId }) {
  const layers = [
    { y: 0.05,  leftZ: -0.05,  rightZ: -0.1   },
    { y: 0.085, leftZ: -0.11,  rightZ: -0.025  },
    { y: 0.12,  leftZ: -0.05,  rightZ: -0.1   },
    { y: 0.155, leftZ: -0.11,  rightZ: -0.025  },
  ]
  const bottlesPerSide = 4
  const spacing = 0.12
  return (
    <>
      {layers.flatMap((layer, li) => [
        ...Array.from({ length: bottlesPerSide }, (_, i) => (
          <Bottle key={`L${li}-${i}`}
            position={[-0.15 + offsetX, layer.y + offsetY, layer.leftZ - i * spacing + offsetZ]}
            rotation={[0, 0, Math.PI / 2]}
            rack={rackNumber} row={li + 1} index={i + 1}
            highlightId={highlightId}
          />
        )),
        ...Array.from({ length: bottlesPerSide }, (_, i) => (
          <Bottle key={`R${li}-${i}`}
            position={[-0.385 + offsetX, layer.y + offsetY, layer.rightZ - i * spacing + offsetZ]}
            rotation={[0, 0, -Math.PI / 2]}
            rack={rackNumber} row={li + 1} index={i + 1 + bottlesPerSide}
            highlightId={highlightId}
          />
        )),
      ])}
    </>
  )
}

/* ── MidRackBottleGrid ───────────────────────────────────── */

function MidRackBottleGrid({ offsetX = 0, offsetY = 0, offsetZ = 0, rackNumber = 0, highlightId }) {
  const layers = [
    { y: 0.05,  leftPos: [-0.03,-0.125,-0.21,-0.295,-0.38,-0.465], rightPos: [-0.075,-0.17,-0.255,-0.335,-0.425] },
    { y: 0.1,   leftPos: [-0.075,-0.17,-0.255,-0.335,-0.425],       rightPos: [-0.03,-0.125,-0.21,-0.295,-0.38,-0.465] },
    { y: 0.15,  leftPos: [-0.03,-0.125,-0.21,-0.295,-0.38,-0.465], rightPos: [-0.075,-0.17,-0.255,-0.335,-0.425] },
  ]
  return (
    <>
      {layers.flatMap((layer, li) => [
        ...layer.leftPos.map((z, i) => (
          <Bottle key={`ML${li}-${i}`}
            position={[-0.15 + offsetX, layer.y + offsetY, z + offsetZ]}
            rotation={[0, 0, Math.PI / 2]}
            rack={rackNumber} row={li + 1} index={i + 1}
            highlightId={highlightId}
          />
        )),
        ...layer.rightPos.map((z, i) => (
          <Bottle key={`MR${li}-${i}`}
            position={[-0.385 + offsetX, layer.y + offsetY, z + offsetZ]}
            rotation={[0, 0, -Math.PI / 2]}
            rack={rackNumber} row={li + 1} index={i + 1 + layer.leftPos.length}
            highlightId={highlightId}
          />
        )),
      ])}
    </>
  )
}

/* ── WineRack / MidWineRack ──────────────────────────────── */

function WineRack({ position = [0, 0, 0], rackNumber = 0, highlightId }) {
  return (
    <>
      <Shelf position={position} />
      <BottleGrid offsetX={position[0]} offsetY={position[1]} offsetZ={position[2]} rackNumber={rackNumber} highlightId={highlightId} />
    </>
  )
}

function MidWineRack({ position = [0, 0, 0], rackNumber = 0, highlightId }) {
  return (
    <>
      <Shelf position={position} />
      <MidRackBottleGrid offsetX={position[0]} offsetY={position[1]} offsetZ={position[2]} rackNumber={rackNumber} highlightId={highlightId} />
    </>
  )
}

/* ── CameraZoom ──────────────────────────────────────────── */

function CameraZoom() {
  const { camera } = useThree()
  const progress = useRef(0)
  useFrame(() => {
    if (progress.current >= 1) return
    progress.current += 0.018
    const p = progress.current
    camera.position.lerpVectors(
      new THREE.Vector3(3.4, 2.4, 2.8),
      new THREE.Vector3(0.55, 0.55, 1.1),
      p
    )
    camera.lookAt(0, -0.35, 0)
    camera.updateProjectionMatrix()
  })
  return null
}

/* ── Modal 3D ────────────────────────────────────────────── */

export function CaveView3D({ open, onClose, highlightBottle }) {
  if (!open) return null
  return (
    <div className="modal-overlay modal-overlay-3d" onClick={onClose}>
      <div className="modal-card modal-card-3d" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderTopColor: '#8b1538' }}>
          <div>
            <div className="modal-title">Visualisation 3D — Cave à vin</div>
            <div className="modal-sub">
              {highlightBottle
                ? `Clayette ${highlightBottle.rack} · Rangée ${highlightBottle.row} · Position ${highlightBottle.index} — clignote en rouge`
                : 'Faites tourner la scène avec la souris'}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-3d-canvas">
          <Canvas
            shadows
            camera={{ position: [2.2, 1.2, 2.2], fov: 55, near: 0.1, far: 1000 }}
            gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
            style={{ background: 'transparent' }}
          >
            <CameraZoom />
            <ambientLight intensity={0.45} />
            <directionalLight position={[3, 3, 2]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
            <pointLight position={[-2, 1, -1]} intensity={1} />
            <spotLight position={[0, 4, 2]} angle={0.4} penumbra={0.8} intensity={0.5} castShadow color="#ffffff" />
            <Suspense fallback={null}>
              <WineRack    position={[0,  0,    0]} rackNumber={1} highlightId={highlightBottle} />
              <MidWineRack position={[0, -0.18, 0]} rackNumber={2} highlightId={highlightBottle} />
              <MidWineRack position={[0, -0.36, 0]} rackNumber={3} highlightId={highlightBottle} />
              <MidWineRack position={[0, -0.54, 0]} rackNumber={4} highlightId={highlightBottle} />
              <MidWineRack position={[0, -0.72, 0]} rackNumber={5} highlightId={highlightBottle} />
              <WineRack    position={[0, -0.9,  0]} rackNumber={6} highlightId={highlightBottle} />
            </Suspense>
            <OrbitControls
              target={[0, -0.4, 0]}
              enableDamping
              dampingFactor={0.05}
              minDistance={0.8}
              maxDistance={4}
              maxPolarAngle={Math.PI / 2}
            />
          </Canvas>
        </div>
      </div>
    </div>
  )
}
