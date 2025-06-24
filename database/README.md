# 📊 Database Setup Guide

Hướng dẫn chi tiết cách setup và import database cho dự án Airbnb Capstone.

## 📋 Mục lục

- [Cấu trúc Database](#-cấu-trúc-database)
- [Cài đặt PostgreSQL](#-cài-đặt-postgresql)
- [Import Database](#-import-database)
- [Seed Data](#-seed-data)
- [Backup & Restore](#-backup--restore)
- [Troubleshooting](#-troubleshooting)

## 🗄️ Cấu trúc Database

### Tables chính:
- **Users**: Quản lý người dùng (Admin, Host, User)
- **Roles**: Phân quyền hệ thống
- **Permissions**: Chi tiết quyền hạn
- **Locations**: Địa điểm/vị trí
- **Rooms**: Phòng cho thuê
- **BookRooms**: Đặt phòng
- **Comments**: Bình luận và đánh giá
- **Replies**: Phản hồi bình luận

### Relationships:
```
Users (1) ←→ (N) Rooms (Host relationship)
Users (1) ←→ (N) BookRooms (Booking relationship)
Users (1) ←→ (N) Comments (Comment relationship)
Rooms (1) ←→ (N) BookRooms
Rooms (1) ←→ (N) Comments
Locations (1) ←→ (N) Rooms
Comments (1) ←→ (N) Replies
```

## 🔧 Cài đặt PostgreSQL

### Windows:
1. Download PostgreSQL từ: https://www.postgresql.org/download/windows/
2. Chạy installer và follow setup wizard
3. Nhớ password cho user `postgres`
4. Mở pgAdmin hoặc command line

### macOS:
```bash
# Sử dụng Homebrew
brew install postgresql
brew services start postgresql

# Tạo database
createdb airbnb_db
```

### Linux (Ubuntu):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -i -u postgres
createdb airbnb_db
```

## 📥 Import Database

### Phương pháp 1: Sử dụng file SQL

1. **Tạo database mới:**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Tạo database
CREATE DATABASE airbnb_db;

-- Tạo user (optional)
CREATE USER airbnb_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE airbnb_db TO airbnb_user;

-- Exit
\q
```

2. **Import file SQL:**
```bash
# Import từ file SQL
psql -U postgres -d airbnb_db -f airbnb_capstone.sql

# Hoặc với user custom
psql -U airbnb_user -d airbnb_db -f airbnb_capstone.sql
```

3. **Verify import:**
```sql
-- Connect to database
psql -U postgres -d airbnb_db

-- Check tables
\dt

-- Check data
SELECT COUNT(*) FROM "Users";
SELECT COUNT(*) FROM "Rooms";
SELECT COUNT(*) FROM "Locations";
```

### Phương pháp 2: Sử dụng Prisma

1. **Setup environment:**
```bash
# Copy environment file
cp .env.example .env

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/airbnb_db"
```

2. **Run Prisma commands:**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Hoặc run migrations
npx prisma migrate dev --name init
```

3. **Seed database:**
```bash
# Run seed script
npx prisma db seed
```

### Phương pháp 3: Restore từ backup

Nếu có file backup (.dump hoặc .backup):
```bash
# Restore từ custom format
pg_restore -U postgres -d airbnb_db -v backup.dump

# Restore từ plain SQL
psql -U postgres -d airbnb_db < backup.sql
```

## 🌱 Seed Data

### Default Roles:
```sql
INSERT INTO "Roles" (id, name) VALUES 
(1, 'ADMIN'),
(2, 'USER'), 
(3, 'HOST');
```

### Default Admin User:
```sql
INSERT INTO "Users" (
  "fullName", 
  "email", 
  "password", 
  "roleId"
) VALUES (
  'Admin User',
  'admin@airbnb.com',
  '$2b$10$hashed_password_here',
  1
);
```

### Sample Locations:
```sql
INSERT INTO "Locations" (name, province, country, image) VALUES 
('Hồ Chí Minh', 'Hồ Chí Minh', 'Việt Nam', 'hcm_image_id'),
('Hà Nội', 'Hà Nội', 'Việt Nam', 'hanoi_image_id'),
('Đà Nẵng', 'Đà Nẵng', 'Việt Nam', 'danang_image_id');
```

### Custom Seed Script:
Tạo file `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Seed roles
  await prisma.roles.createMany({
    data: [
      { id: 1, name: 'ADMIN' },
      { id: 2, name: 'USER' },
      { id: 3, name: 'HOST' }
    ],
    skipDuplicates: true
  });

  // Seed admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.users.create({
    data: {
      fullName: 'Admin User',
      email: 'admin@airbnb.com',
      password: hashedPassword,
      roleId: 1
    }
  });

  // Seed locations
  await prisma.locations.createMany({
    data: [
      { name: 'Hồ Chí Minh', province: 'Hồ Chí Minh', country: 'Việt Nam' },
      { name: 'Hà Nội', province: 'Hà Nội', country: 'Việt Nam' },
      { name: 'Đà Nẵng', province: 'Đà Nẵng', country: 'Việt Nam' }
    ],
    skipDuplicates: true
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Chạy seed:
```bash
npx prisma db seed
```

## 💾 Backup & Restore

### Tạo Backup:
```bash
# Full backup
pg_dump -U postgres -d airbnb_db > backup_$(date +%Y%m%d).sql

# Custom format (nén)
pg_dump -U postgres -d airbnb_db -Fc > backup_$(date +%Y%m%d).dump

# Chỉ schema
pg_dump -U postgres -d airbnb_db --schema-only > schema_backup.sql

# Chỉ data
pg_dump -U postgres -d airbnb_db --data-only > data_backup.sql
```

### Restore Backup:
```bash
# Từ SQL file
psql -U postgres -d airbnb_db_new < backup_20241215.sql

# Từ custom format
pg_restore -U postgres -d airbnb_db_new backup_20241215.dump

# Với options
pg_restore -U postgres -d airbnb_db_new -v --clean --if-exists backup.dump
```

## 🔧 Troubleshooting

### Lỗi thường gặp:

#### 1. Connection refused
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Start service
sudo systemctl start postgresql

# Check port
netstat -an | grep 5432
```

#### 2. Authentication failed
```bash
# Reset postgres password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'new_password';
```

#### 3. Database không tồn tại
```sql
-- List databases
\l

-- Create database
CREATE DATABASE airbnb_db;
```

#### 4. Permission denied
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE airbnb_db TO username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO username;
```

#### 5. Prisma connection error
```bash
# Reset Prisma client
npx prisma generate

# Check connection
npx prisma db pull
```

### Useful Commands:

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('airbnb_db'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'airbnb_db';
```

## 📝 Notes

- **Backup thường xuyên** trước khi thay đổi schema
- **Test migrations** trên database copy trước
- **Monitor performance** với pg_stat_statements
- **Setup replication** cho production environment

---

## 🔗 Links hữu ích

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [pgAdmin](https://www.pgadmin.org/)
- [TablePlus](https://tableplus.com/) (GUI tool)
