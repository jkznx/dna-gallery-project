@echo off
setlocal
set "NEXT_TELEMETRY_DISABLED=1"
cd /d "%~dp0"
set "GALLERY_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  set "GALLERY_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if not exist "%GALLERY_NODE%" set "GALLERY_NODE=%ProgramFiles%\nodejs\node.exe"
)
if "%~1"=="dev" goto dev
if "%~1"=="start" goto start
if "%~1"=="build" goto build
if "%~1"=="typecheck" goto typecheck
if "%~1"=="test" goto test
if "%~1"=="npm" goto npm
echo Usage: run-local.cmd dev ^| start ^| build ^| typecheck ^| test ^| npm ^<npm args^>
exit /b 1
:dev
"%GALLERY_NODE%" node_modules\next\dist\bin\next dev --hostname 127.0.0.1
exit /b %errorlevel%
:start
"%GALLERY_NODE%" node_modules\next\dist\bin\next start --hostname 127.0.0.1
exit /b %errorlevel%
:build
"%GALLERY_NODE%" node_modules\next\dist\bin\next build
exit /b %errorlevel%
:typecheck
"%GALLERY_NODE%" node_modules\typescript\bin\tsc --noEmit
exit /b %errorlevel%
:test
"%GALLERY_NODE%" --experimental-strip-types --test tests\content.test.ts tests\helix-motion.test.ts tests\ladder.test.ts tests\travel.test.ts tests\artwork-graph.test.ts tests\discovery.test.ts tests\helix3d-math.test.ts tests\helix3d-layout.test.ts
exit /b %errorlevel%
:npm
rem Run the npm that ships with the same Node, for this process only (no global PATH change).
shift
set "NODE_DIR="
if /i "%GALLERY_NODE%"=="node" (for /f "delims=" %%I in ('where node') do if not defined NODE_DIR set "NODE_DIR=%%~dpI") else (for %%I in ("%GALLERY_NODE%") do set "NODE_DIR=%%~dpI")
set "NPM_CLI="
if exist "%NODE_DIR%node_modules\npm\bin\npm-cli.js" set "NPM_CLI=%NODE_DIR%node_modules\npm\bin\npm-cli.js"
if not defined NPM_CLI if exist "%NODE_DIR%..\lib\node_modules\npm\bin\npm-cli.js" set "NPM_CLI=%NODE_DIR%..\lib\node_modules\npm\bin\npm-cli.js"
if not defined NPM_CLI (
  echo npm not found next to Node in "%NODE_DIR%". Use a Node distribution that bundles npm.
  exit /b 1
)
set "PATH=%NODE_DIR%;%PATH%"
"%GALLERY_NODE%" "%NPM_CLI%" %1 %2 %3 %4 %5 %6 %7 %8 %9
exit /b %errorlevel%