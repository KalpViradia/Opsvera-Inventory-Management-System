# Opsvera Socket Server

A dedicated WebSocket server built with Node.js and Socket.IO for the Opsvera Inventory Management System. It handles real-time communication, broadcasting updates and notifications to connected clients.

## Technologies Used
- **Node.js**
- **Socket.IO**
- **Express**

## Getting Started

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm run dev
   ```
   The socket server runs on port `3001` by default.

## Features
- Real-time connection management.
- Broadcasting events for system updates.
- Room-based multi-tenant communication (per-company notifications).
