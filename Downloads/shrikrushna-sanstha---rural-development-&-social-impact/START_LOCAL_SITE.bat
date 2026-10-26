@echo off
title Shrikrushna Sanstha - Local Environment Launcher

echo ================================================================
echo    SHRIKRUSHNA SANSTHA - LOCAL ENVIRONMENT LAUNCHER
echo ================================================================
echo.

:: 1. Navigate to Project Directory Safely
pushd "%~dp0"
echo [1/4] Project Directory: Ready
echo.

:: 2. Locate PHP Executable
set "PHP_EXE="
if exist "C:\tools\php8.4\php.exe" set "PHP_EXE=C:\tools\php8.4\php.exe"
if "%PHP_EXE%"=="" (
    where php >nul 2>&1
    if not errorlevel 1 set "PHP_EXE=php"
)

if "%PHP_EXE%"=="" goto :err_no_php
echo [2/4] PHP Executable found: %PHP_EXE%
goto :check_mysql

:err_no_php
echo [ERROR] PHP was not found at C:\tools\php8.4\php.exe or on system PATH.
echo Please ensure PHP is installed in C:\tools\php8.4\
echo.
pause
popd
exit /b 1

:check_mysql
:: 3. Check MySQL Service
echo [3/4] Checking MySQL Service...
sc query MySQL84 | find "RUNNING" >nul 2>&1
if not errorlevel 1 goto :mysql_ok

echo       MySQL service MySQL84 is not running. Starting it now...
net start MySQL84 >nul 2>&1
if not errorlevel 1 goto :mysql_ok
echo       [NOTE] Could not start MySQL84 automatically.
echo       If you see database connection errors, run CMD as Administrator and type:
echo         net start MySQL84
goto :check_node

:mysql_ok
echo       MySQL service MySQL84 is running.

:check_node
echo.
:: 4. Verify Node.js and npm
where npm >nul 2>&1
if errorlevel 1 goto :err_no_npm
echo [4/4] Node.js and npm verified.
echo.
goto :check_cf

:err_no_npm
echo [ERROR] npm was not found. Please install Node.js from https://nodejs.org/
echo.
pause
popd
exit /b 1

:check_cf
:: Locate Cloudflared
set "CLOUDFLARED_EXE="
if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" set "CLOUDFLARED_EXE=C:\Program Files (x86)\cloudflared\cloudflared.exe"
if "%CLOUDFLARED_EXE%"=="" (
    where cloudflared >nul 2>&1
    if not errorlevel 1 set "CLOUDFLARED_EXE=cloudflared"
)

echo ================================================================
echo Starting Services in Separate Windows...
echo ================================================================

:: Start PHP Backend Server on port 8088
echo Starting PHP Backend Server on 127.0.0.1:8088...
start "Shrikrushna PHP Backend - Port 8088" cmd /k ""%PHP_EXE%" -S 127.0.0.1:8088"

:: Brief pause to let PHP bind to port 8088
ping 127.0.0.1 -n 3 >nul

:: Start Vite Frontend Server on port 5173
echo Starting Vite Frontend on port 5173...
start "Shrikrushna Vite Frontend - Port 5173" cmd /k npm run dev

echo.
echo ----------------------------------------------------------------
echo LOCAL SERVICES RUNNING:
echo   - Website:     http://localhost:5173
echo   - Admin Panel: http://localhost:5173/admin
echo   - PHP API:     http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=officials
echo ----------------------------------------------------------------
echo.

if "%CLOUDFLARED_EXE%"=="" goto :no_tunnel

set /p START_TUNNEL="Do you want to start Cloudflare Quick Tunnel for remote/client review? (Y/N, default Y): "
if "%START_TUNNEL%"=="" set "START_TUNNEL=Y"
if /i not "%START_TUNNEL%"=="Y" goto :finish

echo Starting Cloudflare Tunnel...
start "Shrikrushna Cloudflare Tunnel" cmd /k ""%CLOUDFLARED_EXE%" tunnel --url http://localhost:5173"
echo.
echo Look at the "Shrikrushna Cloudflare Tunnel" window for your public *.trycloudflare.com link.
goto :finish

:no_tunnel
echo [NOTE] cloudflared is not installed. Cloudflare tunnel skipped.

:finish
echo.
echo ================================================================
echo All required services are launched!
echo Keep the opened service windows running while using the site.
echo To STOP a service, simply close its CMD window or press Ctrl+C.
echo ================================================================
echo.
pause
popd
