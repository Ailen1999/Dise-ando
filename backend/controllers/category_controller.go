package controllers

import (
	"encoding/json"
	"net/http"
	"portafolio-backend/models"
	"portafolio-backend/repositories"
	"strconv"
	"strings"
)

type CategoryController struct {
	repo *repositories.CategoryRepository
}

func NewCategoryController(repo *repositories.CategoryRepository) *CategoryController {
	return &CategoryController{repo: repo}
}

// GetAll — Public: GET /api/categories
func (c *CategoryController) GetAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	cats, err := c.repo.GetAll()
	if err != nil {
		http.Error(w, `{"error":"failed to fetch categories"}`, http.StatusInternalServerError)
		return
	}
	if cats == nil {
		cats = []models.Category{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cats)
}

// AdminHandler — Protected: POST /api/admin/categories
func (c *CategoryController) AdminHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		c.GetAll(w, r)
	case http.MethodPost:
		c.create(w, r)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// AdminHandlerWithID — Protected: PUT/DELETE /api/admin/categories/:id
func (c *CategoryController) AdminHandlerWithID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/admin/categories/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error":"invalid id"}`, http.StatusBadRequest)
		return
	}
	switch r.Method {
	case http.MethodPut:
		c.update(w, r, id)
	case http.MethodDelete:
		c.delete(w, r, id)
	default:
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

func (c *CategoryController) create(w http.ResponseWriter, r *http.Request) {
	var cat models.Category
	if err := json.NewDecoder(r.Body).Decode(&cat); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}
	if cat.Title == "" {
		http.Error(w, `{"error":"title is required"}`, http.StatusBadRequest)
		return
	}
	id, err := c.repo.Create(&cat)
	if err != nil {
		http.Error(w, `{"error":"failed to create category"}`, http.StatusInternalServerError)
		return
	}
	cat.ID = int(id)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cat)
}

func (c *CategoryController) update(w http.ResponseWriter, r *http.Request, id int) {
	var cat models.Category
	if err := json.NewDecoder(r.Body).Decode(&cat); err != nil {
		http.Error(w, `{"error":"invalid body"}`, http.StatusBadRequest)
		return
	}
	cat.ID = id
	if err := c.repo.Update(&cat); err != nil {
		http.Error(w, `{"error":"failed to update category"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cat)
}

func (c *CategoryController) delete(w http.ResponseWriter, r *http.Request, id int) {
	force := r.URL.Query().Get("force") == "true"
	if !force {
		count, err := c.repo.CountDesigns(id)
		if err != nil {
			http.Error(w, `{"error":"failed to check designs"}`, http.StatusInternalServerError)
			return
		}
		if count > 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":        "category has designs",
				"design_count": count,
				"message":      "Add ?force=true to delete anyway",
			})
			return
		}
	}
	if err := c.repo.Delete(id); err != nil {
		http.Error(w, `{"error":"failed to delete category"}`, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
