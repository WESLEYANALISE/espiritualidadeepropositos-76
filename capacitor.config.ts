import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.48a06463666541ff9f142ce037a9e094',
  appName: 'espiritualidadeepropositos-76',
  webDir: 'dist',
  server: {
    url: 'https://48a06463-6665-41ff-9f14-2ce037a9e094.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Browser: {
      presentationStyle: 'popover'
    }
  }
};

export default config;