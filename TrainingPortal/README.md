Set Up Security Rules: Once you're ready to deploy, you MUST secure your database. Go to the Firestore Database -> Rules tab. Replace the default test rules with rules that protect user data. (ใน Rules of Firestore Database.txt)  หรือ Here's a basic example:
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- USERS COLLECTION ---
    match /users/{userId} {
      allow create: if request.auth != null;
      allow get, update: if request.auth != null && request.auth.uid == userId;
      // Admins and sub-admins can GET ANY user's document.
      allow get, list: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'sub-admin'];
      // ONLY Admins can UPDATE any user document (e.g., change roles).
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // --- ENROLLMENTS SUBCOLLECTION ---
    match /users/{userId}/enrollments/{courseId} {
        // A user can write to their own enrollments.
        allow write: if request.auth != null && request.auth.uid == userId;
        
        // **FIX 1:** A user can read their own enrollments, AND admins/sub-admins can read ANY enrollment for reporting.
        allow read: if request.auth != null && (
          request.auth.uid == userId || 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'sub-admin']
        );
    }
    
    // --- COURSES COLLECTION ---
    match /courses/{courseId} {
      allow read: if request.auth != null;
      
      // CREATE rule: Fixes the permission issue for sub-admins on creation.
      allow create: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'sub-admin' && request.auth.uid in request.resource.data.assignedAdmins)
      );

      // UPDATE rule: More secure for sub-admins.
      allow update: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'sub-admin' && request.auth.uid in resource.data.assignedAdmins)
      );

      // DELETE rule: Only super-admins can delete for safety.
      allow delete: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      // Subcollections (Quiz, Survey)
      match /{subcollection}/{docId=**} {
        allow read: if request.auth != null;
        // Check assigned admins for the parent course for write permissions.
        allow write: if request.auth != null && (
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'sub-admin' && request.auth.uid in get(/databases/$(database)/documents/courses/$(courseId)).data.assignedAdmins)
        );
      }
    }
    
    // --- CHAT ROOMS & MESSAGES ---
    
    // **FIX 2:** Add a rule for the chat room document itself.
    match /chat_rooms/{courseId} {
        // Allow admins/sub-admins to create the chat room when a course is created.
        allow create: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'sub-admin'];
        
        // Allow any authenticated user to read it (it's usually an empty doc anyway).
        allow read: if request.auth != null;
    }

    match /chat_rooms/{courseId}/messages/{messageId} {
      function isEnrolled() {
        return exists(/databases/$(database)/documents/users/$(request.auth.uid)/enrollments/$(courseId));
      }
      function isCourseAdmin() {
        let userRole = get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
        return userRole == 'admin' || (userRole == 'sub-admin' && request.auth.uid in get(/databases/$(database)/documents/courses/$(courseId)).data.assignedAdmins);
      }

      allow read: if request.auth != null && (isEnrolled() || isCourseAdmin());
      allow create: if request.auth != null && (isEnrolled() || isCourseAdmin()) && request.resource.data.senderId == request.auth.uid;
      allow update, delete: if false; 
    }
  }
}

แก้ apikey ใน services/firebaseService.ts (inproject) หรือ .env.local (uploadhost)

Create a New Static Site:
On your Render dashboard, click New + > Static Site.
Select the GitHub repository for your project.
Configure the Settings:
Name: Give your site a unique name (e.g., my-training-portal).
Branch: Choose the branch you want to deploy (e.g., main).
Build Command: npm install && npm run build (or yarn && yarn build). This tells Render how to build your project.
Publish Directory: dist. This is the folder where the build command outputs the final HTML, CSS, and JS files. (For Create React App, this would be build).
Add Environment Variables (For Firebase Keys):
Before deploying, click Advanced.
Click Add Environment Variable.
Add your Firebase configuration keys here. IMPORTANT: For Vite apps, environment variables must be prefixed with VITE_.
Key: VITE_API_KEY, Value: AIzaSy... (from your firebaseConfig)
Key: VITE_AUTH_DOMAIN, Value: your-project-id.firebaseapp.com
...and so on for all keys in your firebaseConfig.
Now, in your code, you can access these securely: const apiKey = import.meta.env.VITE_API_KEY;.
Deploy: Click Create Static Site. Render will pull your code, run the build command, and deploy the site.


