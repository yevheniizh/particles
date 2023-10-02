import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import {Particles} from './Particles'

export default function App() {
  return (
    <Canvas>
      <ambientLight intensity={0.1} />
      <directionalLight />
      <Particles />
      <OrbitControls />
    </Canvas>
  )
}
