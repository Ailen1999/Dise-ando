package repositories

import (
	"database/sql"
	"portafolio-backend/models"
)

type CategoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) GetAll() ([]models.Category, error) {
	rows, err := r.db.Query(`SELECT id, title, description, image_url, sort_order, created_at FROM categories ORDER BY sort_order ASC, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []models.Category
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.ImageURL, &c.SortOrder, &c.CreatedAt); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	return cats, nil
}

func (r *CategoryRepository) GetByID(id int) (*models.Category, error) {
	var c models.Category
	err := r.db.QueryRow(`SELECT id, title, description, image_url, sort_order, created_at FROM categories WHERE id = ?`, id).
		Scan(&c.ID, &c.Title, &c.Description, &c.ImageURL, &c.SortOrder, &c.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &c, err
}

func (r *CategoryRepository) Create(c *models.Category) (int64, error) {
	res, err := r.db.Exec(
		`INSERT INTO categories (title, description, image_url, sort_order) VALUES (?, ?, ?, ?)`,
		c.Title, c.Description, c.ImageURL, c.SortOrder,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *CategoryRepository) Update(c *models.Category) error {
	_, err := r.db.Exec(
		`UPDATE categories SET title=?, description=?, image_url=?, sort_order=? WHERE id=?`,
		c.Title, c.Description, c.ImageURL, c.SortOrder, c.ID,
	)
	return err
}

func (r *CategoryRepository) Delete(id int) error {
	_, err := r.db.Exec(`DELETE FROM categories WHERE id=?`, id)
	return err
}

func (r *CategoryRepository) CountDesigns(categoryID int) (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM designs WHERE category_id=?`, categoryID).Scan(&count)
	return count, err
}
