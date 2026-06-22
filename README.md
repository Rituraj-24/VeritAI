# 🛡️ VeritAI
### AI-Powered Multimodal Fake News Detection System

VeritAI is an AI-powered web application that detects fake news from **text** and **images** using Large Language Models (LLMs). It provides user authentication, news analysis, and an intuitive dashboard for verifying information.

---

## 📸 Project Preview

### 🏠 Home Page

![Home](<img width="1870" height="904" alt="Screenshot 2026-04-13 215530" src="https://github.com/user-attachments/assets/d74bf981-ff9a-449f-91bf-6fa8beb4305a" />
)

---

### 🔐 Login

![Login](<img width="1919" height="859" alt="Screenshot 2026-04-05 233359" src="https://github.com/user-attachments/assets/a7824768-ba1c-4ea1-935d-89408e1fc060" />
)

---

### 📝 Register

![Register](<img width="1882" height="902" alt="Screenshot 2026-04-08 004825" src="https://github.com/user-attachments/assets/fc560d1a-ddd1-446f-a7bb-c407292e69e3" />
)

---

### 📊 Dashboard

![Dashboard](<img width="1882" height="902" alt="Screenshot 2026-04-08 004825" src="https://github.com/user-attachments/assets/870ca7a9-172b-4bf9-a4e5-2e50c2145189" />
)

---

### 🤖 AI Fake News Analysis

![Analysis](<img width="1872" height="881" alt="Screenshot 2026-04-13 215207" src="https://github.com/user-attachments/assets/e852e707-3794-42e6-af5e-f2a8ae830074" />
)

---

## ✨ Features

- 🔐 Secure User Authentication
- 🤖 AI-Powered Fake News Detection
- 📰 Live News Feed
- 🖼️ Image-Based Fake News Analysis
- 📊 Modern Dashboard
- ⚡ Fast Flask Backend
- 💾 SQLite Database
- 🌐 REST API Architecture

---

## 🏗️ System Architecture

```
          Frontend (HTML, CSS, JavaScript)
                     │
                     ▼
          Flask Backend (Python)
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
 SQLite DB      Groq API      Claude API
```

---

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Python
- Flask
- Flask-CORS

### Database

- SQLite

### AI APIs

- Groq
- Anthropic Claude

---

## 📂 Project Structure

```
VeritAI
│
├── backend
│   ├── routes
│   ├── services
│   ├── app.py
│   ├── db.py
│   └── requirements.txt
│
├── frontend
│   ├── css
│   ├── js
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── dashboard.html
│
├── screenshots
│
├── README.md
└── .gitignore
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/Rituraj-24/VeritAI.git
```

### Go to Project

```bash
cd VeritAI/backend
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Virtual Environment

Windows

```bash
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Backend

```bash
python app.py
```

Open the frontend using **Live Server** and start from:

```
frontend/index.html
```

---

## 🎯 Future Improvements

- Admin Dashboard
- Email Verification
- User Profile
- Mobile Responsive UI

---

## 👨‍💻 Developer

**Ritu Shrivastava**

GitHub: https://github.com/Rituraj-24

---

## ⭐ If you like this project

Give this repository a ⭐ on GitHub.
