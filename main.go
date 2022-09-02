package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"text/template"
	"time"

	"github.com/gorilla/mux"
)

// Number of test pages we generate
const NUMBEROFTESTS int = 1000

// PageData includes the information of page templates
type PageData struct {
	PageTitle string
	Tests     []int
}

// Beacon includes information we receive from POST requests
type Beacon struct {
	PageURL string   `json:"pageURL"`
	Tests   []string `json:"tests"`
}

// Handler includes template and the test id list
type Handler struct {
	Tmpl  *template.Template
	Tests []int
}

func (h *Handler) testList(w http.ResponseWriter, r *http.Request) {
	// Return a 200 status code
	w.WriteHeader(http.StatusOK)

	// Load the list template and return the list of tests
	data := PageData{
		PageTitle: "List of tests",
		Tests:     h.Tests,
	}
	h.Tmpl.ExecuteTemplate(w, "index.html", data)
}

func (h *Handler) testPage(w http.ResponseWriter, r *http.Request) {
	// Get ID from URL
	testID, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// If the test is out of range return an error
	if testID >= NUMBEROFTESTS {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	// Return a 200 status code
	w.WriteHeader(http.StatusOK)

	// Page title includes the page ID and is used as key to identify tests
	testName := fmt.Sprintf("TestPage%d", testID)

	// Load and return the test page template
	data := PageData{
		PageTitle: testName,
	}
	h.Tmpl.ExecuteTemplate(w, "testpage.html", data)
}

// handleBeacon handles POST messages and prints results to the output.log file
func (h *Handler) handleBeacon(w http.ResponseWriter, r *http.Request) {
	// Setting headers to allow CORS connections
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// handle preflight CORS requests
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	renderTime := time.Now().UnixMilli()
	userAgent := r.UserAgent()

	// Decode the POST message
	var b Beacon
	err := json.NewDecoder(r.Body).Decode(&b)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get the Req IP and X-FORWARDED-FOR headers from the request
	ip := r.RemoteAddr
	forward := r.Header.Get("X-Forwarded-For")
	if forward == "" {
		forward = "-"
	}

	// Print POST messages in the output.log file
	log.Println(ip, forward, renderTime, fmt.Sprintf("\"%s\"", userAgent), b.PageURL, b.Tests)

	// Respond with a JSON object
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "ok",
	})
}

func main() {

	// Create output folder if not exists
	_, err := os.Stat("output")

	if os.IsNotExist(err) {
		errDir := os.MkdirAll("output", 0755)
		if errDir != nil {
			log.Fatal(err)
		}

	}
	// Create the output.log file to print results
	f, err := os.OpenFile("./output/output.log", os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	log.SetFlags(0)
	log.SetOutput(f)

	// Create list of tests based on NUMBEROFTESTS
	tests := make([]int, NUMBEROFTESTS)
	for i := 1; i < len(tests); i++ {
		tests[i] = i
	}

	handlers := &Handler{
		Tmpl:  template.Must(template.ParseGlob("./templates/*.html")),
		Tests: tests,
	}

	// Set handlers
	r := mux.NewRouter()
	r.HandleFunc("/", handlers.testList)
	r.HandleFunc("/testpage/{id:[0-9]+}", handlers.testPage)
	r.HandleFunc("/b", handlers.handleBeacon).Methods("POST", "OPTIONS")
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static/")))
	http.Handle("/", r)

	server := &http.Server{
		Addr:              "0.0.0.0:9007",
		Handler:           r,
		IdleTimeout:       30 * time.Second,
		WriteTimeout:      180 * time.Second,
		ReadHeaderTimeout: 15 * time.Second,
		ReadTimeout:       15 * time.Second,
	}

	err = server.ListenAndServe()
	if err != nil {
		log.Fatal("Error starting the server:", err)
	}

}
