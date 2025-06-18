# Pipedrive CRM Integration - Service Request Form

## Overview
A professional web application that captures service requests through a responsive form and automatically creates deals and contacts in Pipedrive CRM. Built for the JavaScript Developer Intern test task.

## 🚀 Live Demo
[Add your deployed URL here]

## ✨ Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Real-time Validation**: Instant feedback on form fields with visual indicators
- **Pipedrive Integration**: Automatically creates persons and deals via Pipedrive API
- **Professional UI**: Clean, modern interface matching Pipedrive's design language
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Form Enhancements**: Auto-formatting, smart defaults, and validation

## 🛠️ Technologies Used
- HTML5
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- Pipedrive REST API
- Responsive Web Design

## 📋 Form Sections
1. **Client Details**: First name, last name, phone, email
2. **Job Details**: Job type, job source, description
3. **Service Location**: Complete address information
4. **Scheduling**: Date, time, and priority settings

## ⚙️ Setup Instructions

### 1. Clone/Download Files
Create a new folder and add these files:
- `index.html`
- `style.css`
- `script.js`
- `README.md`

### 2. Configure Pipedrive API
1. Sign up for a free Pipedrive account at [pipedrive.com](https://pipedrive.com)
2. Get your API token: Settings → Personal → API
3. Open `script.js` and replace `YOUR_PIPEDRIVE_API_TOKEN_HERE` with your actual token

```javascript
const PIPEDRIVE_CONFIG = {
    API_TOKEN: 'your_actual_api_token_here',
    BASE_URL: 'https://api.pipedrive.com/v1'
};
```

### 3. Deploy the Application
**Option A: Netlify (Recommended)**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your project folder
3. Get your live URL

**Option B: Local Testing**
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

## 🎯 How It Works

### Form Submission Flow
1. User fills out the service request form
2. JavaScript validates all input data
3. API call creates a new person in Pipedrive
4. Second API call creates a deal linked to that person
5. Success/error message displayed to user
6. Form resets on successful submission

### Pipedrive Integration
- **Person Creation**: Creates contact with name, phone, and email
- **Deal Creation**: Creates deal with structured notes containing all form data
- **Error Handling**: Graceful fallback with detailed error messages

## 🎨 Design Features
- **Gradient Headers**: Eye-catching color schemes
- **Smooth Animations**: Subtle scroll animations and hover effects
- **Visual Feedback**: Color-coded validation states
- **Loading States**: Professional loading indicators
- **Mobile-First**: Responsive grid system

## 🔧 Form Enhancements
- **Phone Formatting**: Auto-formats as (123) 456-7890
- **Date Validation**: Prevents past date selection
- **Time Defaults**: Auto-suggests end time based on start time
- **Real-time Validation**: Immediate feedback on field completion
- **Smart Scrolling**: Auto-scrolls to success/error messages

## 📝 Testing the Application

### Manual Testing Steps
1. Fill out all required fields (marked with *)
2. Test form validation by leaving fields empty
3. Submit a complete form
4. Verify data appears in your Pipedrive account