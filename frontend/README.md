# Educational Financial Management System - Frontend

A modern React-based frontend for managing educational institution finances. Built with TypeScript, Tailwind CSS, and Redux Toolkit.

## Features

- 🔐 Secure JWT-based authentication with refresh token mechanism
- 👥 Role-based access control (Admin, Accountant, Teacher)
- 📊 Interactive dashboard with charts and key metrics
- 📝 CRUD operations for students, fees, payments, and invoices
- 📱 Responsive design for mobile and desktop
- 🎨 Modern UI with Tailwind CSS
- 🔄 State management with Redux Toolkit
- 📋 Reusable components (DataTable, Form)

## Tech Stack

- React 18
- TypeScript
- Redux Toolkit
- React Router v6
- Axios
- Chart.js
- Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on http://localhost:8000

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── DataTable/      # Generic table with sorting and pagination
│   ├── Form/           # Reusable form component
│   └── Layout/         # App layout components
├── pages/              # Route components
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Students.tsx
│   └── ...
├── services/           # API services
│   └── api.ts
├── store/              # Redux store configuration
│   ├── index.ts
│   └── slices/
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm run eject` - Ejects from Create React App

## Authentication

The app uses JWT tokens for authentication:
- Access tokens are stored in memory (Redux store)
- Refresh tokens are stored in localStorage
- Automatic token refresh using Axios interceptors

## Role-Based Access

- **Admin**: Full access to all features
- **Accountant**: Access to fees, payments, and invoices
- **Teacher**: Limited access to student information

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.