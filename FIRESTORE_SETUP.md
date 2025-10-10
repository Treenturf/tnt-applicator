# Firestore Data Setup

To set up your TNT Applicator kiosk system, you'll need to add user data to Firestore.

## 1. Create Users Collection

In Firebase Console:
1. Go to Firestore Database
2. Click "Start collection"
3. Collection ID: `users`

## 2. Add Sample Users

Add documents with these fields:

### Admin User
- Document ID: `admin-1234`
- Fields:
  ```
  userCode: "1234" (string)
  name: "Admin User" (string)
  role: "admin" (string)
  isActive: true (boolean)
  ```

### Applicator Users
- Document ID: `applicator-2345`
- Fields:
  ```
  userCode: "2345" (string)
  name: "John Smith" (string)
  role: "applicator" (string)
  isActive: true (boolean)
  ```

- Document ID: `applicator-3456`
- Fields:
  ```
  userCode: "3456" (string)
  name: "Jane Doe" (string)
  role: "applicator" (string)
  isActive: true (boolean)
  ```

## 3. Set up Products Collection

Collection ID: `products`

Sample product document:
- Document ID: `fertilizer-1`
- Fields:
  ```
  name: "Liquid Fertilizer" (string)
  unit: "gallons" (string)
  category: "fertilizer" (string)
  isActive: true (boolean)
  color: "#4caf50" (string)
  ```

## 4. Test Login Codes

After adding users, test these codes in your app:
- `1234` - Admin User (full access)
- `2345` - John Smith (applicator)
- `3456` - Jane Doe (applicator)

## 5. Activity Logs

The `activityLogs` collection will be created automatically when users log in and use the system.

## 6. Update Firestore Rules

In Firebase Console > Firestore Database > Rules, use the rules from `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read any user (for login), only admins can write
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Other collections with basic auth requirements...
  }
}
```

Note: Since you're using code-based auth without Firebase Authentication, you may want to set rules to allow read/write for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    allow read, write: if true; // For local kiosk testing
  }
}
```

**Remember to secure this in production!**