# Motofy Frontend (AngularJS 1.x)

## Project Structure

```
Motofy-Frontend/
  index.html
  app/
    app.module.js
    app.routes.js
    services/
      api.service.js
    controllers/
      main.controller.js
      auth.controller.js
      car.controller.js
      booking.controller.js
      admin.controller.js
      ai.controller.js
    views/
      home.html
      login.html
      signup.html
      car-list.html
      car-detail.html
      booking.html
      admin.html
      ai-chat.html
    assets/
      css/
        styles.css
      images/
```

## How to Run (Development)
1. Open `index.html` in your browser. (No build step needed for AngularJS 1.x)
2. Make sure your backend is running (default: http://localhost:5000).
3. All API URLs are configured in `app/services/api.service.js`.

## How to Edit
- **Text/Labels:** Edit the HTML files in `app/views/`.
- **Styles/Colors:** Edit `app/assets/css/styles.css`.
- **Logic/API:** Edit the relevant controller or service in `app/controllers/` or `app/services/`.

## Adding Features
- Add a new controller and view for each new feature.
- Register new routes in `app.routes.js`.

## Need Help?
- All code is commented for clarity.
- Ask for help or explanations at any time! 