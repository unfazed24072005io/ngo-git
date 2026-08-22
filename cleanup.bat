@echo off
echo ========================================
echo  FINAL CLEANUP AND FIX
echo ========================================

echo 1. Removing both lock files...
del yarn.lock 2>nul
del package-lock.json 2>nul

echo 2. Removing node_modules...
rmdir /s node_modules 2>nul

echo 3. Clear caches...
npm cache clean --force
yarn cache clean 2>nul

echo 4. Installing ONLY with npm (no yarn)...
call npm install --legacy-peer-deps

echo 5. Installing missing SDK 57 packages...
call npm install expo-document-picker@~57.0.1 --legacy-peer-deps
call npm install expo-image-picker@~57.0.12 --legacy-peer-deps
call npm install expo-linear-gradient@~57.0.1 --legacy-peer-deps
call npm install expo-sharing@~57.0.14 --legacy-peer-deps
call npm install expo-status-bar@~57.0.1 --legacy-peer-deps
call npm install react-native@0.86.2 --legacy-peer-deps
call npm install react-dom@19.2.3 --legacy-peer-deps
call npm install react-native-gesture-handler@~2.32.0 --legacy-peer-deps
call npm install react-native-safe-area-context@~5.7.0 --legacy-peer-deps
call npm install react-native-screens@~4.26.0 --legacy-peer-deps
call npm install react-native-web@^0.21.2 --legacy-peer-deps

echo 6. Running expo install fix...
call npx expo install --fix

echo 7. Running expo doctor...
call npx expo-doctor

pause