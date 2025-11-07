#!/bin/bash

echo "🚀 Setting up Solana Presale Dependencies..."
echo ""
echo "ℹ️  Solana dependencies are now included in package.json"
echo "ℹ️  Simply run 'npm install' in each directory"
echo ""

# Frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "✅ Frontend dependencies installed!"
echo ""

# Backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm install

echo "✅ Backend dependencies installed!"
echo ""

# Create .env files if they don't exist
echo "📝 Setting up environment files..."

# Frontend .env
if [ ! -f "../frontend/.env.production" ]; then
  echo "Creating frontend/.env.production..."
  cat > ../frontend/.env.production << EOF
# API Backend URL
VITE_API_URL=http://localhost:3001

# Solana Network (devnet | testnet | mainnet-beta)
VITE_SOLANA_NETWORK=devnet

# Presale wallet address (where payments are sent)
VITE_PRESALE_WALLET_ADDRESS=YOUR_SOLANA_WALLET_ADDRESS_HERE
EOF
  echo "✅ Created frontend/.env.production - PLEASE UPDATE WITH YOUR WALLET ADDRESS!"
else
  echo "⚠️  frontend/.env.production already exists - skipping"
fi

# Backend .env
if [ ! -f ".env" ]; then
  echo "Creating backend/.env..."
  cat > .env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Presale Configuration
PRESALE_WALLET_ADDRESS=YOUR_SOLANA_WALLET_ADDRESS_HERE
PRESALE_TOTAL_SUPPLY=1000
PRESALE_PRICE=0.1
EOF
  echo "✅ Created backend/.env - PLEASE UPDATE WITH YOUR WALLET ADDRESS!"
else
  echo "⚠️  backend/.env already exists - skipping"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get a Solana wallet from https://phantom.app/"
echo "2. Copy your wallet address"
echo "3. Update PRESALE_WALLET_ADDRESS in:"
echo "   - frontend/.env.production"
echo "   - backend/.env"
echo "4. Get devnet SOL from https://faucet.solana.com/"
echo "5. Run 'npm run dev' in frontend and 'node server.js' in backend"
echo ""
echo "📚 Read SOLANA_MIGRATION_GUIDE.md for detailed instructions"
echo ""
