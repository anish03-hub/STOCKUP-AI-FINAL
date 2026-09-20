# ── Stage 1: Build JAR ───────────────────────────────────────────────
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy pom.xml and download dependencies for caching
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and resource files
COPY src ./src
COPY medicines_2020_2025.csv ./src/main/resources/medicines_2020_2025.csv

# Package application
RUN mvn clean package -DskipTests -B

# ── Stage 2: Production Runtime ──────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy compiled JAR
COPY --from=builder /build/target/stockup-backend-*.jar app.jar

# Copy supporting data assets
COPY medicines_2020_2025.csv ./medicines_2020_2025.csv
COPY ml ./ml

# Default environment variables
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=25s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
