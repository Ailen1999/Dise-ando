package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"strings"
)

// ContactRequest is the JSON body expected from the contact form.
type ContactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
}

// Contact handles POST /api/contact
func Contact(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req ContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid JSON body"}`, http.StatusBadRequest)
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	req.Message = strings.TrimSpace(req.Message)

	if req.Name == "" || req.Email == "" || req.Message == "" {
		http.Error(w, `{"error":"name, email and message are required"}`, http.StatusBadRequest)
		return
	}

	if err := sendEmail(req); err != nil {
		log.Printf("❌ Failed to send contact email: %v", err)
		http.Error(w, `{"error":"failed to send email"}`, http.StatusInternalServerError)
		return
	}

	log.Printf("✉️  Contact email sent from %s <%s>", req.Name, req.Email)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// sendEmail sends the contact form data via SMTP.
func sendEmail(req ContactRequest) error {
	smtpHost := getenvOrDefault("SMTP_HOST", "smtp.gmail.com")
	smtpPort := getenvOrDefault("SMTP_PORT", "587")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	toAddr := getenvOrDefault("CONTACT_TO", "ailenvera2021@gmail.com")

	if smtpUser == "" || smtpPass == "" {
		return fmt.Errorf("SMTP_USER or SMTP_PASS not configured")
	}

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	subject := fmt.Sprintf("Nuevo contacto de %s — Studio 99", req.Name)
	body := buildEmailBody(req)

	msg := []byte(fmt.Sprintf(
		"To: %s\r\nFrom: Studio 99 <%s>\r\nReply-To: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		toAddr, smtpUser, req.Email, subject, body,
	))

	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	return smtp.SendMail(addr, auth, smtpUser, []string{toAddr}, msg)
}

func buildEmailBody(req ContactRequest) string {
	return fmt.Sprintf(
		"Recibiste un nuevo mensaje desde el formulario de contacto de Studio 99.\n\n"+
			"──────────────────────────────\n"+
			"Nombre:  %s\n"+
			"Email:   %s\n"+
			"──────────────────────────────\n\n"+
			"Mensaje:\n%s\n\n"+
			"──────────────────────────────\n"+
			"Podés responder directamente a este email para contactar a %s.",
		req.Name, req.Email, req.Message, req.Name,
	)
}

func getenvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
