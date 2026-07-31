@echo off
setlocal
cd /d "%~dp0"
echo.
echo =============================================
echo  Gwen et Nicolas - Deploiement automatique
echo =============================================
echo.
where firebase >nul 2>nul
if errorlevel 1 (
  echo Firebase CLI absent. Installation automatique...
  where npm >nul 2>nul
  if errorlevel 1 (
    echo ERREUR : Node.js doit etre installe depuis https://nodejs.org/
    pause
    exit /b 1
  )
  call npm install -g firebase-tools
  if errorlevel 1 goto error
)
echo Connexion a Firebase...
call firebase login
if errorlevel 1 goto error
echo Selection du projet plaisir-malin-et-coquin...
call firebase use plaisir-malin-et-coquin
if errorlevel 1 goto error
echo Deploiement des regles et du site...
call firebase deploy --only firestore:rules,hosting
if errorlevel 1 goto error
echo.
echo TERMINE. Copiez la ligne Hosting URL affichee ci-dessus.
pause
exit /b 0
:error
echo.
echo Une erreur est survenue. Copiez le message affiche dans cette fenetre.
pause
exit /b 1
