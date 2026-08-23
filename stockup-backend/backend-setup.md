# StockUp AI Backend - Production Ready Setup

## Overview
This document summarizes the backend setup for the StockUp AI project. The backend has been configured to be production-ready following best practices and clean architecture principles.

## Technology Stack
- **Framework**: Spring Boot 3.5.4
- **Language**: Java 21
- **Database**: MongoDB Atlas
- **Build Tool**: Maven
- **Additional Libraries**: 
  - Lombok (for reducing boilerplate)
  - Jakarta Validation (for input validation)
  - Spring Boot Actuator (for production-ready features)

## Project Structure
```
src/main/java/com/stockup/backend/
├─ controller/     # REST controllers
├─ service/        # Service interfaces
├─ service/impl/   # Service implementations
├─ repository/     # Data access interfaces
├─ model/          # MongoDB document models
├─ dto/            # Data Transfer Objects
├─ config/         # Configuration classes
├─ exception/      # Custom exceptions and handlers
�└─ util/           # Utility classes
```

## Key Features Implemented

### 1. Clean Architecture
- Separation of concerns across layers
- Dependency inversion (dependencies point inward)
- Each layer has a clear responsibility

### 2. REST API (Item Resource)
- **POST /api/items** - Create new item
- **GET /api/items/{id}** - Get item by ID
- **GET /api/items** - Get all items
- **PUT /api/items/{id}** - Update item
- **DELETE /api/items/{id}** - Delete item

### 3. Data Validation
- Jakarta validation annotations on DTO fields:
  - `@NotBlank` for name
  - `@NotNull` and `@Positive` for price

### 4. Exception Handling
- Global exception handler for:
  - ResourceNotFoundException (returns 404)
  - Validation exceptions (returns 400 with field errors)
  - Generic exceptions (returns 500)

### 5. Configuration
- MongoDB connection string configured in application.properties
- CORS configuration allowing all origins (can be restricted for production)
- Actuator endpoints enabled for health checks

### 6. Production-Ready Features
- Proper logging configuration
- Health check endpoints
- Dependency management with explicit versions
- Build configuration with Lombok annotation processing

## Setup Instructions

### 1. Prerequisites
- JDK 21 installed
- Maven 3.9+
- MongoDB Atlas account with a cluster created

### 2. MongoDB Atlas Configuration
1. Create a MongoDB Atlas cluster if you don't have one
2. Create a database user with appropriate credentials
3. **CRITICAL**: Add your current IP address to the Network Access List:
   - Go to MongoDB Atlas → Security → Network Access
   - Click "ADD IP ADDRESS"
   - Select "Allow Access from Current IP"
   - Confirm the change

### 3. Update Connection String
Edit `src/main/resources/application.properties`:
```
spring.data.mongodb.uri=mongodb://username:password@cluster-address:27017/database?options
spring.data.mongodb.database=your-database-name
server.port=8080
```

### 4. Build and Run
```bash
# Set Java 21 (if not default)
export JAVA_HOME=/path/to/java21

# Build the project
mvn clean compile

# Run the application
mvn spring-boot:run
```

## API Endpoints

### Health Check
- `GET /health` - Basic health status
- `GET /actuator/health` - Detailed health information (from Spring Boot Actuator)

### Item Management
All item endpoints require JSON in the request body with:
```json
{
  "name": "Item Name",
  "description": "Item Description",
  "price": 29.99
}
```

## Production Considerations

### Security
- For production, restrict CORS origins to specific domains
- Consider adding authentication (JWT/OAuth2)
- Use environment variables for sensitive data (credentials)
- Implement rate limiting if needed

### Performance
- MongoDB connection pooling is configured by default
- Consider adding indexes to frequently queried fields
- Monitor slow queries in MongoDB Atlas

### Monitoring
- Actuator provides metrics endpoints
- Consider integrating with APM tools
- Set up logging aggregation

## Troubleshooting

### Common Issues
1. **MongoDB Connection Failures**:
   - Verify IP is whitelisted in MongoDB Atlas Network Access
   - Check connection string format
   - Verify database user credentials

2. **Port Conflicts**:
   - Change server.port in application.properties if 8080 is in use
   - Or free up the port: `lsof -ti:8080 | xargs kill -9`

3. **Build Issues**:
   - Ensure Java 21 is being used: `java -version`
   - Clean and rebuild: `mvn clean compile`

## Files Modified/Created
- pom.xml - Updated dependencies and build configuration
- src/main/resources/application.properties - MongoDB configuration
- src/main/java/com/stockup/backend/StockupBackendApplication.java - Main application class
- All source files in the structured packages listed above

## Verification
After setting up MongoDB Atlas IP whitelisting:
1. Application should start without MongoDB connection errors
2. Health check endpoints should return "UP" status
3. CRUD operations should work correctly with MongoDB persistence

## Next Steps for Frontend Integration
1. Whitelist your development machine's IP in MongoDB Atlas
2. Test API endpoints with tools like curl, Postman, or frontend application
3. Integrate with frontend using the REST API endpoints
4. Consider adding pagination and filtering for large datasets
5. Implement authentication if required for your use case

---
*Last updated: $(date)*
*Backend ready for frontend integration once MongoDB Atlas IP whitelisting is completed.*