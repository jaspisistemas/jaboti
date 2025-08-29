@echo off
echo ========================================
echo    JABOTI - Criar Usuario Admin
echo ========================================
echo.

echo Escolha uma opcao:
echo 1. Usuario admin padrao (admin/admin123)
echo 2. Usuario admin personalizado
echo 3. Sair
echo.

set /p choice="Digite sua escolha (1-3): "

if "%choice%"=="1" goto default
if "%choice%"=="2" goto custom
if "%choice%"=="3" goto exit
goto invalid

:default
echo.
echo Criando usuario admin padrao...
node scripts/create-admin-user.js
goto end

:custom
echo.
echo Criando usuario admin personalizado...
node scripts/create-custom-admin.js
goto end

:invalid
echo.
echo Opcao invalida!
goto end

:exit
echo.
echo Saindo...
goto end

:end
echo.
echo Pressione qualquer tecla para sair...
pause >nul
