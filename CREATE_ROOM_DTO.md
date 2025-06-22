# CreateRoomDto Documentation

## Tổng quan

`CreateRoomDto` là Data Transfer Object được sử dụng để validate và transform dữ liệu khi tạo phòng mới trong hệ thống Airbnb.

## 🏗️ Cấu trúc DTO

### Thông tin cơ bản

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | string | ✅ | 3-255 ký tự | Tên phòng/căn hộ |
| `guestCount` | number | ✅ | 1-20 | Số lượng khách tối đa |
| `bedroomCount` | number | ✅ | 0-10 | Số phòng ngủ |
| `bedCount` | number | ✅ | 1-20 | Số giường |
| `bathroomCount` | number | ✅ | 1-10 | Số phòng tắm |
| `description` | string | ❌ | ≤ 2000 ký tự | Mô tả chi tiết |
| `price` | number | ✅ | ≥ 0, 2 decimal places | Giá phòng/đêm (VNĐ) |
| `locationId` | number | ✅ | ≥ 1 | ID vị trí |

### Tiện ích phòng (Amenities)

Tất cả các tiện ích đều là **optional** với giá trị mặc định là `false`:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `washingMachine` | boolean | false | Có máy giặt |
| `iron` | boolean | false | Có bàn ủi |
| `tv` | boolean | false | Có TV |
| `airConditioner` | boolean | false | Có điều hòa |
| `wifi` | boolean | false | Có WiFi |
| `kitchen` | boolean | false | Có bếp |
| `parking` | boolean | false | Có chỗ đậu xe |
| `pool` | boolean | false | Có hồ bơi |
| `ironingBoard` | boolean | false | Có bàn ủi đồ |

## 🔧 Validation Rules

### String Fields
- **name**: 
  - Bắt buộc, không được rỗng
  - Độ dài: 3-255 ký tự
  - Phải là chuỗi hợp lệ

- **description**: 
  - Tùy chọn
  - Tối đa 2000 ký tự

### Number Fields
- **guestCount**: 1-20 khách
- **bedroomCount**: 0-10 phòng ngủ
- **bedCount**: 1-20 giường  
- **bathroomCount**: 1-10 phòng tắm
- **price**: ≥ 0, tối đa 2 chữ số thập phân
- **locationId**: ≥ 1

### Boolean Fields
- Tự động transform từ string ('true'/'false') sang boolean
- Giá trị mặc định: `false`

## 📝 Usage Examples

### 1. Tạo phòng cơ bản

```typescript
const basicRoom: CreateRoomDto = {
  name: 'Phòng đơn giản',
  guestCount: 2,
  bedroomCount: 1,
  bedCount: 1,
  bathroomCount: 1,
  price: 500000,
  locationId: 1,
  // Các tiện ích sẽ mặc định là false
};
```

### 2. Tạo phòng cao cấp với đầy đủ tiện ích

```typescript
const luxuryRoom: CreateRoomDto = {
  name: 'Căn hộ cao cấp view biển',
  guestCount: 6,
  bedroomCount: 3,
  bedCount: 4,
  bathroomCount: 2,
  description: 'Căn hộ sang trọng với view biển tuyệt đẹp, đầy đủ tiện nghi hiện đại',
  price: 2500000,
  locationId: 5,
  washingMachine: true,
  iron: true,
  tv: true,
  airConditioner: true,
  wifi: true,
  kitchen: true,
  parking: true,
  pool: true,
  ironingBoard: true,
};
```

### 3. Sử dụng trong Controller

```typescript
@Post()
@ApiBody({ type: CreateRoomDto })
create(
  @Body() createRoomDto: CreateRoomDto,
  @UploadedFiles() files: Express.Multer.File[]
) {
  return this.roomService.create(createRoomDto, files);
}
```

## 🔄 Transform Logic

### Boolean Transform
```typescript
@Transform(({ value }) => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return Boolean(value);
})
```

### Number Transform
```typescript
@Type(() => Number)
```

## ⚠️ Common Validation Errors

### 1. Name Validation
```json
{
  "property": "name",
  "constraints": {
    "isNotEmpty": "Tên phòng không được để trống",
    "minLength": "Tên phòng phải có ít nhất 3 ký tự"
  }
}
```

### 2. Count Validation
```json
{
  "property": "guestCount",
  "constraints": {
    "min": "Số lượng khách phải ít nhất là 1",
    "max": "Số lượng khách không được vượt quá 20"
  }
}
```

### 3. Price Validation
```json
{
  "property": "price",
  "constraints": {
    "min": "Giá phòng không được âm",
    "isNumber": "Giá phòng phải là số hợp lệ"
  }
}
```

## 🧪 Testing

### Unit Tests
File: `create-room.dto.spec.ts`

**Test Cases:**
- ✅ Valid data validation
- ✅ Required field validation
- ✅ String length validation
- ✅ Number range validation
- ✅ Boolean transformation
- ✅ Optional field handling

### Chạy tests
```bash
npm test -- --testPathPattern=create-room.dto.spec.ts
```

## 🔗 Related Files

- `UpdateRoomDto`: Extends CreateRoomDto với PartialType
- `UploadRoomImagesDto`: DTO cho upload ảnh phòng
- `FindRoomsDto`: DTO cho tìm kiếm phòng
- `RoomService.create()`: Service method sử dụng DTO này

## 📋 API Documentation

### Swagger Schema
DTO được tự động generate Swagger documentation với:
- Field descriptions
- Example values
- Validation constraints
- Required/optional indicators

### Example Request Body
```json
{
  "name": "Căn hộ cao cấp view biển",
  "guestCount": 4,
  "bedroomCount": 2,
  "bedCount": 3,
  "bathroomCount": 2,
  "description": "Căn hộ sang trọng với view biển tuyệt đẹp...",
  "price": 1500000,
  "locationId": 1,
  "washingMachine": true,
  "iron": true,
  "tv": true,
  "airConditioner": true,
  "wifi": true,
  "kitchen": true,
  "parking": true,
  "pool": false,
  "ironingBoard": true
}
```

## 🎯 Best Practices

1. **Always validate locationId**: Đảm bảo location tồn tại trước khi tạo room
2. **Handle file uploads**: Kết hợp với file upload cho ảnh phòng
3. **Use TypeScript**: Leverage type safety với DTO
4. **Error handling**: Provide clear error messages
5. **Transform data**: Ensure correct data types từ form data

## 🔄 Future Enhancements

1. **Custom validators**: Thêm custom validation cho business rules
2. **Nested DTOs**: Support cho complex amenity objects
3. **Conditional validation**: Validation dựa trên room type
4. **Internationalization**: Multi-language error messages
