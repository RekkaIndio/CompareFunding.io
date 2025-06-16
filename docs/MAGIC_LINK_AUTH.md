# Magic Link Authentication Setup

This document explains how to set up and use magic link authentication in your application.

## Overview

Magic link authentication allows users to sign in by clicking a secure link sent to their email, eliminating the need for passwords. This provides a more convenient and secure authentication method.

## How It Works

1. **Request Magic Link**: User enters their email address
2. **Send Email**: Firebase sends a secure sign-in link to the user's email
3. **Click Link**: User clicks the link in their email
4. **Automatic Sign-in**: User is automatically signed in and redirected to their dashboard

## Implementation Components

### 1. Firebase Functions
- `sendMagicLink(email)`: Sends a magic link to the user's email
- `signInWithMagicLink(email, emailLink)`: Verifies and signs in with the magic link
- `checkIfSignInWithEmailLink()`: Checks if current URL is a magic link
- `getEmailFromStorage()`: Retrieves stored email from localStorage

### 2. Components
- `MagicLinkAuth`: Component for requesting magic links
- `VerifyEmail`: Page component for handling magic link verification

### 3. Pages
- `/login` - Login page with magic link tab
- `/auth/verify-email` - Magic link verification page

## Firebase Configuration

To enable magic link authentication, you need to:

### 1. Add Authorized Domains
In Firebase Console:
1. Go to Authentication > Settings > Authorized domains
2. Add your domain: `your-domain.com`
3. For development, add: `localhost`

### 2. Action URL Settings
The magic link will redirect to: `${window.location.origin}/auth/verify-email`

Make sure this URL is added to your authorized domains in Firebase.

## Usage

### Sending a Magic Link
```tsx
const { sendMagicLink } = useAuth();

const handleSendMagicLink = async (email: string) => {
  const { success, error } = await sendMagicLink(email);
  if (success) {
    // Show success message
  } else {
    // Handle error
  }
};
```

### Verifying a Magic Link
```tsx
const { signInWithMagicLink } = useAuth();

const handleVerifyMagicLink = async (email: string, emailLink: string) => {
  const { data, error } = await signInWithMagicLink(email, emailLink);
  if (data?.user) {
    // User signed in successfully
  } else {
    // Handle error
  }
};
```

## Security Features

- **Email Storage**: Email is temporarily stored in localStorage for verification
- **Link Expiration**: Magic links expire after 1 hour
- **Single Use**: Each magic link can only be used once
- **Domain Verification**: Links only work from authorized domains

## User Experience

### Login Flow
1. User goes to `/login`
2. Clicks "Magic Link" tab
3. Enters email address
4. Receives confirmation that email was sent
5. Checks email and clicks the magic link
6. Automatically signed in and redirected

### Error Handling
- Invalid or expired links show clear error messages
- Email not found prompts user to enter email manually
- Network errors are handled gracefully with retry options

## Development Notes

- Magic links work in development with `localhost` as an authorized domain
- Email storage is cleared after successful sign-in
- The verification page handles both new and returning users
- User roles are automatically assigned and users are redirected to appropriate dashboards

## Testing

To test magic link authentication:
1. Run the application in development
2. Go to the login page
3. Click the "Magic Link" tab
4. Enter a valid email address
5. Check the browser console for the magic link URL (in development)
6. Copy and paste the URL to simulate clicking the email link
