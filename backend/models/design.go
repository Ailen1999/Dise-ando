package models

import "time"

type Design struct {
	ID         int       `json:"id"`
	Title      string    `json:"title"`
	Year       string    `json:"year"`
	CategoryID *int      `json:"category_id"`
	ImageURL   string    `json:"image_url"`
	HTMLPath   string    `json:"html_path"`
	Slug       string    `json:"slug"`
	CreatedAt  time.Time `json:"created_at"`
}
