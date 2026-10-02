@echo off
setlocal enabledelayedexpansion
title JOOBAPP - Deploy to GitHub & Vercel
color 0b

echo ========================================================
echo        JOOBAPP DEPLOYMENT (GITHUB ^& VERCEL)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/4] Mengecek perubahan file (Git Status)...
git status --short
echo.

set "DEFAULT_MSG=Update %date% %time%"
set /p COMMIT_MSG="Masukkan pesan commit (tekan Enter untuk default: %DEFAULT_MSG%): "
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=%DEFAULT_MSG%"

echo.
echo [2/4] Menjalankan Build Test (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo ========================================================
    echo [ERROR] Build gagal! Proses upload dibatalkan.
    echo Perbaiki error build terlebih dahulu sebelum deploy.
    echo ========================================================
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] Mengupload ke GitHub...
git add .
git commit -m "%COMMIT_MSG%"
git push origin main
if %errorlevel% neq 0 (
    color 0e
    echo.
    echo [WARNING] Git push ke GitHub mengalami kendala atau tidak ada perubahan baru.
    echo Tetap melanjutkan ke Vercel deploy...
) else (
    echo [OK] Berhasil push ke GitHub!
)

echo.
echo [4/4] Mengupload ke Vercel Production...
call npx vercel --prod --yes
if %errorlevel% neq 0 (
    color 0c
    echo.
    echo ========================================================
    echo [ERROR] Deploy ke Vercel gagal!
    echo ========================================================
    echo.
    pause
    exit /b %errorlevel%
)

color 0a
echo.
echo ========================================================
echo [SUKSES] Semua proses berhasil!
echo Website Live: https://joobapp.vercel.app
echo Repository:   https://github.com/sipencuri04/joobapp
echo ========================================================
echo.
pause
