package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"portafolio-backend/models"
	"portafolio-backend/repositories"
	"strconv"
	"strings"
)

type ProjectController struct {
	repo *repositories.ProjectRepository
}

func NewProjectController(repo *repositories.ProjectRepository) *ProjectController {
	return &ProjectController{repo: repo}
}

// GetAll — Public: GET /api/projects
func (c *ProjectController) GetAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	projects, err := c.repo.GetAll()
	if err != nil {
		http.Error(w, `{"error":"failed to fetch projects"}`, http.StatusInternalServerError)
		return
	}
	if projects == nil {
		projects = []models.Project{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}

// AdminHandler — Protected: GET/POST /api/admin/projects
func (c *ProjectController) AdminHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		c.GetAll(w, r)
	case http.MethodPost:
		c.create(w, r)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// AdminHandlerWithID — Protected: PUT/DELETE /api/admin/projects/:id
func (c *ProjectController) AdminHandlerWithID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/admin/projects/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}
	switch r.Method {
	case http.MethodPut:
		c.update(w, r, id)
	case http.MethodDelete:
		c.deleteProject(w, r, id)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func (c *ProjectController) create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10MB max
		http.Error(w, `{"error":"failed to parse form"}`, http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	if title == "" {
		http.Error(w, `{"error":"title is required"}`, http.StatusBadRequest)
		return
	}

	sortOrder, _ := strconv.Atoi(r.FormValue("sort_order"))

	p := &models.Project{
		Title:        title,
		Description:  r.FormValue("description"),
		Technologies: r.FormValue("technologies"),
		ImageURL:     r.FormValue("image_url"),
		ExternalURL:  r.FormValue("external_url"),
		SortOrder:    sortOrder,
	}

	// Handle cover image file upload (takes priority over image_url)
	if file, header, err := r.FormFile("cover_file"); err == nil {
		defer file.Close()
		coverURL, saveErr := saveCoverFile(file, header)
		if saveErr != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, saveErr.Error()), http.StatusInternalServerError)
			return
		}
		p.ImageURL = coverURL
	}

	id, err := c.repo.Create(p)
	if err != nil {
		http.Error(w, `{"error":"failed to create project"}`, http.StatusInternalServerError)
		return
	}
	p.ID = int(id)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

func (c *ProjectController) update(w http.ResponseWriter, r *http.Request, id int) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, `{"error":"failed to parse form"}`, http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	if title == "" {
		http.Error(w, `{"error":"title is required"}`, http.StatusBadRequest)
		return
	}

	sortOrder, _ := strconv.Atoi(r.FormValue("sort_order"))

	p := &models.Project{
		ID:           id,
		Title:        title,
		Description:  r.FormValue("description"),
		Technologies: r.FormValue("technologies"),
		ImageURL:     r.FormValue("image_url"),
		ExternalURL:  r.FormValue("external_url"),
		SortOrder:    sortOrder,
	}

	// Handle cover image file upload (takes priority over image_url)
	if file, header, err := r.FormFile("cover_file"); err == nil {
		defer file.Close()
		coverURL, saveErr := saveCoverFile(file, header)
		if saveErr != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, saveErr.Error()), http.StatusInternalServerError)
			return
		}
		p.ImageURL = coverURL
	}

	if err := c.repo.Update(p); err != nil {
		http.Error(w, `{"error":"failed to update project"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

func (c *ProjectController) deleteProject(w http.ResponseWriter, r *http.Request, id int) {
	if err := c.repo.Delete(id); err != nil {
		http.Error(w, `{"error":"failed to delete project"}`, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
