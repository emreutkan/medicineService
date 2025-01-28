# Medicine Search API 🏥

![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Azure](https://img.shields.io/badge/azure-%230072C6.svg?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

High-performance REST API for medicine information search with Redis caching and automatic TİTCK data synchronization.

## API Host
https://medicineservice-b3gcczakghhrfjc2.canadacentral-01.azurewebsites.net/

## 📚 API Endpoints
- `GET /v1/medicine/search?query=<medicine-name>` - Search medicines by name
- `GET /health` - Health check endpoint
- Swagger Documentation available at root endpoint (`/`)

## Features
- Redis-backed caching system
- Automatic TİTCK data synchronization
- Swagger/OpenAPI documentation
- MongoDB for persistent storage
- CORS enabled for cross-origin requests

---
![image](https://github.com/user-attachments/assets/98809380-12af-4f00-bc33-e7e7d65ff331)
