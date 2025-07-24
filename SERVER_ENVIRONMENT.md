# Server Environment Setup Guide

## Production Server Environment Configuration

### 🖥️ Server Specifications
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 2+ vCPUs
- **RAM**: 4GB+ 
- **Storage**: 50GB+ SSD
- **Network**: Static IP with SSL certificates

### 🔐 Security Configuration
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install security packages
sudo apt install fail2ban ufw -y

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp  # Backend API
sudo ufw --force enable
```

### 📦 Required Software Stack

#### Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

#### SSL Certificates (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificates
sudo certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com
```

### 🚀 Production Deployment

#### 1. Environment Variables
Create `.env.prod` file:
```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=email_tracker_prod
DB_USER=email_tracker
DB_PASSWORD=your-secure-password-here

# Redis Configuration
REDIS_URL=redis://:your-redis-password@redis:6379
REDIS_PASSWORD=your-redis-password

# Email Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Email Tracker

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
CORS_ORIGIN=https://yourdomain.com
TRUST_PROXY=true

# SSL Configuration
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### 2. Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    env_file:
      - .env.prod
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 🔧 Nginx Configuration

#### nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=tracking:10m rate=100r/s;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Tracking endpoints (higher rate limit)
        location /api/track/ {
            limit_req zone=tracking burst=100 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend;
        }
    }
}
```

### 📊 Monitoring & Logging

#### Log Rotation
```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/email-tracker > /dev/null <<EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}
EOF
```

#### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Install log monitoring
sudo apt install logwatch -y
```

### 🔑 SSL Certificate Auto-renewal
```bash
# Add cron job for SSL renewal
echo "0 12 * * * root certbot renew --quiet" | sudo tee -a /etc/crontab
```

### 🚀 Quick Deploy Commands

```bash
# 1. Clone repository
git clone https://github.com/jacobmr/email-tracker.git
cd email-tracker

# 2. Configure environment
cp .env.example .env.prod
# Edit .env.prod with your values

# 3. Deploy with Docker
sudo docker-compose -f docker-compose.prod.yml up -d

# 4. Verify deployment
sudo docker-compose -f docker-compose.prod.yml ps
sudo docker-compose -f docker-compose.prod.yml logs
```

### 🔍 Health Check Endpoints
- **API Health**: `https://yourdomain.com/health`
- **Database Health**: `https://yourdomain.com/api/health/db`
- **Redis Health**: `https://yourdomain.com/api/health/redis`

### 📧 Email Configuration
- **Provider**: SendGrid
- **Domain**: Configure your sending domain
- **DNS Records**: SPF, DKIM, DMARC records
- **Rate Limits**: 100 emails/hour (adjustable)

### 🔒 Security Checklist
- [ ] Firewall configured
- [ ] SSL certificates installed
- [ ] Database encrypted at rest
- [ ] Redis password protected
- [ ] JWT secrets rotated
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled

### 📱 Extension Configuration
```bash
# Chrome Extension settings
EXTENSION_ID=your-extension-id
API_BASE_URL=https://yourdomain.com/api
```

### 🔄 Backup Strategy
```bash
# Database backup
docker exec email-tracker-postgres-1 pg_dump -U email_tracker email_tracker_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Redis backup
docker exec email-tracker-redis-1 redis-cli -a $REDIS_PASSWORD BGSAVE
```

### 🆘 Troubleshooting
```bash
# Check logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis

# Restart services
docker-compose restart backend

# Scale services
docker-compose up -d --scale backend=3
```

### 📊 Performance Tuning
- **Database**: Connection pooling, query optimization
- **Redis**: Memory optimization, eviction policies
- **Nginx**: Worker processes, buffer sizes
- **Docker**: Resource limits, health checks
