# 🎬 Video Caption Generator API (Backend - DRF)

## 📌 Overview

This project is a **Video Caption Generator API** built using Django Rest Framework (DRF).

### Main Features:

* Upload videos
* Generate captions using AI
* Translate captions
* Apply caption styles
* Preview and export videos

---

## 👥 Team Structure

### 🔹 Backend Team

* **Vishal Baghel** → Authentication (Login / Signup / JWT)
* **Nameera Khan** → Core APIs (Video Upload, Preview, Export)
* **Raj Kumar** → AI Logic (Generate, Translate, Style)

### 🔹 Frontend Team

* **Jeetendra** → UI Development (Figma → React)
* **Chanchal** → API Integration & State Management

---

## 🚀 Tech Stack

* Python 🐍
* Django
* Django Rest Framework (DRF)
* JWT Authentication
* SQLite / PostgreSQL
* React (Frontend)

---

## ⚙️ Project Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/thevishaal/video-caption-generator.git
cd backend
```

### 2️⃣ Create Virtual Environment

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
source .venv/scripts/activate  #Linux, Mac
```

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 4️⃣ Create .env file in backend folder
```text
DEBUG=true

#Db_settings
DB_NAME=your_db_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

### 5️⃣ Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6️⃣ Start Server

```bash
python manage.py runserver
```

---

## 🌐 Base URL

```
http://127.0.0.1:8000/api
```

---

## 📡 API Endpoints

### 🔐 Auth

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### 🎥 Videos

```
POST /api/videos/upload
GET  /api/videos/:id/preview
POST /api/videos/:id/export
GET  /api/videos/:id/download
```

### 🤖 Captions

```
POST /api/captions/generate
POST /api/captions/translate
PUT  /api/captions/style
```

---

## 🏠 Home API

### Endpoint:

```
GET /api/
```

### Response:

```json
{
  "message": "Welcome to the Video Caption Generator API!"
}
```

---

## 📁 Project Structure

```
backend/
 ├── accounts/     # Authentication
 ├── videos/       # Video APIs
 ├── captions/     # Caption APIs
 ├── config/       # Project settings
 └── media/        # Uploaded files
```

---

## ⚡ Development Rules

### ✅ Do's

* Create feature-based branches (e.g., feature/upload, feature/auth)
* Sync daily with team
* Write clean and readable code
* Keep API responses consistent

### ❌ Don'ts

* Do not change APIs without informing the team
* Avoid editing the same file simultaneously
* Avoid hardcoded data

---

## 🧠 Contribution Guide

### 1. Create a new branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Commit your changes

```bash
git commit -m "Added: feature description"
```

### 3. Push to GitHub

```bash
git push origin feature/your-feature-name
```

### 4. Create Pull Request

---

## 📌 Notes

* Use `.env` file for API keys
* Media files will be stored in the `media/` folder
* Frontend (React) will connect via APIs (CORS enabled)

---

## 🎯 Goal

Build a scalable and clean API system for AI-powered video caption generation 🚀

---

## 🙌 Final Notes

If you face any issues:

* Check dependencies
* Run migrations properly
* Check server logs

---

Let's Go Team