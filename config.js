// config.js
// This sets the global variable window.API_BASE_URL
// It checks if you are on localhost or the live site

const hostname = window.location.hostname;

if (hostname === "localhost" || hostname === "127.0.0.1") {
    window.API_BASE_URL = "http://localhost:5000";
} else {
    window.API_BASE_URL = "  https://academyone-backend.onrender.com/api/auth/login"; 
}

console.log("API URL set to:", window.API_BASE_URL);