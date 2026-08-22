@echo off
echo Starting Netlify Deployment...
echo Please follow the prompts below to select your site and deploy.
echo.
npx netlify deploy --prod
echo.
echo Deployment process finished.
pause
