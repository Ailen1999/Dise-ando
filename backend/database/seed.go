package database

import (
	"database/sql"
	"log"
)

// Seed populates the database with the current hardcoded portfolio data.
// It is idempotent — skips records that already exist.
func Seed(db *sql.DB) error {
	// ── Categories ───────────────────────────────────────────────────────────
	categories := []struct {
		title, description, imageURL string
		sortOrder                    int
	}{
		{
			"Gastronomía",
			"Restaurantes, cafeterías y experiencias culinarias con un enfoque visual exquisito.",
			"https://lh3.googleusercontent.com/aida-public/AB6AXuBKBFgDmEW2At7HA8vv3QuAdST3bblyBDXv-oKIqLKbhtURLSL3LNvziRXn9SzGxUdF7SN7jPAXOgjo4x2TTbfp-ApY3yx7XXfGYbjPLU0PBeAhf9qgVH0T-MydlohukC9jhMwRDRQT3_jSzNRk2zt0br25bo82NSrIJc174cUJMHwAhRvVRPrFazgWTfwieoOgZ37wS88PBML8zuak0ZJ6cGYdqtLNAKjelHtU4rtpVB3NE9aKoLZXW_db5nIWXAqQZsRlr-H-1u0V",
			1,
		},
		{
			"E-commerce",
			"Tiendas online de alto rendimiento diseñadas para convertir y emocionar.",
			"https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800",
			2,
		},
		{
			"Maquillaje",
			"Diseños de alta gama para productos de belleza, cosmética y cuidado personal.",
			"https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=800",
			3,
		},
		{
			"Branding",
			"Sistemas visuales integrales que definen la personalidad y el alma de tu marca.",
			"https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=800",
			4,
		},
	}

	catIDs := map[string]int64{}
	for _, cat := range categories {
		var existingID int64
		err := db.QueryRow(`SELECT id FROM categories WHERE title = ?`, cat.title).Scan(&existingID)
		if err == sql.ErrNoRows {
			res, err := db.Exec(
				`INSERT INTO categories (title, description, image_url, sort_order) VALUES (?, ?, ?, ?)`,
				cat.title, cat.description, cat.imageURL, cat.sortOrder,
			)
			if err != nil {
				return err
			}
			existingID, _ = res.LastInsertId()
			log.Printf("✅ Seeded category: %s (id=%d)", cat.title, existingID)
		}
		catIDs[cat.title] = existingID
	}

	// ── Designs ──────────────────────────────────────────────────────────────
	designs := []struct {
		title, year, imageURL, htmlPath, slug, category string
	}{
		// Gastronomía
		{"Bakery Artisans", "2024", "https://lh3.googleusercontent.com/aida-public/AB6AXuC9p1MCDxd2e6wof-QKbxNR3cOXRaXu-N81AzExhXXr7IOYo51ti9M-sgtFfL2M9Nx_EZhxQUCo_YA5S8UXFIaDpdc83jHcZEemH2AuPpRSCBIfaVJCYBPJ4KFOknqo7QSHftHEmhrh7JS7ND3AUl-60ZM9-Q0dkLv4k1tpmTsrRBvr0SFAzfMM3BCLb5oc_pNK7r1mdMxtszWArIwbAGBxj9t7TZMiunKhlWOka2V1pqXMKdxBxPJF_8hcy0xVAGtJucae5k2G_HuD", "/designs/bakery.html", "bakery-artisans", "Gastronomía"},
		{"L'Élite Patisserie", "2024", "https://lh3.googleusercontent.com/aida-public/AB6AXuCl5Z8UZmZbQH63zF_o7t8GvyNkEAnn-EnZWUH6XZugxgfCd_klZLybWs-3N5w7rj7HSvLYOQhY8wqpv0WYYJXgAoSTwc5g179bT0ycD4LvS63C1JYFYo1BNpD9ojrZdm-y09CgE1n0VUI5Bti0mbGdasUpB1AKqlx0xesY7Z1L-DcSyIpAvh7Ncudz01Ki5Jicb_wusNRtpls7pP05qSRAzJHuXB9Qshzbj7EGy4bTIfRfw2MmA-Gg-8gfuH29B-rt_kuWqxcCZkjA", "/designs/patisserie.html", "lelite-patisserie", "Gastronomía"},
		{"Bakery / Café", "2024", "https://lh3.googleusercontent.com/aida-public/AB6AXuD-B99ECXhs1EQ-uyfl7n0bQm0RltR1TE9MeXjFjxMEMiWyy1JPo8jXTeoObIuoOIVntH6txL9-2PDqFi5FGgZm3RXXW2KrS5CaeewkXZPnzFcFPIhL9JU7wqMPkJsTgy0JHY5xKy5eGslxo74JJKjbc4jqMmFhnflcTIXCzU2x6-Ew-8G0jZvjPAV_i9Q7QK0ews-jEGnxYhFlm3bp-rtaxKNLjWwo-j5w_WVOKSajgHii5MPvN4jv8JPh14tsjSWEr6A2z7fh4Osr", "/designs/bakery-cafe.html", "bakery-cafe", "Gastronomía"},
		{"Sage & Grain", "2024", "https://lh3.googleusercontent.com/aida-public/AB6AXuAfBxR6dg-sm810lspGmJ7lb7g_Aw-cYyv_PgBZBQcsg9NnVKPZITkueMVsyw1lLCwW1X3klUEC581eqIb9odHtr5DbZIZmALmeaZnVffovRwYuFsl-aFRj00NoB2SxfustQMaCdBpNT8qIj3CYnoEma66wPgj2k5QrnDLJpT5ZSvnXT6wIksEE-S3ikGEavbV12cPKaA13n961w4gs6NSjeljyihWjUpc-8MWFdc4W5HaZ7IHaDgVwRlUXmYgZFml7Noj8xOP3cJFh", "/designs/sage-grain.html", "sage-grain", "Gastronomía"},
		{"L'Artisan Boulangerie", "2024", "https://lh3.googleusercontent.com/aida-public/AB6AXuBKBFgDmEW2At7HA8vv3QuAdST3bblyBDXv-oKIqLKbhtURLSL3LNvziRXn9SzGxUdF7SN7jPAXOgjo4x2TTbfp-ApY3yx7XXfGYbjPLU0PBeAhf9qgVH0T-MydlohukC9jhMwRDRQT3_jSzNRk2zt0br25bo82NSrIJc174cUJMHwAhRvVRPrFazgWTfwieoOgZ37wS88PBML8zuak0ZJ6cGYdqtLNAKjelHtU4rtpVB3NE9aKoLZXW_db5nIWXAqQZsRlr-H-1u0V", "/designs/lartisan.html", "lartisan-boulangerie", "Gastronomía"},
		// E-commerce
		{"Velo Fashion", "2024", "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800", "", "velo-fashion", "E-commerce"},
		{"Tech Haven", "2023", "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800", "", "tech-haven", "E-commerce"},
		// Maquillaje
		{"Belletny Home", "2024", "https://images.unsplash.com/photo-1522338223053-ecac10009573?auto=format&fit=crop&q=80&w=800", "/designs/belletny.html", "belletny-home", "Maquillaje"},
		{"Belletny Product", "2024", "https://lh3.googleusercontent.com/aida-public/AB6AXuBNVNTk4UtifZtOnY96YS_uIGQFwplHacoa7jGWcDnps1JQjzp25jhiJtJT5bBNJuWfEydenmKJkH2QILsjYyw0gBsskRN3P5JKJR6WfGVDNd9NBuaffK_k-a_WFbFqbqZSVU02O2I-mf_3YrJeZr1ccvLNPqaw9tf-iDr0NviA-uQWVz5vi6tozYGGFdnlxFvF3GrV3Eaw2xPJ2C-u-s8QGcYkb8iMGNLzjRk4sz_sL9nxvs-4m8suiDswKeq5X5tz3eV3ig9I9EZX", "/designs/belletny-product.html", "belletny-product", "Maquillaje"},
		{"Botanica Rituals", "2024", "https://images.unsplash.com/photo-1556228448-499f83f3c833?auto=format&fit=crop&q=80&w=800", "/designs/botanica-rituals.html", "botanica-rituals", "Maquillaje"},
		{"Botanica Nature", "2024", "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800", "/designs/botanica-nature.html", "botanica-nature", "Maquillaje"},
		{"Botanica Essence", "2024", "https://images.unsplash.com/photo-1594465919760-441fe5908ab0?auto=format&fit=crop&q=80&w=800", "/designs/botanica-essence.html", "botanica-essence", "Maquillaje"},
		// Branding
		{"Nexus Studio", "2024", "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800", "", "nexus-studio", "Branding"},
		{"Elysian Identity", "2023", "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&q=80&w=800", "", "elysian-identity", "Branding"},
	}

	for _, d := range designs {
		var existingID int64
		err := db.QueryRow(`SELECT id FROM designs WHERE slug = ?`, d.slug).Scan(&existingID)
		if err == sql.ErrNoRows {
			catID := catIDs[d.category]
			var catIDPtr *int64
			if catID > 0 {
				catIDPtr = &catID
			}
			_, err = db.Exec(
				`INSERT INTO designs (title, year, category_id, image_url, html_path, slug) VALUES (?, ?, ?, ?, ?, ?)`,
				d.title, d.year, catIDPtr, d.imageURL, d.htmlPath, d.slug,
			)
			if err != nil {
				return err
			}
			log.Printf("✅ Seeded design: %s", d.title)
		}
	}

	// ── Projects ─────────────────────────────────────────────────────────────
	projects := []struct {
		title, description, technologies, imageURL, externalURL string
		sortOrder                                              int
	}{
		{
			"Electrosha",
			"E-Commerce Experience",
			`["React", "Next.js", "Tailwind CSS", "Framer Motion"]`,
			"/electrosha.webp",
			"https://electrosha20.com.ar/",
			1,
		},
		{
			"Cerro Sneakers",
			"E-Commerce Experience",
			`["Next.js", "Strapi", "PostgreSQL", "Tailwind CSS"]`,
			"/cerro_sneakers.webp",
			"https://cerrosneakers23.com.ar/",
			2,
		},
		{
			"Calen Diseño",
			"E-Commerce Experience",
			`["Next.js", "Framer Motion", "GSAP"]`,
			"/calen_preview.webp",
			"https://calen.com.ar/",
			3,
		},
		{
			"Spatial Interface",
			"3D Navigation",
			`["Three.js", "React Three Fiber", "Web Audio API"]`,
			"https://lh3.googleusercontent.com/aida-public/AB6AXuC30_-mwCob3DzWpRSuKfamvaS-miwuxFxXkC_NQQE2WoPH6Whl1fIPs7Unie2d5HtbW0_e_mF-cp5TeUw4FZoE0U5irlgsdWJwEnLoOFE87hwOSzGhBMQZHPx6KbfQT9-4tCwXTgrVBdGz469dw9ETkpO9mqFdQrjSkBtR1ITvaiYsKfkLJ0DHLAK76qNS_5pSk7qakpkdN_EIhteRhQivI5zdAyj5UPG7jnTMmD66Iym2CeJvsDpCg_FHz8xjeR2Mz7FETnKwCUzH",
			"",
			4,
		},
		{
			"Digital Artifacts",
			"Archival Motion",
			`["WebGL", "GLSL", "Three.js"]`,
			"https://lh3.googleusercontent.com/aida-public/AB6AXuDfkDyUOaMe3I0RYt47KStBd6NTWImYgzdLmk7WMFuBh56eC-2l8ggkUBRO-64C7iDQZ93B7F-QOY6Oo6ZalGWLgOkLfkeMPoYQS4U03KoKRey87I2isBMlXF0_CaqzafVqK_D-D_gIfV4Q5toOtsfJklrK5AaZrhFV6yPILgHUsuc22-L0wRXrs5icpGMTRB2MPZO52LazirKT6NpmR23rmF2u2sSW5SLuxrP8aJ_q6oDPNReYelfT4yFTaeiHLM1xxzgmvj72ZkDE",
			"",
			5,
		},
		{
			"Immersive Web",
			"WebVR Experience",
			`["WebXR", "A-Frame", "Three.js"]`,
			"https://lh3.googleusercontent.com/aida-public/AB6AXuAKCXpVBaWQBLLTmhJXPyxXPNkUOlepa89eoItnK9gj7kF7XRibUhOjzAenREmtZUNmaBlcLxBpWt4pszhsRI0-1PM8NHRunH0jQGw5UuVCSoMbgtXhct6JauAYnh9tDulJSCuLZUu9ItxHdzAn7cWC2F94fzKJS_iyWu7_A09cgRR92yMuXHP32C9jeiq8Y5DrzPWr6ojZgtnRJRdkmaHlamUXaWizsvRboDc1zYzsUgkJuI4Cn2eDZH_dwm7eBzO7Kewf9CyLIeyo",
			"",
			6,
		},
	}

	for _, p := range projects {
		var count int
		db.QueryRow(`SELECT COUNT(*) FROM projects WHERE title = ?`, p.title).Scan(&count)
		if count == 0 {
			_, err := db.Exec(
				`INSERT INTO projects (title, description, technologies, image_url, external_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
				p.title, p.description, p.technologies, p.imageURL, p.externalURL, p.sortOrder,
			)
			if err != nil {
				return err
			}
			log.Printf("✅ Seeded project: %s", p.title)
		}
	}

	log.Println("✅ Seed completed")
	return nil
}
