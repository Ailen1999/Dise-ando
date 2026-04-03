package router

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"portafolio-backend/controllers"
	"portafolio-backend/middleware"
	"portafolio-backend/repositories"
)

// Setup configures all routes and returns the mux.
func Setup(db *sql.DB) *http.ServeMux {
	catRepo := repositories.NewCategoryRepository(db)
	designRepo := repositories.NewDesignRepository(db)
	projectRepo := repositories.NewProjectRepository(db)

	catCtrl := controllers.NewCategoryController(catRepo)
	designCtrl := controllers.NewDesignController(designRepo)
	projectCtrl := controllers.NewProjectController(projectRepo)

	mux := http.NewServeMux()

	// ── Health check ────────────────────────────────────────────────────────
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// ── Public API ───────────────────────────────────────────────────────────
	mux.HandleFunc("/api/categories", catCtrl.GetAll)
	mux.HandleFunc("/api/designs", designCtrl.GetAll)
	mux.HandleFunc("/api/projects", projectCtrl.GetAll)

	// ── Admin Auth ───────────────────────────────────────────────────────────
	mux.HandleFunc("/api/admin/login", controllers.Login)

	// ── Protected Admin routes ───────────────────────────────────────────────
	protected := http.NewServeMux()

	// Categories admin
	protected.HandleFunc("/api/admin/categories", catCtrl.AdminHandler)
	protected.HandleFunc("/api/admin/categories/", catCtrl.AdminHandlerWithID)

	// Designs admin
	protected.HandleFunc("/api/admin/designs", designCtrl.AdminHandler)
	protected.HandleFunc("/api/admin/designs/", designCtrl.AdminHandlerWithID)

	// Projects admin
	protected.HandleFunc("/api/admin/projects", projectCtrl.AdminHandler)
	protected.HandleFunc("/api/admin/projects/", projectCtrl.AdminHandlerWithID)

	mux.Handle("/api/admin/", middleware.AuthMiddleware(protected))

	return mux
}
