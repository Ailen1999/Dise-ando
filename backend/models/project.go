package models

type Project struct {
	ID           int    `json:"id"`
	Title        string `json:"title"`
	Description  string `json:"description"`
	Technologies string `json:"technologies"` // JSON array serialized
	ImageURL     string `json:"image_url"`
	ExternalURL  string `json:"external_url"`
	SortOrder    int    `json:"sort_order"`
}
