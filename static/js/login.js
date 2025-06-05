// Función para inicializar las animaciones
function initLoginAnimations() {
    console.log("Iniciando animaciones de login...")
  
    // Verificar si GSAP está disponible
    if (typeof window.gsap === "undefined") {
      console.warn("GSAP no está disponible, usando fallback CSS")
      // Fallback con CSS
      const elements = document.querySelectorAll(".fade-in-up, .fade-in-scale")
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.style.opacity = "1"
          el.style.transform = "translateY(0) scale(1)"
          el.style.transition = "all 0.6s ease"
        }, index * 100)
      })
      return
    }
  
    try {
      // Registrar plugins de GSAP (ya están disponibles desde el base.html)
      console.log("GSAP disponible, iniciando animaciones...")
  
      // Configurar estado inicial
      window.gsap.set(".fade-in-up", { opacity: 0, y: 30 })
      window.gsap.set(".fade-in-scale", { opacity: 0, scale: 0.8 })
  
      // Timeline principal
      const tl = window.gsap.timeline({ delay: 0.2 })
  
      tl.to("#loginCard", {
        duration: 0.8,
        opacity: 1,
        y: 0,
        ease: "power3.out",
      })
        .to(
          "#brandLogo",
          {
            duration: 0.6,
            opacity: 1,
            scale: 1,
            ease: "back.out(1.7)",
          },
          "-=0.4",
        )
        .to(
          "#loginTitle",
          {
            duration: 0.6,
            opacity: 1,
            y: 0,
            ease: "power2.out",
          },
          "-=0.3",
        )
        .to(
          "#loginSubtitle",
          {
            duration: 0.6,
            opacity: 1,
            y: 0,
            ease: "power2.out",
          },
          "-=0.2",
        )
        .to(
          ".form-group",
          {
            duration: 0.5,
            opacity: 1,
            y: 0,
            stagger: 0.1,
            ease: "power2.out",
          },
          "-=0.1",
        )
        .to(
          ".forgot-password, .login-footer",
          {
            duration: 0.5,
            opacity: 1,
            y: 0,
            ease: "power2.out",
          },
          "-=0.2",
        )
  
      // Animación sutil del logo
      window.gsap.to("#brandLogo", {
        duration: 8,
        rotation: 360,
        repeat: -1,
        ease: "none",
        transformOrigin: "center",
        delay: 1,
      })
  
      console.log("Animaciones GSAP inicializadas correctamente")
    } catch (error) {
      console.error("Error al inicializar animaciones GSAP:", error)
      // Fallback en caso de error
      const elements = document.querySelectorAll(".fade-in-up, .fade-in-scale")
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.style.opacity = "1"
          el.style.transform = "translateY(0) scale(1)"
          el.style.transition = "all 0.6s ease"
        }, index * 100)
      })
    }
  }
  
  // Función principal del login
  function initLoginForm() {
    console.log("Inicializando formulario de login...")
  
    const API_BASE = window.API_BASE_URL ? `${window.API_BASE_URL}/auth` : "http://localhost:5000/auth"
  
    // Elementos del DOM
    const form = document.getElementById("loginForm")
    const submitBtn = document.getElementById("submitBtn")
    const btnText = document.getElementById("btnText")
    const loginIcon = document.getElementById("loginIcon")
    const loadingSpinner = document.getElementById("loadingSpinner")
    const notificationContainer = document.getElementById("notificationContainer")
  
    if (!form) {
      console.error("loginForm no encontrado en el DOM")
      return
    }
  
    console.log("Elementos del formulario encontrados correctamente")
  
    // Animaciones de focus en inputs
    const inputs = form.querySelectorAll("input")
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        if (typeof window.gsap !== "undefined") {
          window.gsap.to(input, {
            duration: 0.3,
            scale: 1.02,
            ease: "power2.out",
          })
        }
      })
  
      input.addEventListener("blur", () => {
        if (typeof window.gsap !== "undefined") {
          window.gsap.to(input, {
            duration: 0.3,
            scale: 1,
            ease: "power2.out",
          })
        }
      })
    })
  
    // Manejo del formulario
    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      console.log("Formulario enviado")
  
      if (!validateForm()) {
        if (typeof window.gsap !== "undefined") {
          window.gsap.to("#loginCard", {
            duration: 0.1,
            x: -10,
            yoyo: true,
            repeat: 5,
            ease: "power2.inOut",
          })
        }
        return
      }
  
      const payload = {
        usuario: form.usuario.value.trim(),
        password: form.password.value,
      }
  
      console.log("Payload preparado:", { ...payload, password: "***" })
  
      try {
        showLoading("Verificando credenciales...")
  
        const res = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        })
  
        console.log("Respuesta recibida:", res.status)
  
        if (res.ok) {
          const data = await safeJson(res)
          console.log("Datos de respuesta:", data)
  
          if (data?.success || data?.access || data?.token) {
            if (data.token) {
              localStorage.setItem("jwt", data.token)
            }
  
            showNotification(data.message ?? "Inicio de sesión exitoso", "success", 3000)
  
            // Animación de éxito
            if (typeof window.gsap !== "undefined") {
              window.gsap.to("#loginCard", {
                duration: 0.8,
                scale: 0.95,
                opacity: 0,
                y: -30,
                ease: "power2.in",
                onComplete: () => {
                  redirectToPage(data)
                },
              })
            } else {
              setTimeout(() => redirectToPage(data), 1500)
            }
            return
          }
  
          throw createErr(data?.message ?? "Credenciales incorrectas", "warning", 5000)
        }
  
        const errorData = await safeJson(res)
        const errorMessage = errorData?.message || errorData?.error || "Error desconocido"
  
        if (res.status === 400) throw createErr(`Solicitud malformada: ${errorMessage}`, "error", 5000)
        if (res.status === 401) throw createErr("Usuario o contraseña inválidos", "warning", 5000)
        if (res.status === 404) throw createErr("Servicio de autenticación no disponible", "error", 5000)
        if (res.status === 429) throw createErr("Demasiados intentos, espera un momento", "warning", 8000)
  
        throw createErr(`Error del servidor (${res.status}). Intenta más tarde.`, "error", 5000)
      } catch (err) {
        console.error("Error en login:", err)
  
        if (err.name === "TypeError" && err.message.includes("fetch")) {
          showNotification("Error de conexión. Verifica tu conexión a internet.", "error", 6000)
        } else {
          showNotification(err.userMsg ?? "Error inesperado. Intenta nuevamente.", err.type ?? "error", err.ms ?? 5000)
        }
  
        if (typeof window.gsap !== "undefined") {
          window.gsap.to("#loginCard", {
            duration: 0.1,
            x: -10,
            yoyo: true,
            repeat: 5,
            ease: "power2.inOut",
          })
        }
      } finally {
        hideLoading()
      }
    })
  
    function validateForm() {
      let isValid = true
      const formGroups = form.querySelectorAll(".form-group")
  
      formGroups.forEach((group) => {
        const input = group.querySelector("input")
        const errorMsg = group.querySelector(".error-message")
  
        if (!input.value.trim()) {
          showFieldError(input, errorMsg)
          isValid = false
        } else {
          hideFieldError(input, errorMsg)
        }
      })
  
      return isValid
    }
  
    function showFieldError(input, errorMsg) {
      input.classList.add("error")
      if (errorMsg) {
        errorMsg.classList.add("show")
      }
    }
  
    function hideFieldError(input, errorMsg) {
      input.classList.remove("error")
      if (errorMsg) {
        errorMsg.classList.remove("show")
      }
    }
  
    function showLoading(message = "Cargando...") {
      submitBtn.disabled = true
      btnText.textContent = message
      loginIcon.classList.add("hidden")
      loadingSpinner.classList.remove("hidden")
    }
  
    function hideLoading() {
      submitBtn.disabled = false
      btnText.textContent = "Iniciar Sesión"
      loginIcon.classList.remove("hidden")
      loadingSpinner.classList.add("hidden")
    }
  
    function redirectToPage(data) {
      const redirectUrl = data.redirect || data.redirect_url || "/admin"
  
      if (redirectUrl.startsWith("http")) {
        window.location.href = redirectUrl
      } else {
        const baseUrl = window.location.origin
        window.location.href = baseUrl + (redirectUrl.startsWith("/") ? "" : "/") + redirectUrl
      }
    }
  
    function showNotification(message, type = "info", duration = 4000) {
      console.log("Mostrando notificación:", message, type)
  
      // Usar SweetAlert2 si está disponible
      if (window.Swal) {
        const Toast = window.Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: duration,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener("mouseenter", window.Swal.stopTimer)
            toast.addEventListener("mouseleave", window.Swal.resumeTimer)
          },
        })
  
        Toast.fire({
          icon: type,
          title: message,
        })
        return
      }
  
      // Fallback a notificaciones personalizadas
      const notification = document.createElement("div")
      notification.className = `notification ${type}`
      notification.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
        <span>${message}</span>
      `
  
      notificationContainer.appendChild(notification)
  
      if (typeof window.gsap !== "undefined") {
        window.gsap.fromTo(notification, { opacity: 0, x: 100 }, { duration: 0.5, opacity: 1, x: 0, ease: "power2.out" })
      }
  
      setTimeout(() => {
        if (typeof window.gsap !== "undefined") {
          window.gsap.to(notification, {
            duration: 0.3,
            opacity: 0,
            x: 100,
            ease: "power2.in",
            onComplete: () => notification.remove(),
          })
        } else {
          notification.remove()
        }
      }, duration)
    }
  
    async function safeJson(res) {
      try {
        return await res.json()
      } catch (error) {
        console.warn("Error parsing JSON:", error)
        return null
      }
    }
  
    function createErr(userMsg, type = "error", ms = 4000) {
      const e = new Error(userMsg)
      e.userMsg = userMsg
      e.type = type
      e.ms = ms
      return e
    }
  
    console.log("Formulario de login inicializado correctamente")
  }
  
  // Inicializar cuando el DOM esté listo
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM cargado, inicializando login...")
  
    // Esperar un poco para que GSAP se cargue completamente
    setTimeout(() => {
      initLoginAnimations()
      initLoginForm()
    }, 200)
  })
  
  // Fallback si el DOM ya está cargado
  if (document.readyState !== "loading") {
    console.log("DOM ya estaba cargado, inicializando login...")
    setTimeout(() => {
      initLoginAnimations()
      initLoginForm()
    }, 200)
  }
  