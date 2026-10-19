# Spotly — CentOS Web Panel (CWP) Deployment Guide

This guide outlines the steps to deploy the Spotly web application on a CentOS Web Panel (CWP) server using Node.js and PostgreSQL.

---

## 1. Prerequisites
- **Node.js**: Version 18.x or 20.x installed on your CWP server.
- **PostgreSQL**: PostgreSQL service running on the server.
- **PM2**: Recommended process manager for Node.js.

---

## 2. Step-by-Step Deployment

### Step A: Database Configuration
1. Log in to your **CWP User Panel**.
2. Navigate to **PostgreSQL Database** or **MySQL Database** (Note: Spotly is configured for PostgreSQL).
3. Create a new database (e.g., `spotly_db`).
4. Create a database user and assign a strong password.
5. Add the user to the database with full privileges.
6. Note down the connection URI format:
   ```env
   postgresql://db_user:db_password@localhost:5432/spotly_db
   ```

### Step B: Upload and Extract Application
1. Upload `spotly-deployment.zip` to your CWP user directory (e.g., `/home/username/spotly`) using the CWP File Manager or SFTP.
2. Extract/Unzip the package contents inside the folder. Ensure the structure looks like this:
   ```
   /home/username/spotly/
   ├── dist/
   │   ├── index.cjs
   │   ├── app.js
   │   ├── server.js
   │   ├── index.js
   │   ├── .htaccess
   │   └── public/
   ├── attached_assets/
   ├── migrations/
   ├── shared/
   ├── spotly.sql
   ├── app.js
   ├── server.js
   ├── .env.example
   ├── drizzle.config.ts
   ├── ecosystem.config.cjs
   ├── package.json
   └── package-lock.json
   ```

### Step C: Environment Variables Setup
1. In the application directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the production details:
   - Set `DATABASE_URL` to your PostgreSQL connection string created in Step A.
   - Set `NODE_ENV=production`.
   - Set `PORT=5001` (or your preferred application port).
   - Set a secure, random string for `SESSION_SECRET`.
   - Update `INSTANTALERTS_API_KEY` with your SMS provider key.
   - Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with your Razorpay credentials.
   - Set strong passwords for `SUPER_ADMIN_PASSWORD` and `SUB_ADMIN_PASSWORD`.

### Step D: Install Production Dependencies
1. Open a terminal or SSH session to your CWP server.
2. Navigate to the application root directory:
   ```bash
   cd /home/username/spotly
   ```
3. Install production dependencies (this ensures OS-native components, like database drivers, are compiled correctly for your CentOS server):
   ```bash
   npm install --production
   ```

### Step E: Database Setup (Choose One Option)

#### Option 1: Import Database Dump (Instant, Recommended)
Import `spotly.sql` directly into your PostgreSQL database:
```bash
psql -U spotly_user -d spotly_db < spotly.sql
```
*(Or use the CWP PostgreSQL Management tool / phpPgAdmin to import `spotly.sql`).*

#### Option 2: Drizzle ORM Schema Push
Push the schema definitions automatically using Drizzle:
```bash
npx drizzle-kit push
```
*(Ensure your database credentials in `.env` are configured correctly before running this command).*

### Step F: Running the Application

#### Option 1: PM2 Process Manager (Recommended)
1. Install PM2 globally if not already installed:
   ```bash
   npm install -g pm2
   ```
2. Start the application using the preconfigured `ecosystem.config.cjs`:
   ```bash
   pm2 start ecosystem.config.cjs
   ```
3. Ensure the process persists after server reboots:
   ```bash
   pm2 startup
   pm2 save
   ```
4. Useful commands:
   - Check status: `pm2 status`
   - View real-time logs: `pm2 logs spotly-parking`
   - Restart the app: `pm2 restart spotly-parking`

#### Option 2: CWP Node.js Application Manager
1. Log in to **CWP Admin Panel**.
2. Search and open **Node.js Manager**.
3. Click **Add Application** and configure the fields:
   - **Application Name**: `spotly`
   - **Application Path**: `/home/username/spotly`
   - **Startup File**: `dist/index.cjs`
   - **App Env**: `production`
   - **Port**: `5001`
4. Click **Save** and start the application.

---

## 3. Web Server Reverse Proxy (Nginx / Apache)
To map the application to your public domain (e.g., `spotlyindia.org`):
1. In CWP, configure a reverse proxy to route public traffic (Port `80`/`443`) to your local app port (Port `5001`).
2. **Nginx configuration example**:
   ```nginx
   server {
       listen 80;
       server_name spotlyindia.org;

       location / {
           proxy_pass http://127.0.0.1:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Ensure SSL/HTTPS is configured via CWP's AutoSSL (Let's Encrypt).
