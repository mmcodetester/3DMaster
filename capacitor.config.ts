import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.threedmaster.og',
  appName: '3DMaster',
  webDir: 'dist',
   plugins: {
    NativeAudio: {
      hls: false
    }
  }
};

export default config;
