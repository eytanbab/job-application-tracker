# Job Application Tracker - Feature Roadmap

This document outlines the planned features and improvements for the Job Application Tracker (JAT) application.

## 1. User Interface & Experience (UI/UX)
- [ ] **Interactive Kanban Board**: A drag-and-drop board to visualize application statuses (Applied, Interviewing, Offer, Rejected, etc.).
- [ ] **Notifications/Reminders**: Email or in-app alerts for following up on applications after a certain period of silence.
- [ ] **Calendar Integration**: A calendar view for interviews and follow-up deadlines.

## 2. Analytics & AI Insights (Expanding existing capabilities)
- [ ] **Time-to-Hire Analytics**: Track the average time from application to offer/rejection.
- [ ] **Advanced Filtering on AI Insights**: Apply the same month/year filtering system to the `AI Insights` page (already implemented for main Analytics).
- [ ] **Resume/Job Description Matching**: Use AI to compare a uploaded resume with a job description and suggest improvements.
- [ ] **Interview Preparation**: Generate potential interview questions based on the job description using AI.

## 3. Application Management
- [ ] **Batch Operations**: Delete or update multiple applications at once (using table checkboxes).
- [ ] **Export Data**: Implement the UI to export applications to CSV/Excel using `xlsx` (package already installed).
- [ ] **Notes & Timeline**: A dedicated area for each application to track specific interview feedback and a history of status changes.
- [ ] **Contact Management**: Keep track of people associated with each application (Recruiters, Hiring Managers).

## 4. Automation & Integrations
- [ ] **Browser Extension**: A Chrome/Firefox extension to clip job details directly from LinkedIn/Indeed/Glassdoor.
- [ ] **Email Integration**: Automatically detect job application confirmations in Gmail/Outlook.
- [ ] **Calendar Sync**: Sync interview dates from the app to Google/Outlook calendars.

## 5. Completed Features ✅
- [x] **Global Search**: Implemented in the main applications table.
- [x] **AI Auto-Extraction**: Extract job details from URLs using Gemini AI.
- [x] **Dark Mode**: Support for light, dark, and system themes.
- [x] **Mobile Responsiveness**: Adaptive layouts and mobile-specific navigation.
- [x] **Advanced Analytics**: Funnel charts, keyword performance, salary reality checks, and ghosting detection.
- [x] **Document Management**: Upload and manage resumes/CVs via S3.
- [x] **Time-Based Filtering**: Filter analytics by month and year.

---

## Priorities for Next Sprint
1. **Interactive Kanban Board**: To provide a more intuitive way to manage application statuses.
2. **Export to CSV/Excel**: Utilize the already installed `xlsx` library to allow data backups.
3. **Advanced Filtering on AI Insights**: Bring the new filtering system to the AI Insights page.
