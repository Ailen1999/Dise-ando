package repositories

import (
	"database/sql"
	"portafolio-backend/models"
)

type ProjectRepository struct {
	db *sql.DB
}

func NewProjectRepository(db *sql.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

func (r *ProjectRepository) GetAll() ([]models.Project, error) {
	rows, err := r.db.Query(`SELECT id, title, description, technologies, image_url, external_url, sort_order FROM projects ORDER BY sort_order ASC, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		if err := rows.Scan(&p.ID, &p.Title, &p.Description, &p.Technologies, &p.ImageURL, &p.ExternalURL, &p.SortOrder); err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	return projects, nil
}

func (r *ProjectRepository) GetByID(id int) (*models.Project, error) {
	var p models.Project
	err := r.db.QueryRow(`SELECT id, title, description, technologies, image_url, external_url, sort_order FROM projects WHERE id=?`, id).
		Scan(&p.ID, &p.Title, &p.Description, &p.Technologies, &p.ImageURL, &p.ExternalURL, &p.SortOrder)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &p, err
}

func (r *ProjectRepository) Create(p *models.Project) (int64, error) {
	res, err := r.db.Exec(
		`INSERT INTO projects (title, description, technologies, image_url, external_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
		p.Title, p.Description, p.Technologies, p.ImageURL, p.ExternalURL, p.SortOrder,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *ProjectRepository) Update(p *models.Project) error {
	_, err := r.db.Exec(
		`UPDATE projects SET title=?, description=?, technologies=?, image_url=?, external_url=?, sort_order=? WHERE id=?`,
		p.Title, p.Description, p.Technologies, p.ImageURL, p.ExternalURL, p.SortOrder, p.ID,
	)
	return err
}

func (r *ProjectRepository) Delete(id int) error {
	_, err := r.db.Exec(`DELETE FROM projects WHERE id=?`, id)
	return err
}
