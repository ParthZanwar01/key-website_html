# Key Club Hub - Web Application

A comprehensive web-based application for managing Key Club activities, events, and member interactions. This application was converted from a React Native/Expo mobile app to a modern web application using HTML, CSS, and JavaScript.

## 🚀 Features

### Authentication System
- **Student Login**: S-Number based authentication
- **Admin Login**: Email-based admin authentication
- **Student Registration**: New member account creation
- **Password Reset**: Secure password recovery system

### Event Management
- **Event Creation**: Admins can create new events with details
- **Event Viewing**: Members can browse and view event details
- **Event Sign-up**: Students can register for events
- **Event Management**: Admins can edit and delete events
- **Public Events**: Public view of upcoming events

### Hour Tracking System
- **Hour Requests**: Students can submit hour requests for activities
- **Admin Review**: Admins can approve or reject hour requests
- **Progress Tracking**: Visual progress indicators for hour goals
- **Request History**: Complete history of submitted requests

### Meeting Management
- **Attendance Codes**: Generate unique codes for meetings
- **Attendance Tracking**: Record and manage meeting attendance
- **Meeting History**: View past meetings and attendance records

### Announcements
- **Create Announcements**: Admins can post club announcements
- **View Announcements**: Members can read current announcements
- **Announcement Management**: Edit and delete announcements

### Student Management
- **Student Directory**: Admin view of all registered students
- **Student Profiles**: View individual student information
- **Account Management**: Update student account details

### Support System
- **Contact Form**: Submit questions and support requests
- **Help Resources**: Access to help documentation
- **Support Management**: Admin tools for managing support requests

## 🛠️ Technical Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with animations and responsive design
- **JavaScript (ES6+)**: Modular architecture with modern JavaScript features

### Architecture
- **Single Page Application (SPA)**: Smooth navigation without page reloads
- **Modular Design**: Separated concerns with dedicated modules
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Progressive Enhancement**: Core functionality works without JavaScript

### Key Modules
- **Config**: Centralized application configuration
- **Utils**: Utility functions and helpers
- **Auth**: Authentication and user management
- **API**: Data fetching and backend simulation
- **Navigation**: Screen management and routing
- **Screens**: Individual screen logic and rendering
- **App**: Main application orchestrator

## 📁 Project Structure

```
key-website_html/
├── index.html              # Main HTML file
├── styles/
│   ├── main.css           # Core styling and layout
│   ├── components.css     # Reusable component styles
│   └── animations.css     # CSS animations and transitions
├── js/
│   ├── config.js          # Application configuration
│   ├── utils.js           # Utility functions
│   ├── auth.js            # Authentication logic
│   ├── api.js             # API and data management
│   ├── navigation.js      # Navigation and routing
│   ├── screens.js         # Screen-specific logic
│   └── app.js             # Main application logic
├── assets/
│   └── images/            # Application images and logos
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies required

### Running the Application

#### Option 1: Simple HTTP Server
```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (if you have npx)
npx serve -s . -l 8000

# Using PHP
php -S localhost:8000
```

#### Option 2: Live Server (VS Code Extension)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### Option 3: Direct File Opening
- Simply open `index.html` in your web browser
- Note: Some features may be limited due to CORS policies

### Accessing the Application
Once the server is running, open your browser and navigate to:
- `http://localhost:8000` (if using a local server)
- The application will load automatically

## 👥 User Roles

### Student Features
- View and sign up for events
- Submit hour requests
- View announcements
- Track progress toward hour goals
- Access meeting attendance codes
- Contact support

### Admin Features
- All student features plus:
- Create and manage events
- Approve/reject hour requests
- Generate meeting attendance codes
- Create and manage announcements
- View student directory
- Manage meeting attendance

## 🔧 Configuration

The application can be customized by editing `js/config.js`:

- **App Settings**: App name, version, and basic configuration
- **API Configuration**: Backend endpoints and settings
- **UI Settings**: Colors, timings, and display options
- **Validation Rules**: Form validation patterns
- **Demo Data**: Sample data for testing

## 🎨 Customization

### Styling
- Modify `styles/main.css` for global styles
- Edit `styles/components.css` for component-specific styling
- Update `styles/animations.css` for animation effects

### Functionality
- Update `js/config.js` for configuration changes
- Modify individual modules in the `js/` directory
- Add new screens by extending the navigation system

## 🔒 Security Features

- Input validation and sanitization
- Secure password handling
- Session management
- Role-based access control
- XSS protection

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile devices (320px - 767px)

## 🚀 Performance Features

- Lazy loading of content
- Optimized animations
- Efficient DOM manipulation
- Minimal external dependencies
- Fast initial load times

## 🐛 Troubleshooting

### Common Issues

1. **Images not loading**
   - Ensure the `assets/images/` directory exists
   - Check file permissions
   - Verify image file names match HTML references

2. **JavaScript errors**
   - Open browser developer tools (F12)
   - Check the Console tab for error messages
   - Ensure all JavaScript files are loading correctly

3. **Styling issues**
   - Clear browser cache
   - Check CSS file paths
   - Verify CSS syntax

4. **Navigation not working**
   - Ensure JavaScript is enabled
   - Check for JavaScript errors in console
   - Verify all navigation functions are defined

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔄 Migration from React Native

This web application was converted from a React Native/Expo mobile app. Key conversion points:

- **React Native Components** → **HTML Elements**
- **React Navigation** → **Custom JavaScript Router**
- **AsyncStorage** → **localStorage**
- **Context API** → **Custom State Management**
- **Supabase Integration** → **Simulated API with Demo Data**

## 📄 License

This project is for educational and organizational use.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions:
- Check the troubleshooting section above
- Review the browser console for error messages
- Contact the development team

---

**Key Club Hub** - Empowering student leadership through technology. 