
# 🚀 React + Vite App (Dockerized)

This project is a modern frontend application built with **React** and **Vite**, optimized for production and containerized using **Docker** and **Nginx**.

---

## 📦 Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## ⚙️ Project Structure

```

.
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
├── public/
├── src/
└── vite.config.js

````

---

## 🚀 Getting Started

### 1. Clone the repository

### 2. Build and run with Docker Compose

```bash
docker compose up --build
```

This will:

* Install dependencies
* Build the Vite project
* Serve the production build via Nginx

---

## 🌐 Access the app

Once the container is running, open your browser and go to:

```
http://localhost:3000
```

---

