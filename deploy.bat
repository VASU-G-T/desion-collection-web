@echo off
set NODE_OPTIONS=--use-system-ca
echo Starting Vercel Production Deployment...
echo If prompted, complete Vercel login in your browser.
echo.
npx vercel --prod
echo.
echo Deployment process finished.
pause

