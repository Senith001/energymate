Prerequisites

Before you begin, ensure you have the following installed on your machine:
·      Node.js (v18.x or higher) and npm
·      Git for version control
·      A code editor, such as Visual Studio Code
·      A MongoDB Atlas account (or a local MongoDB installation)
 
Step-by-Step Installation

1.       Clone the Repository
First, clone the project repository to your local machine and navigate into the project directory.
        
        git clone https://github.com/Senith001/energymate.git
        cd energymate
 
2.       Backend Setup (Node.js/Express)
Open a terminal and navigate to the backend folder to install the required dependencies.

        cd backend
        npm install

Environment Variables
 
Create a file named .env in the root of the backend directory. Add the following variables:
 
·      PORT=5001
·      MONGO_URI=mongodb+srv://admin_dbUser:prabash2003@cluster0.ebzghlq.mongodb.net/powersave?retryWrites=true&w=majority&appName=Cluster0
·      JWT_SECRET=super_secret_key_change_this
·      JWT_EXPIRES_IN=7d
·      ADMIN_SECRET=AdminSecretKey001
·      GEMINI_API_KEY=AIzaSyBS6K2vwzFx6TLhrRJFIkZLqfoQXfkJCJY
·      GEMINI_MODEL=gemini-2.5-flash
·      CLIENT_URL=http://localhost:3000
·      EMAIL_HOST=sandbox.smtp.mailtrap.io
·      EMAIL_PORT=2525
·      EMAIL_SECURE=false
·      EMAIL_USER=af13fd1a966019
·      EMAIL_PASS=1d975f407a7da0
·      EMAIL_FROM="ENERGYMATE <no-reply@energymate.com>"
·      OPENWEATHER_API_KEY=b2acac872d956304f09a0d3e2b888275
 
Start the Backend Server
 
Once the variables are set, start the backend development server.
npm run dev
 
You should see a message in the console indicating:
    ✅ MongoDB Connected Successfully
    🚀 Server running on port 5001
 
 
3.       Frontend Setup (React/Vite)
Open a new terminal window (keep the backend running) and navigate to the frontend directory.
cd frontend
npm install
 
Environment Variables (Frontend)
 
Create a file named .env in the root of the frontend directory. Since this is a Vite project, the
variable must start with VITE_ .
 
·      VITE_API_URL=http://localhost:5001/api
 
Start the Frontend Server
 
Start the Vite development server.
npm run dev
 
The terminal will output a local URL, typically http://localhost:5173 . Open this link in your web browser to view the application.
 
 
Verification & Troubleshooting
 
1.        Health Check
 
To verify the backend is running correctly, open your browser and navigate to:
http://localhost:5001/health
 
You should see: {"status": " Server is running"}
 
Common Issues
 
