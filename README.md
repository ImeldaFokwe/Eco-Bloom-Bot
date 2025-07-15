# 🌿 Eco Bloom Bot

**Eco Bloom Bot** is an intelligent greenhouse monitoring system that combines hardware sensors, a real-time dashboard, and a secure backend API. It was developed as a capstone project to showcase full stack development, IoT integration, and cloud deployment skills.

---

## 🚀 Project Overview

Eco Bloom Bot allows users to monitor and manage environmental conditions inside a greenhouse through a web interface. It collects sensor data (e.g. temperature, humidity, light), stores it in a database, and displays it in a dashboard for real-time visualization.

---

## 🧱 Project Structure

```
eco-bloom-bot/
├── backend/          # Node.js REST API with JWT authentication
├── frontend/         # Angular dashboard for data visualization
├── hardware/         # Sensor code and circuit diagrams
├── tests/            # Backend testing logic
├── docs/             # Reports, diagrams, architecture
```

---

## 🛠️ Technologies Used

### 🌐 Web Development
- **Frontend**: Angular, HTML5, CSS3, TypeScript
- **Backend**: Node.js, Express.js, JWT, RESTful APIs

### 💾 Database & Cloud
- MySQL
- AWS (EC2, RDS)
- Docker

### 🔌 Hardware
- Arduino-compatible sensors
- Real-time sensor communication

---

## ⚙️ Features

- 🌡️ Real-time greenhouse data display
- 🔒 JWT-secured login system
- ☁️ Data stored in MySQL and hosted on AWS
- 📊 Responsive dashboard built with Angular
- 📦 Modular backend with testable endpoints
- 📎 Well-documented architecture and setup

---

## 🧪 How to Run the Project

### Backend
```bash
cd backend
npm install
npm run start
```

### Frontend
```bash
cd frontend
npm install
ng serve
``` 
