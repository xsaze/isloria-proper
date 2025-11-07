@echo off
echo.
echo 🚀 Setting up Solana Presale Dependencies...
echo.
echo ℹ️  Solana dependencies are now included in package.json
echo ℹ️  Simply run 'npm install' in each directory
echo.

REM Frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo ✅ Frontend dependencies installed!
echo.

REM Backend dependencies
echo 📦 Installing backend dependencies...
cd ..\backend
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo ✅ Backend dependencies installed!
echo.

REM Create .env files if they don't exist
echo 📝 Setting up environment files...

REM Frontend .env
if not exist "..\frontend\.env.production" (
    echo Creating frontend/.env.production...
    (
        echo # API Backend URL
        echo VITE_API_URL=http://localhost:3001
        echo.
        echo # Solana Network ^(devnet ^| testnet ^| mainnet-beta^)
        echo VITE_SOLANA_NETWORK=devnet
        echo.
        echo # Presale wallet address ^(where payments are sent^)
        echo VITE_PRESALE_WALLET_ADDRESS=YOUR_SOLANA_WALLET_ADDRESS_HERE
    ) > ..\frontend\.env.production
    echo ✅ Created frontend/.env.production - PLEASE UPDATE WITH YOUR WALLET ADDRESS!
) else (
    echo ⚠️  frontend/.env.production already exists - skipping
)

REM Backend .env
if not exist ".env" (
    echo Creating backend/.env...
    (
        echo # Server Configuration
        echo PORT=3001
        echo NODE_ENV=development
        echo.
        echo # Solana Configuration
        echo SOLANA_NETWORK=devnet
        echo SOLANA_RPC_URL=https://api.devnet.solana.com
        echo.
        echo # Presale Configuration
        echo PRESALE_WALLET_ADDRESS=YOUR_SOLANA_WALLET_ADDRESS_HERE
        echo PRESALE_TOTAL_SUPPLY=1000
        echo PRESALE_PRICE=0.1
    ) > .env
    echo ✅ Created backend/.env - PLEASE UPDATE WITH YOUR WALLET ADDRESS!
) else (
    echo ⚠️  backend/.env already exists - skipping
)

echo.
echo ✨ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Get a Solana wallet from https://phantom.app/
echo 2. Copy your wallet address
echo 3. Update PRESALE_WALLET_ADDRESS in:
echo    - frontend/.env.production
echo    - backend/.env
echo 4. Get devnet SOL from https://faucet.solana.com/
echo 5. Run 'npm run dev' in frontend and 'node server.js' in backend
echo.
echo 📚 Read SOLANA_MIGRATION_GUIDE.md for detailed instructions
echo.
pause
