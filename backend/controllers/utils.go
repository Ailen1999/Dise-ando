package controllers

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

// saveCoverFile saves an uploaded image to the frontend public/covers directory
func saveCoverFile(file multipart.File, header *multipart.FileHeader) (string, error) {
	coversDir := "../frontend/public/covers"
	if err := os.MkdirAll(coversDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create covers directory: %w", err)
	}

	// Keep extension, sanitize filename
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
	if !allowed[ext] {
		return "", fmt.Errorf("tipo de imagen no permitido: %s", ext)
	}

	baseName := strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename))
	safeBase := regexp.MustCompile(`[^a-zA-Z0-9_-]`).ReplaceAllString(baseName, "_")
	fileName := fmt.Sprintf("%s_%d%s", safeBase, time.Now().UnixNano(), ext)

	content, err := io.ReadAll(io.LimitReader(file, 10<<20)) // 10MB limit
	if err != nil {
		return "", fmt.Errorf("failed to read image: %w", err)
	}

	filePath := filepath.Join(coversDir, fileName)
	if err := os.WriteFile(filePath, content, 0644); err != nil {
		return "", fmt.Errorf("failed to write image: %w", err)
	}

	return fmt.Sprintf("/covers/%s", fileName), nil
}

// generateSlug converts a title to a URL-friendly slug (no external deps)
func generateSlug(title string) string {
	// Transliterate common accented chars manually
	replacer := strings.NewReplacer(
		"á", "a", "à", "a", "â", "a", "ã", "a", "ä", "a",
		"é", "e", "è", "e", "ê", "e", "ë", "e",
		"í", "i", "ì", "i", "î", "i", "ï", "i",
		"ó", "o", "ò", "o", "ô", "o", "õ", "o", "ö", "o",
		"ú", "u", "ù", "u", "û", "u", "ü", "u",
		"ñ", "n", "ç", "c",
		"Á", "a", "À", "a", "É", "e", "È", "e",
		"Í", "i", "Ì", "i", "Ó", "o", "Ò", "o",
		"Ú", "u", "Ù", "u", "Ñ", "n", "Ç", "c",
	)
	normalized := replacer.Replace(strings.ToLower(title))

	// Replace spaces and special chars with hyphens
	re := regexp.MustCompile(`[^a-z0-9]+`)
	slug := re.ReplaceAllString(normalized, "-")
	slug = strings.Trim(slug, "-")
	return slug
}
