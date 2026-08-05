# Madurai Food Corner ERP Backend - Production Deployment Guide

This guide details the step-by-step process for deploying the **Madurai Food Corner ERP Backend** to an **Ubuntu Linux** server using Node.js LTS, PM2, Nginx, Neon PostgreSQL, and Cloudinary.

---

## 📋 Prerequisites

1. Ubuntu Linux Server (20.04 / 22.04 LTS).
2. Domain Name configured with A-records pointing to server IP (e.g. `api.maduraifoodcorner.com`).
3. Neon PostgreSQL database connection string (`DATABASE_URL`).
4. Cloudinary Account API credentials.

---

## 🛠️ Step 1: Server Preparation & Dependencies Installation

Connect to your Ubuntu server via SSH:

```bash
ssh root@your_server_ip
```

Update system packages and install Node.js LTS (v20):

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential nginx
```

Verify installations:

```bash
node -v
npm -v
nginx -v
```

Install **PM2** globally:

```bash
sudo npm install -g pm2
```

---

## 📂 Step 2: Clone Codebase & Install Production Packages

Clone the project repository to `/var/www/`:

```bash
cd /var/www
git clone <your-git-repository-url> madurai-food-corner-erp
cd madurai-food-corner-erp/backend
```

Install production dependencies & generate Prisma Client:

```bash
npm ci --only=production
npx prisma generate
```

---

## ⚙️ Step 3: Configure Environment Variables

Create `.env` file from template:

```bash
cp .env.example .env
nano .env
```

Populate production credentials:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:pass@ep-sample-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGIN=*
```

Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

---

## 🚀 Step 4: Launch Backend Cluster with PM2

Start the Node.js backend using PM2 cluster mode:

```bash
pm2 start ecosystem.config.js --env production
```

Configure PM2 to automatically restart on system reboot:

```bash
pm2 save
pm2 startup
```

Verify PM2 status:

```bash
pm2 status
pm2 logs
```

---

## 🌐 Step 5: Configure Nginx Reverse Proxy & SSL

Copy sample Nginx configuration:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/api.maduraifoodcorner.com
sudo ln -s /etc/nginx/sites-available/api.maduraifoodcorner.com /etc/nginx/sites-enabled/
```

Remove default Nginx site and test configuration:

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Install Let's Encrypt Certbot for Free HTTPS SSL:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.maduraifoodcorner.com
```

---

## 🐳 Alternative Deployment: Docker & Docker Compose

If you prefer containerized deployment:

```bash
docker-compose up -d --build
```

Check container status and health:

```bash
docker-compose ps
docker-compose logs -f
```

---

## ❤️ Verification & Monitoring

- **Health Check**: `https://api.maduraifoodcorner.com/api/health`
- **Swagger Documentation**: `https://api.maduraifoodcorner.com/api/docs`
- **Root API Status**: `https://api.maduraifoodcorner.com/`
