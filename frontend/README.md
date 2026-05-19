# Frontend Setup Guide

## Prerequisites

Before running the frontend, make sure these are installed on your system:

- Node.js
- npm (comes with Node.js)

Check installation:

```bash
node -v
npm -v

# Clone the Project

git clone <your-repository-url>

# Go to the frontend folder:

cd video-caption-generator/frontend


# Install Dependencies

npm install


# Install Tailwind CSS v4 (Vite Setup)

# Run the following command:

npm install tailwindcss @tailwindcss/vite


# Configure Vite

# Update your vite.config.js or vite.config.ts:

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})

# Add Tailwind to CSS

# In your main CSS file (src/index.css or src/app.css) add:

@import "tailwindcss";


# Start Development Server

npm run dev

# Frontend will run on:

http://localhost:5173