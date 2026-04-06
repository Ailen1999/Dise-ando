# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install build dependencies for SQLite (CGO required by modernc.org/sqlite is pure-Go, no CGO needed)
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o portafolio-backend .

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM alpine:3.20

WORKDIR /app

# Create directory for the SQLite database volume
RUN mkdir -p /app/data

COPY --from=builder /app/portafolio-backend .

EXPOSE 8080

CMD ["./portafolio-backend"]
