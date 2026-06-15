import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

export const SCENE_DURATIONS: Record<string, number> = {
  intro: 5000,
  mobileMoney: 6000,
  trading: 6000,
  commission: 5500,
  kyc: 6500,
  outro: 5000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene1,
  mobileMoney: Scene2,
  trading: Scene3,
  commission: Scene4,
  kyc: Scene6,
  outro: Scene5,
};

const bgPositions = [
  { x: '-10%', y: '-10%', scale: 1, opacity: 0.4 },
  { x: '10%', y: '10%', scale: 1.2, opacity: 0.6 },
  { x: '-20%', y: '20%', scale: 0.8, opacity: 0.5 },
  { x: '20%', y: '-20%', scale: 1.5, opacity: 0.4 },
  { x: '-5%', y: '5%', scale: 1.1, opacity: 0.5 },
  { x: '0%', y: '0%', scale: 1.1, opacity: 0.3 },
];

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="w-full h-screen overflow-hidden relative" style={{ backgroundColor: 'var(--color-bg-dark)' }}>
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#020617]" />

        <motion.div
          className="absolute w-[80vw] h-[80vw] rounded-full blur-[100px] bg-primary/20 pointer-events-none"
          animate={bgPositions[sceneIndex] ?? bgPositions[0]}
          transition={{ duration: 3, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-0 bottom-0 w-[60vw] h-[60vw] rounded-full blur-[80px] bg-orange-600/10 pointer-events-none"
          animate={{ x: ['10%', '-10%', '0%'], y: ['-10%', '10%', '0%'], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="absolute inset-0 z-10">
        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
