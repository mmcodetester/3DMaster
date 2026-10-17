import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.threedmaster.og',
  appName: '3DMaster',
  webDir: 'dist',
   plugins: {
    PushNotifications: { presentationOptions: [] },
    LocalNotifications: { smallIcon: 'ic_chat_notification', iconColor: '#3348A6' },
    NativeAudio: {
      hls: false
    }
  }
};

export default config;
