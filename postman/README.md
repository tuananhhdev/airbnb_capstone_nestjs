# 📮 Postman Collection Guide

Hướng dẫn chi tiết cách import và sử dụng Postman Collection cho dự án Airbnb Capstone.

## 📋 Mục lục

- [Import Collection](#-import-collection)
- [Setup Environment](#-setup-environment)
- [Authentication Flow](#-authentication-flow)
- [API Testing Guide](#-api-testing-guide)
- [Common Issues](#-common-issues)
- [Advanced Usage](#-advanced-usage)

## 📥 Import Collection

### Bước 1: Download Files
Trong folder `postman/` có 2 files chính:
- `Airbnb_Capstone.postman_collection.json` - API collection
- `Airbnb_Environment.postman_environment.json` - Environment variables

### Bước 2: Import vào Postman

1. **Mở Postman**
2. **Import Collection:**
   - Click **Import** button (top left)
   - Chọn **File** tab
   - Browse và chọn `Airbnb_Capstone.postman_collection.json`
   - Click **Import**

3. **Import Environment:**
   - Click **Import** button
   - Chọn **File** tab  
   - Browse và chọn `Airbnb_Environment.postman_environment.json`
   - Click **Import**

### Bước 3: Activate Environment
- Click dropdown ở top right (Environment selector)
- Chọn **Airbnb Environment**

## ⚙️ Setup Environment

### Environment Variables cần cấu hình:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `baseUrl` | API base URL | `http://localhost:3000` |
| `token` | JWT token | Auto-set sau login |
| `userId` | Current user ID | Auto-set sau login |
| `adminToken` | Admin JWT token | Manual set |
| `hostToken` | Host JWT token | Manual set |

### Cách cập nhật Environment:

1. **Click gear icon** ở top right
2. **Select "Airbnb Environment"**
3. **Update values:**
   ```
   baseUrl: http://localhost:3000
   token: (sẽ auto-set)
   userId: (sẽ auto-set)
   ```
4. **Save**

## 🔐 Authentication Flow

### 1. Register New User
```
POST {{baseUrl}}/auth/register
```
**Body:**
```json
{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "123456",
  "phone": "0123456789",
  "birthday": "1990-01-01",
  "gender": true
}
```

### 2. Login
```
POST {{baseUrl}}/auth/login
```
**Body:**
```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

**Response sẽ auto-set:**
- `token` variable
- `userId` variable

### 3. Test Authentication
```
GET {{baseUrl}}/auth/profile
Authorization: Bearer {{token}}
```

## 🧪 API Testing Guide

### Testing Order (Recommended):

#### 1. **Authentication Module**
- ✅ Register user
- ✅ Login user  
- ✅ Get profile
- ✅ Refresh token

#### 2. **Location Module** (Admin only)
- ✅ Get all locations
- ✅ Create location (need admin token)
- ✅ Update location
- ✅ Delete location

#### 3. **User Module**
- ✅ Get all users (admin)
- ✅ Update profile
- ✅ Upload avatar
- ✅ Search users

#### 4. **Room Module**
- ✅ Create room (auto upgrade to Host)
- ✅ Get all rooms
- ✅ Search rooms with filters
- ✅ Get room by ID
- ✅ Update room
- ✅ Delete room

#### 5. **Booking Module**
- ✅ Create booking
- ✅ Get bookings
- ✅ Update booking (test grace period)
- ✅ Cancel booking (test refund policy)
- ✅ Host confirm booking

#### 6. **Comment Module**
- ✅ Create comment
- ✅ Get comments by room
- ✅ Reply to comment
- ✅ Update comment
- ✅ Delete comment

### File Upload Testing:

#### Avatar Upload:
```
POST {{baseUrl}}/users/upload-avatar
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

Body: form-data
- avatar: [select image file]
```

#### Room Images:
```
POST {{baseUrl}}/rooms
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

Body: form-data
- name: "Test Room"
- price: 1000000
- guestCount: 4
- locationId: 1
- imageRoom: [select multiple images]
```

## 🔧 Common Issues

### 1. Token Expired
**Error:** `401 Unauthorized`
**Solution:** 
- Re-login để get new token
- Check token expiry time

### 2. Permission Denied
**Error:** `403 Forbidden`
**Solution:**
- Check user role (Admin/Host/User)
- Use correct token for role-specific APIs

### 3. File Upload Failed
**Error:** `400 Bad Request - File too large`
**Solution:**
- Check file size limits:
  - Avatar: 5MB max
  - Room images: 1MB max per file
- Use supported formats: JPEG, PNG, WebP

### 4. Environment Variables Not Working
**Error:** Variables showing as `{{baseUrl}}`
**Solution:**
- Make sure environment is selected
- Check variable names match exactly
- Re-import environment file

### 5. CORS Error
**Error:** `Access-Control-Allow-Origin`
**Solution:**
- Make sure backend is running
- Check CORS configuration in NestJS

## 🚀 Advanced Usage

### Pre-request Scripts

**Auto-login script** (add to Collection level):
```javascript
// Auto-login if token is missing
if (!pm.environment.get("token")) {
    pm.sendRequest({
        url: pm.environment.get("baseUrl") + "/auth/login",
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                email: "admin@airbnb.com",
                password: "admin123"
            })
        }
    }, function (err, response) {
        if (response.json().token) {
            pm.environment.set("token", response.json().token);
            pm.environment.set("userId", response.json().user.id);
        }
    });
}
```

### Test Scripts

**Auto-extract token** (add to Login request):
```javascript
// Extract token from response
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
    pm.environment.set("userId", response.user.id);
    
    console.log("Token set:", response.token);
    console.log("User ID set:", response.user.id);
}
```

**Validate response** (add to any request):
```javascript
// Test response status
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test response structure
pm.test("Response has required fields", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('message');
    pm.expect(response).to.have.property('data');
});

// Test response time
pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

### Collection Variables

Useful variables to set at Collection level:
```javascript
// Collection Variables
{
  "adminEmail": "admin@airbnb.com",
  "adminPassword": "admin123",
  "testUserEmail": "test@example.com",
  "testUserPassword": "123456",
  "sampleRoomId": "1",
  "sampleLocationId": "1"
}
```

### Automated Testing

**Run Collection with Newman:**
```bash
# Install Newman
npm install -g newman

# Run collection
newman run Airbnb_Capstone.postman_collection.json \
  -e Airbnb_Environment.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export report.html
```

## 📊 Collection Structure

```
📁 Airbnb Capstone Collection
├── 📁 Auth
│   ├── Register
│   ├── Login
│   ├── Profile
│   └── Refresh Token
├── 📁 Users
│   ├── Get All Users
│   ├── Create User
│   ├── Update Profile
│   ├── Upload Avatar
│   └── Search Users
├── 📁 Locations
│   ├── Get All Locations
│   ├── Create Location
│   ├── Update Location
│   └── Delete Location
├── 📁 Rooms
│   ├── Get All Rooms
│   ├── Search Rooms
│   ├── Create Room
│   ├── Get Room by ID
│   ├── Update Room
│   └── Delete Room
├── 📁 Bookings
│   ├── Create Booking
│   ├── Get All Bookings
│   ├── Get Booking by ID
│   ├── Update Booking
│   ├── Cancel Booking
│   ├── Get Bookings by User
│   └── Host Confirm Booking
└── 📁 Comments
    ├── Get Comments by Room
    ├── Create Comment
    ├── Reply to Comment
    ├── Update Comment
    └── Delete Comment
```

## 📝 Tips & Best Practices

1. **Always test Authentication first** before other APIs
2. **Use different users** for different roles (Admin, Host, User)
3. **Test file uploads** with various file sizes and formats
4. **Test edge cases** like expired tokens, invalid IDs
5. **Use environment variables** for reusable data
6. **Add assertions** to validate responses
7. **Document your tests** with descriptions

---

## 🔗 Useful Links

- [Postman Documentation](https://learning.postman.com/docs/)
- [Newman CLI](https://github.com/postmanlabs/newman)
- [Postman Scripts](https://learning.postman.com/docs/writing-scripts/intro-to-scripts/)
- [API Documentation](http://localhost:3000/api) (Swagger)
