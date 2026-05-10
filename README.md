
# SmartSeason Field Monitoring System

A comprehensive field monitoring system for tracking crop progress across multiple fields during growing seasons.

## Features

- **Role-Based Access Control** (Admin & Field Agent)
- **Field Management** - Create, update, delete fields
- **Field Updates** - Track crop progress with notes
- **Smart Status Logic** - Auto-calculates field status (Active/At Risk/Completed)
- **Interactive Dashboard** - Visual insights and summaries
- **Real-time Updates** - Track field progress over time

## Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL with Prisma ORM
- JWT Authentication
- bcrypt for password hashing

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- React Router v6
- Axios for API calls
- React Hot Toast for notifications

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd SmartSeason