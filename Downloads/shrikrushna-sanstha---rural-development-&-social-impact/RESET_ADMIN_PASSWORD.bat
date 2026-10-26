@echo off
setlocal

:: 1. Navigate to script directory (project root)
cd /d "%~dp0"

echo ========================================================================
echo  SHRIKRUSHNA SANSKRUTIK VA GRAMIN VIKAS SANSTHA, NADARPUR
echo  Admin Password Reset Utility
echo ========================================================================
echo.

:: 2. Locate PHP Executable
set "PHP_EXE="
if exist "C:\tools\php8.4\php.exe" set "PHP_EXE=C:\tools\php8.4\php.exe"
if "%PHP_EXE%"=="" (
    where php >nul 2>&1
    if not errorlevel 1 set "PHP_EXE=php"
)

if "%PHP_EXE%"=="" (
    echo [ERROR] PHP was not found at C:\tools\php8.4\php.exe or on system PATH.
    echo Please verify PHP installation.
    pause
    exit /b 1
)

echo Using PHP: %PHP_EXE%
echo.

:: 3. Run interactive password reset script
"%PHP_EXE%" backend-php-mysql\bin\set_admin_password.php

echo.
pause
