# AI Pharmacy POS - Full Stack Management System

AI Pharmacy is a production-oriented Point of Sale (POS) and inventory management system for pharmacies. It includes a React frontend and a Node.js/Express backend.

## Key Features

- Inventory management with low-stock and expiry tracking
- Sales/POS flow with vouchers and printable receipts
- Dashboard analytics and reporting
- Supplier and customer management
- Email and WhatsApp alerts/reports
- Role-based authentication and authorization
- Backup and restore workflows

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, Framer Motion, Lucide, Recharts
- Backend: Node.js, Express
- Database: MongoDB (Mongoose)
- Utilities: Nodemailer, Baileys, jsPDF, CSV import/export utilities

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas or local MongoDB

### Installation

```bash
git clone https://github.com/myselftaha/AI-Pharmacy.git
cd AI-Pharmacy
npm install
```

### Environment Variables

Create `.env` in project root:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=5000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
OWNER_EMAIL=your_email@gmail.com

# Optional
STORE_NAME=AI Pharmacy

# Keep disabled in production
ALLOW_SEED_ENDPOINT=false
ALLOW_TEST_ENDPOINTS=false
ALLOW_HARD_RESET_ENDPOINT=false
```

## Run

Recommended (frontend + backend together):

```bash
npm run dev:full
```

Or run separately:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

## Deployment

Optimized for Vercel:

1. Push code to GitHub
2. Connect repo to Vercel
3. Use Vite framework preset
4. Add environment variables in Vercel
5. Deploy

## License

Private project. Consult the owner before redistribution.
