# Cloud Deck

A modern, real-time web application built with Next.js that leverages WebSocket connections through Socket.IO. The project features a responsive UI using Tailwind CSS and Headless UI components, with smooth animations powered by Framer Motion. The application uses Zustand for state management and includes TypeScript for enhanced type safety.

## Features

- Real-time collaboration using Socket.IO
- Modern UI components with Headless UI and Hero Icons
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Type-safe development with TypeScript
- State management using Zustand
- Server-side rendering with Next.js

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd cloud-deck
```

2. Install dependencies

```bash
npm install
```

## Development

To start the development server:

```bash
npm run dev:server
```

The application will be available at available at `http://localhost:3000`

## Build of Production

```bash
npm run build
npm run start
```

## Contributing

We welcome contributions to Cloud Deck! Here's how you can help:

### Development Environment Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/cloud-deck.git`
3. Create a new branch for your feature/fix: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Start the development server: `npm run dev:server`

### Coding Standards

- Use TypeScript for all new code
- Follow the existing code style and formatting
- Write meaningful commit messages following conventional commits format
- Add appropriate comments and documentation
- Ensure all tests pass before submitting

### Pull Request Process

1. Update the README.md with details of changes if needed
2. Ensure your code follows our coding standards
3. Create a Pull Request with a clear title and description
4. Link any related issues in your PR description
5. Wait for review and address any feedback

### Branch Protection Rules and Naming Convention

We follow a structured branching strategy to maintain code quality and streamline the development process:

- `main` - Production-ready code, protected branch
- Feature branches: `feature/your-feature-name`
- Bug fixes: `fix/bug-description`
- Hotfixes: `hotfix/issue-description`

Branch protection rules:
- Direct pushes to `main` branch are not allowed
- All changes must go through pull requests
- Pull requests require at least one review approval
- Status checks must pass before merging

## Tech Stack

- Next.js 15.1.7
- React 19
- Socket.IO
- TypeScript
- Tailwind CSS
- Headless UI
- Framer Motion
- Zustand

## License

Private Repository - All rights reserved.
