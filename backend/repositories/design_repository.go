package repositories

import (
	"database/sql"
	"portafolio-backend/models"
)

type DesignRepository struct {
	db *sql.DB
}

func NewDesignRepository(db *sql.DB) *DesignRepository {
	return &DesignRepository{db: db}
}

func (r *DesignRepository) GetAll(categoryID *int) ([]models.Design, error) {
	query := `SELECT id, title, year, category_id, image_url, html_path, slug, created_at FROM designs`
	args := []interface{}{}
	if categoryID != nil {
		query += ` WHERE category_id = ?`
		args = append(args, *categoryID)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var designs []models.Design
	for rows.Next() {
		var d models.Design
		if err := rows.Scan(&d.ID, &d.Title, &d.Year, &d.CategoryID, &d.ImageURL, &d.HTMLPath, &d.Slug, &d.CreatedAt); err != nil {
			return nil, err
		}
		designs = append(designs, d)
	}
	return designs, nil
}

func (r *DesignRepository) GetByID(id int) (*models.Design, error) {
	var d models.Design
	err := r.db.QueryRow(`SELECT id, title, year, category_id, image_url, html_path, slug, created_at FROM designs WHERE id=?`, id).
		Scan(&d.ID, &d.Title, &d.Year, &d.CategoryID, &d.ImageURL, &d.HTMLPath, &d.Slug, &d.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &d, err
}

func (r *DesignRepository) SlugExists(slug string, excludeID int) (bool, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM designs WHERE slug=? AND id != ?`, slug, excludeID).Scan(&count)
	return count > 0, err
}

func (r *DesignRepository) Create(d *models.Design) (int64, error) {
	res, err := r.db.Exec(
		`INSERT INTO designs (title, year, category_id, image_url, html_path, slug) VALUES (?, ?, ?, ?, ?, ?)`,
		d.Title, d.Year, d.CategoryID, d.ImageURL, d.HTMLPath, d.Slug,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *DesignRepository) Update(d *models.Design) error {
	_, err := r.db.Exec(
		`UPDATE designs SET title=?, year=?, category_id=?, image_url=?, html_path=?, slug=? WHERE id=?`,
		d.Title, d.Year, d.CategoryID, d.ImageURL, d.HTMLPath, d.Slug, d.ID,
	)
	return err
}

func (r *DesignRepository) Delete(id int) error {
	_, err := r.db.Exec(`DELETE FROM designs WHERE id=?`, id)
	return err
}
