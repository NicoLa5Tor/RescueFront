# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend Development
- `npm run dev` - Start CSS development mode (watches for changes)
- `npm run build-css` - Same as dev, builds CSS with watch mode
- `npm run build-css-prod` - Build CSS for production (minified)
- `npm run build` - Production build (alias for build-css-prod)
- `npm run clean` - Remove generated CSS files

### Python/Flask Application
- `python app.py` - Run Flask development server on port 5050
- `flask run` - Alternative way to run Flask app
- `gunicorn app:app` - Run with Gunicorn for production

### Docker
- `docker build -t ecoes-frontend .` - Build production Docker image
- `docker run -p 5000:5000 ecoes-frontend` - Run containerized app
- `npm run docker:build` and `npm run docker:run` - Package.json shortcuts

## Project Architecture

This is a Flask-based frontend application for the ECOES (Rescue Dashboard) system that communicates with a separate backend API service.

### Core Architecture
- **Frontend Framework**: Flask with Jinja2 templates
- **CSS Framework**: Tailwind CSS (compiled from `static/css/input.css` to `static/css/output.css`)
- **Animation Library**: GSAP for advanced animations
- **Authentication**: JWT tokens stored as HTTPOnly cookies, with Flask sessions for user data
- **API Communication**: Internal proxy (`/proxy/*`) routes all API calls to backend service

### Key Directories Structure
```
├── app.py                 # Main Flask application with routes and authentication
├── utils/
│   ├── config.py         # Centralized configuration management
│   └── api_client.py     # HTTP client for backend API communication
├── templates/            # Jinja2 HTML templates
│   ├── admin/           # Super admin dashboard views
│   ├── empresa/         # Company dashboard views
│   ├── GSAP_Templates/  # Animation templates
│   ├── contact/         # Contact page
│   └── errors/          # Error pages
├── static/
│   ├── css/             # Tailwind CSS and custom styles
│   ├── js/              # Frontend JavaScript modules
│   └── favicon.ico      # Site favicon
```

### Authentication & Authorization System
- **Role-based access control**: `empresa` (company users) and `super_admin` (system administrators)
- **JWT Authentication**: Dual-token system with HTTPOnly cookies for security
  - **Access tokens**: 15 minutes (for API operations)
  - **Refresh tokens**: 7 days (for token renewal)
- **Automatic Token Refresh**: Frontend automatically handles token expiration
  - Detects 401 responses and calls `/proxy/auth/refresh`
  - Retries original request with new token
  - Queues concurrent requests during refresh
- **Session Management**: Flask sessions store user metadata, not tokens
- **Route Protection**: `@require_role(['role'])` decorator enforces access control
- **API Proxy**: `/proxy/<endpoint>` automatically forwards authenticated requests to backend

### Configuration Management
- **Environment Variables**: Uses `.env` file loaded via `python-dotenv`
- **Backend URL**: Configurable via `BACKEND_API_URL` (default: http://localhost:5002)
- **Debug Mode**: Controlled by `DEBUG` environment variable
- **Security**: `SECRET_KEY` for session management, configurable `SESSION_LIFETIME`

### Frontend JavaScript Architecture
- **Modular Structure**: JavaScript organized by feature in `static/js/`
- **API Client**: `static/js/api-client.js` handles API communication with automatic token refresh
- **Token Management**: Automatic refresh token handling with request queuing
- **Authentication**: `static/js/auth-manager.js` manages login/session state
- **Dashboard**: Multiple dashboard variants for different user roles
- **Hardware/Users/Companies**: Dedicated modules for entity management

### CSS Architecture
- **Tailwind CSS**: Primary styling framework with custom configuration
- **Component Styles**: Organized by feature (hardware, dashboard, empresas, etc.)
- **iOS Design System**: Custom iOS-inspired design components
- **GSAP Styles**: Styles for animated components and transitions

### Development Workflow
1. **CSS Development**: Run `npm run dev` to watch for CSS changes
2. **Flask Development**: Run `python app.py` for development server on port 5050
3. **Backend Integration**: Ensure backend API is running on configured URL
4. **Production Build**: Use Docker for containerized deployment

### Key Backend Integration Points
- All API calls go through Flask proxy routes (`/proxy/*`)
- Authentication handled by backend, frontend manages session state
- Real-time data fetched from backend endpoints for dashboards
- Form submissions proxied to backend with authentication cookies

### Environment Variables Required
- `BACKEND_API_URL`: Backend API service URL
- `SECRET_KEY`: Flask session encryption key  
- `DEBUG`: Enable/disable debug mode
- Contact form variables (optional): `RECIPIENT_EMAIL`, `COMPANY_PHONE`, etc.