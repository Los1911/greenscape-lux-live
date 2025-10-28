# GreenScape Lux - Premium Landscaping Services

A modern React application for a luxury landscaping service company, featuring a professional marketing website with quote request functionality.

## Features

- **Modern Landing Page** - Stunning hero section with professional landscaping imagery
- **Service Showcase** - Comprehensive display of landscaping services with visual cards
- **Quote Request System** - Integrated form for customers to request landscaping quotes
- **Professional Team** - Meet our certified landscaping professionals
- **Responsive Design** - Optimized for all devices and screen sizes
- **Admin Panel** - Backend management for quote requests and team information

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Backend**: Supabase (Database + Authentication)
- **Deployment**: Vercel
- **Email**: Supabase Edge Functions for notifications

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd greenscape-lux
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.template .env.local
   # Add your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── modern/         # Modern landing page components
│   ├── ui/             # Shadcn/ui base components
│   └── AppLayout.tsx   # Main layout component
├── pages/              # Page components
├── lib/                # Utilities and configurations
└── hooks/              # Custom React hooks
```

## Key Pages

- `/` - Landing page with hero and services
- `/about` - About us and company information
- `/professionals` - Meet our team
- `/get-quote` - Quote request form
- `/admin` - Admin dashboard (protected)

## Deployment

The application is configured for deployment on Vercel with automatic builds from the main branch.

## License

Private - All rights reserved# GreenScape Lux CI/CD verified
