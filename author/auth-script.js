// AcademyOne - Auth Script
// Updated to use Global Config and Correct Endpoints

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const authForm = document.getElementById('authForm');
  const toggleBtn = document.getElementById('toggleBtn');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const btnText = document.getElementById('btnText');
  const toggleQuestion = document.getElementById('toggleQuestion');
  const nameGroup = document.getElementById('nameGroup');
  const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
  const forgotPassword = document.getElementById('forgotPassword');
  
  // State
  let isLogin = true;

  // Toggle between login and signup
  toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    
    if (isLogin) {
      // Switch to Login mode
      authTitle.textContent = 'Welcome back';
      authSubtitle.textContent = 'Sign in to continue your learning journey';
      btnText.textContent = 'Sign In';
      toggleQuestion.textContent = "Don't have an account?";
      toggleBtn.textContent = 'Sign up';
      
      // Hide signup fields
      nameGroup.style.display = 'none';
      confirmPasswordGroup.style.display = 'none';
      forgotPassword.style.display = 'flex';
      
      // Remove required from signup fields
      document.getElementById('name').removeAttribute('required');
      document.getElementById('confirmPassword').removeAttribute('required');
    } else {
      // Switch to Signup mode
      authTitle.textContent = 'Get started';
      authSubtitle.textContent = 'Create your account and start learning';
      btnText.textContent = 'Create Account';
      toggleQuestion.textContent = 'Already have an account?';
      toggleBtn.textContent = 'Sign in';
      
      // Show signup fields
      nameGroup.style.display = 'flex';
      confirmPasswordGroup.style.display = 'flex';
      forgotPassword.style.display = 'none';
      
      // Add required to signup fields
      document.getElementById('name').setAttribute('required', 'required');
      document.getElementById('confirmPassword').setAttribute('required', 'required');
    }
  });

  // Handle form submission
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. SAFETY CHECK: Ensure config.js loaded the URL
    if (!window.API_BASE_URL) {
        console.error("Configuration Error: API_BASE_URL is not defined.");
        alert("System error: Could not connect to backend configuration. Please refresh the page.");
        return;
    }

    // 2. PREPARE DATA
    let payload = {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    };

    let endpoint = "";

    // 3. DETERMINE ENDPOINT BASED ON MODE
    if (!isLogin) {
      // --- SIGNUP MODE ---
      const name = document.getElementById('name').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (payload.password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }

      payload.name = name;
      // Points to router.post("/register", ...) in authRoutes.js
      endpoint = "/api/auth/register"; 
    } else {
      // --- LOGIN MODE ---
      // Points to router.post("/login", ...) in authRoutes.js
      endpoint = "/api/auth/login"; 
    }

    // 4. CONSTRUCT FULL URL
    // Combines https://...onrender.com + /api/auth/login
    const fullUrl = `${window.API_BASE_URL}${endpoint}`;
    console.log("Attempting to connect to:", fullUrl); // Debug log

    try {
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Show error from backend (e.g. "User already exists", "Invalid password")
        alert(data.message || "Authentication failed");
        return;
      }

      // 5. SUCCESS: Store Token and Redirect
      // Using localStorage allows the token to persist if the browser closes
      localStorage.setItem("token", data.token); 
      // Also saving to sessionStorage just in case other parts of your app use it
      sessionStorage.setItem("token", data.token);

      alert(isLogin ? "Login successful!" : "Account created successfully!");
      
      // Redirect to the chat page
      window.location.href = "../chat/chat.html";

    } catch (err) {
      console.error("Fetch Error:", err);
      alert("Server error: Unable to connect to the backend. Check your internet connection.");
    }
  });


  // Smooth animations for form fields
  const formInputs = document.querySelectorAll('.form-input');
  formInputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.style.transform = 'translateY(-2px)';
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.style.transform = 'translateY(0)';
    });
  });

  // Parallax effect for floating shapes
  let mouseX = 0;
  let mouseY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth - 0.5;
    mouseY = e.clientY / window.innerHeight - 0.5;
  });
  
  function animateShapes() {
    const shapes = document.querySelectorAll('.shape');
    shapes.forEach((shape, index) => {
      const speed = (index + 1) * 0.3;
      const x = mouseX * speed * 20;
      const y = mouseY * speed * 20;
      
      const currentTransform = window.getComputedStyle(shape).transform;
      shape.style.transform = `translate(${x}px, ${y}px)`;
    });
    
    requestAnimationFrame(animateShapes);
  }
  
  animateShapes();

  console.log('AcademyOne Auth loaded successfully! 🚀');
});