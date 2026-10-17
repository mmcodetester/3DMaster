# Frontend and Android deployment

Render static site: https://threedmaster.onrender.com

- Branch: main
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Current Render Node runtime: 22.22.0 (compatible with Vite 7).
- Configure production VITE_API_URL and VITE_SOCKET_URL for the deployed backend. Never put server Firebase credentials in frontend environment variables.

The previous empty build command and publish directory `build` served stale compiled assets even when a new source commit was reported live. Settings were corrected on 2026-10-17 and the rebuilt asset version and live Reply/Pin/Attachment controls were verified in the browser.

For Android, retain android/app/google-services.json locally, run `npm run sync:android`, then assemble the APK using JDK 21. Official Capacitor Filesystem/Share plugins are required for native attachment Save/Share. Install the new APK over the existing app; refreshing the web page does not install native plugins.

Reply/Seen/Pin/Attachment backend tables must exist before publishing this client. Attachments are private, limited to 10 MB/file and 100 MB stored/account; local received attachment cache is capped at 50 MB/account. Existing notifications, typing, and offline chat behavior are retained. Samsung/Redmi file picking and native sharing require real-device verification.
