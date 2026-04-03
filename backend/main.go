package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"portafolio-backend/database"
	"portafolio-backend/router"

	"github.com/rs/cors"
)

func main() {
	// Initialize database
	db, err := database.Init()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Seed initial data (idempotent — skips existing records)
	log.Println("🌱 Starting database seeding...")
	if err := database.Seed(db); err != nil {
		log.Printf("⚠️  Seed warning: %v", err)
	}
	log.Println("🌱 Seeding finished")

	// Setup router
	mux := router.Setup(db)

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", getEnv("FRONTEND_URL", "http://localhost:3000")},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})
	handler := c.Handler(mux)

	port := getEnv("PORT", "8080")
	fmt.Printf("🚀 Portafolio backend running on http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