CORS Errors on Login: Ensure that the CLIENT_URL in your backend .env exactly matches
your frontend URL (e.g., http://localhost:5173 ) without a trailing slash.
 
MongoDB Connection Failed: Double-check your MONGO_URI string. Ensure your current IP address is whitelisted in your MongoDB Atlas Network Access settings.
 
Missing Dependencies: If you see "Module not found" or "Failed to resolve import" errors (like Framer Motion), ensure you have run npm install in the correct directory.    
   API Endpoints  1. Authentication & User Management

Public Auth Endpoints
* POST /api/users/register          - Register a new user
* POST /api/users/login             - Common login for users and admins
* POST /api/users/verify-otp        - Verify OTP for email confirmation
* POST /api/users/resend-otp        - Request a new verification OTP
* POST /api/users/forgot-password   - Request a password reset OTP
* POST /api/users/verify-reset-otp  - Validate password reset OTP before allowing entry
* POST /api/users/reset-password    - Submit actual password change using valid OTP

Profile Management (Protected)
* GET /api/users/me             - Fetch authenticated user profile
* PUT /api/users/me             - Update profile details
* PUT /api/users/me/change      - password - Update password while logged in
* PUT /api/users/me/avatar      - Upload user profile avatar
* DELETE /api/users/me/avatar   - Remove user profile avatar

Account Lifecycle (Protected)
* POST /api/users/me/delete-request     - Request secure account deletion (OTP dispatched)
* DELETE /api/users/me/delete-confirm   - Confirm account deletion with OTP

2. Admin & Superadmin Features

Admin Capabilities (Requires admin or superadmin)
* GET /api/users/admin/users                - Fetch all users
* GET /api/users/admin/users/:id            - Fetch user details by ID
* PUT /api/users/admin/users/:id/password   - Force reset a user's password
* DELETE /api/users/admin/users/:id         - Delete a standard user

Superadmin Capabilities (Requires superadmin)
* POST /api/users/admin/register                - Bootstrap/first-time Superadmin registration
* POST /api/users/admin/create                  - Create a standard admin account
* GET /api/users/superadmin/admins              - List all administrators
* GET /api/users/superadmin/admins/:id          - Get specific admin details
* PUT /api/users/superadmin/admins/:id/password - Change a standard admin's password
* DELETE /api/users/superadmin/admins/:id       - Revoke an admin's access
* GET /api/users/superadmin/audit-logs          - System-wide audit trails

3. Household Module

Household Operations
* POST /api/households                  - Register a new household
* GET /api/households                   - Get user's households
* GET /api/households/:id               - Get household details
* PUT /api/households/:id               - Update household fundamentals
* PATCH /api/households/:id/settings    - Update module settings
* GET /api/households/:id/weather       - Fetch real-time weather impacting the household
* DELETE /api/households/:id            - Delete a household profile
* 
Rooms Infrastructure
* POST /api/households/:householdId/rooms           - Create a room
* GET /api/households/:householdId/rooms            - Fetch rooms in a household
* PUT /api/households/:householdId/rooms/:roomId    - Update room details
* DELETE /api/households/:householdId/rooms/:roomId - Delete a room
* 
Appliance Management
* POST /api/households/:householdId/appliances                  - Register an appliance
* GET /api/households/:householdId/appliances                   - List appliances
* GET /api/households/:householdId/appliances/:applianceId      - Fetch appliance telemetry
* PUT /api/households/:householdId/appliances/:applianceId      - Update appliance properties
* DELETE /api/households/:householdId/appliances/:applianceId   - Remove appliance

4. Energy Usage Module

Central Usage Logging
* POST /api/usage       - Create general usage entry
* GET /api/usage        - Fetch usage logs
* GET /api/usage/:id    - Fetch specific usage log
* PATCH /api/usage/:id  - Update usage entry
* DELETE /api/usage/:id - Delete usage entry

Advanced Metrics
* GET /api/usage/households/:householdId/monthly-summary    - Aggregate monthly consumption data
* GET /api/usage/households/:householdId/estimate           - Future usage estimation
* GET /api/usage/households/:householdId/by-appliances      - Analytics grouped by appliance footprint
* GET /api/usage/households/:householdId/by-rooms           - Analytics grouped by spatial layout
* GET /api/usage/households/:householdId/weather-impact     - Weather vs. Electricity correlation data

Deep-Level Appliance Logging
* POST /api/usage/households/:householdId/appliance-hours           - Record granular device-level usage
* GET /api/usage/households/:householdId/appliance-hours            - See device-level telemetry
* PATCH /api/usage/households/:householdId/appliance-hours/:logId   - Update log
* DELETE /api/usage/households/:householdId/appliance-hours/:logId  - Remove log

5. Billing & Tariffs

Billing Generation
* POST /api/bills - Register a manual bill entry
* POST /api/bills/households/:householdId/generate  - Auto-generate invoice based on metrics
* GET /api/bills/households/:householdId            - Fetch historical invoices
* GET /api/bills/households/:householdId/compare    - Compare bill trends over time
* GET /api/bills/:id                                - View single invoice
* PATCH /api/bills/:id                              - Update invoice status
* PUT /api/bills/:id/regenerate                     - Re-sync invoice data from updated telemetry
* DELETE /api/bills/:id                             - Remove invoice

Tariff Configurations
* GET /api/tariffs - Get current tier structures
* PUT /api/tariffs - Modify platform-wide grid pricing (Admin/Superadmin)

6. AI & Recommendations (EnergyMate Hub)
* POST /api/recommendations/households/:householdId/ai/energy-tips      - Generate daily behavioral suggestions
* POST /api/recommendations/households/:householdId/ai/cost-strategies  - Algorithmic cost reduction analysis
* POST /api/recommendations/households/:householdId/ai/predictions      - Time-series prediction mapping
* DELETE /api/recommendations/households/:householdId/ai/cache          - Purge AI memory nodes for fresh context

7. Feedback & Support

Public Feedback
* GET /api/feedback/public/featured - Return visible community testimonials
* POST /api/feedback                - Submit platform feedback
* GET /api/feedback/my              - View own testimonials
* GET /api/feedback                 - View all (Admin)
* GET /api/feedback/:id             - Details endpoint
* DELETE /api/feedback/:id          - Moderate/delete

Secure Support Tickets
* POST /api/support         - Create helpdesk ticket
* GET /api/support/my       - Monitor owned tickets
* GET /api/support          - View queue (Admin)
* GET /api/support/:id      - Inspect ticket contents
* DELETE /api/support/:id   - Resolve/remove ticket

8. Public Posts & News
* GET /api/posts        - Fetch blog/news catalog
* POST /api/posts       - Publish new post (Admin/Superadmin)
* GET /api/posts/:id    - Read single post
* DELETE /api/posts/:id - Retract/delete post


