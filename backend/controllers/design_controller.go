package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"portafolio-backend/models"
	"portafolio-backend/repositories"
	"strconv"
	"strings"
	"time"
)

type DesignController struct {
	repo *repositories.DesignRepository
}

func NewDesignController(repo *repositories.DesignRepository) *DesignController {
	return &DesignController{repo: repo}
}

// GetAll — Public: GET /api/designs?categoryId=X
func (c *DesignController) GetAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	var categoryID *int
	if catStr := r.URL.Query().Get("categoryId"); catStr != "" {
		id, err := strconv.Atoi(catStr)
		if err == nil {
			categoryID = &id
		}
	}
	designs, err := c.repo.GetAll(categoryID)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch designs"}`, http.StatusInternalServerError)
		return
	}
	if designs == nil {
		designs = []models.Design{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(designs)
}

// AdminHandler — Protected: GET/POST /api/admin/designs
func (c *DesignController) AdminHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		c.GetAll(w, r)
	case http.MethodPost:
		c.create(w, r)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// AdminHandlerWithID — Protected: PUT/DELETE /api/admin/designs/:id
func (c *DesignController) AdminHandlerWithID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/admin/designs/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}
	switch r.Method {
	case http.MethodPut:
		c.update(w, r, id)
	case http.MethodDelete:
		c.deleteDesign(w, r, id)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// create handles multipart/form-data with metadata + optional HTML file
func (c *DesignController) create(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10MB max
		http.Error(w, `{"error":"failed to parse form"}`, http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	if title == "" {
		http.Error(w, `{"error":"title is required"}`, http.StatusBadRequest)
		return
	}

	slug := generateSlug(title)
	exists, _ := c.repo.SlugExists(slug, 0)
	if exists {
		slug = slug + "-" + strconv.FormatInt(time.Now().UnixNano(), 36)
	}

	design := &models.Design{
		Title:    title,
		Year:     r.FormValue("year"),
		ImageURL: r.FormValue("image_url"),
		Slug:     slug,
	}

	if catIDStr := r.FormValue("category_id"); catIDStr != "" {
		id, err := strconv.Atoi(catIDStr)
		if err == nil {
			design.CategoryID = &id
		}
	}

	// Handle cover image file upload (takes priority over image_url)
	if file, header, err := r.FormFile("cover_file"); err == nil {
		defer file.Close()
		coverURL, saveErr := saveCoverFile(file, header)
		if saveErr != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, saveErr.Error()), http.StatusInternalServerError)
			return
		}
		design.ImageURL = coverURL
	}

	// Handle HTML file upload
	if file, _, err := r.FormFile("html_file"); err == nil {
		defer file.Close()
		htmlPath, saveErr := saveHTMLFile(file, slug)
		if saveErr != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, saveErr.Error()), http.StatusInternalServerError)
			return
		}
		design.HTMLPath = htmlPath
	}

	id, err := c.repo.Create(design)
	if err != nil {
		http.Error(w, `{"error":"failed to create design"}`, http.StatusInternalServerError)
		return
	}
	design.ID = int(id)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(design)
}

func (c *DesignController) update(w http.ResponseWriter, r *http.Request, id int) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, `{"error":"failed to parse form"}`, http.StatusBadRequest)
		return
	}

	existing, err := c.repo.GetByID(id)
	if err != nil || existing == nil {
		http.Error(w, `{"error":"design not found"}`, http.StatusNotFound)
		return
	}

	if title := r.FormValue("title"); title != "" {
		existing.Title = title
	}
	if year := r.FormValue("year"); year != "" {
		existing.Year = year
	}
	if imageURL := r.FormValue("image_url"); imageURL != "" {
		existing.ImageURL = imageURL
	}
	if catIDStr := r.FormValue("category_id"); catIDStr != "" {
		catID, err := strconv.Atoi(catIDStr)
		if err == nil {
			existing.CategoryID = &catID
		}
	}

	// Replace cover image if a new file is uploaded
	if file, header, err := r.FormFile("cover_file"); err == nil {
		defer file.Close()
		coverURL, saveErr := saveCoverFile(file, header)
		if saveErr != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, saveErr.Error()), http.StatusInternalServerError)
			return
		}
		existing.ImageURL = coverURL
	}

	// Replace HTML file if a new one is uploaded
	if file, _, err := r.FormFile("html_file"); err == nil {
		defer file.Close()
		htmlPath, saveErr := saveHTMLFile(file, existing.Slug)
		if saveErr != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, saveErr.Error()), http.StatusInternalServerError)
			return
		}
		existing.HTMLPath = htmlPath
	}

	if err := c.repo.Update(existing); err != nil {
		http.Error(w, `{"error":"failed to update design"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(existing)
}

func (c *DesignController) deleteDesign(w http.ResponseWriter, r *http.Request, id int) {
	existing, err := c.repo.GetByID(id)
	if err != nil || existing == nil {
		http.Error(w, `{"error":"design not found"}`, http.StatusNotFound)
		return
	}

	// Remove HTML file from disk
	if existing.HTMLPath != "" {
		_ = os.Remove(existing.HTMLPath)
	}

	if err := c.repo.Delete(id); err != nil {
		http.Error(w, `{"error":"failed to delete design"}`, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// saveHTMLFile saves the uploaded HTML to the frontend public/designs directory
func saveHTMLFile(file io.Reader, slug string) (string, error) {
	designsDir := "../frontend/public/designs"
	if err := os.MkdirAll(designsDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create designs directory: %w", err)
	}

	content, err := io.ReadAll(io.LimitReader(file, 5<<20)) // 5MB limit
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	filePath := fmt.Sprintf("%s/%s.html", designsDir, slug)
	if err := os.WriteFile(filePath, content, 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	return fmt.Sprintf("/designs/%s.html", slug), nil
}

