# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite application called "manor-react" that serves as a digital asset hub with Worldcoin integration. The project uses TailwindCSS for styling and provides a clean framework for web3 applications.

## Key Commands

### Development
- `npm run dev` - Start development server (hosts on 0.0.0.0)
- `npm run build` - Build the application (runs TypeScript check first)
- `npm run preview` - Preview the production build

### Code Quality
- `npm run lint` - Run ESLint on the codebase
- `npm run format` - Format code with Prettier (tab width: 4)
- `npm run type` - Generate TypeScript types from ABI files using typechain

### Backend Operations (cmd directory)
- `npm run up` - Build and upload/deploy
- `npm run web` - Run web server
- `npm run proto` - Run proto script

## Architecture

### Frontend Structure (`src/`)
- **Components**: Main app components include `App.tsx`, `Mine.tsx`, `Login.tsx` providing basic app structure
- **Utils**: Split into two chain utility directories (`chain/` and `chain2/`) containing blockchain interaction logic
- **Types**: Custom TypeScript definitions in `@types/` directory
- **ABI**: Smart contract ABIs for Permit2 (basic framework for future contracts)
- **i18n**: Internationalization support with English and Chinese locales

### Backend Structure (`cmd/`)
- Separate Node.js/Express server with TypeScript
- Upload, web server, and protocol scripts
- Static assets for the application

### Key Dependencies
- **Blockchain**: `viem` for Ethereum interactions, `@uniswap/permit2-sdk`
- **UI**: `@worldcoin/mini-apps-ui-kit-react`, `@worldcoin/minikit-js`
- **Framework**: React 18 with Vite and TailwindCSS v4
- **Internationalization**: `i18next` and `react-i18next`

### Configuration Notes
- Uses modern Vite + React + SWC setup for fast development
- ESLint configured with TypeScript and React plugins
- Prettier configured with 4-space tabs
- TypeScript strict mode enabled with bundler module resolution
- TailwindCSS v4 integrated via Vite plugin

### Development Workflow
1. The project has a dual structure: main React app and separate `cmd/` backend
2. Use `npm run dev` for frontend development
3. Backend operations are handled through the `cmd/` directory scripts
4. Always run `npm run lint` before committing changes
5. Type generation from ABIs should be done with `npm run type` when contract interfaces change

### Project Structure Notes
- This is a clean framework project converted from a previous Piggy-related application
- The blockchain utilities are simplified to provide basic wallet connection and transaction functionality
- The UI components are minimal and ready for future feature development
- Internationalization is set up for English and Chinese languages
