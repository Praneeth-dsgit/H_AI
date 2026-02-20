# How to Access the Login Page

## ✅ Quick Access

### Step 1: Start the Frontend Server

```bash
cd AI_Chat/frontend
npm run dev
```

### Step 2: Open in Browser

The login page will **automatically open** when you navigate to:

```
http://localhost:5173/
```

**What happens:**
- If you're **NOT logged in** → Automatically redirects to `/login`
- If you're **logged in** → Shows the main app

### Direct URLs

- **Login Page**: `http://localhost:5173/login`
- **Signup Page**: `http://localhost:5173/signup`
- **OTP Verification**: `http://localhost:5173/verify-otp`
- **Main App**: `http://localhost:5173/` (requires authentication)

---

## 🔄 How It Works

### Routing Logic

1. **Root Route (`/`)**:
   - Checks if user is authenticated
   - If **NOT authenticated** → Redirects to `/login`
   - If **authenticated** → Shows main app

2. **Login Route (`/login`)**:
   - Shows login form
   - On successful login → Redirects to `/` (main app)

3. **Protected Routes (`/*`)**:
   - All other routes are protected
   - Requires authentication
   - If not authenticated → Redirects to `/login`

---

## 🧪 Testing

### Test 1: Not Logged In
1. Clear browser localStorage (or use incognito)
2. Go to `http://localhost:5173/`
3. **Expected**: Automatically redirects to `/login`

### Test 2: Login Flow
1. Go to `http://localhost:5173/login`
2. Enter email and password
3. Click "Sign In"
4. **Expected**: Redirects to main app (`/`)

### Test 3: Already Logged In
1. Login successfully
2. Go to `http://localhost:5173/`
3. **Expected**: Shows main app (no redirect)

---

## 📝 Notes

- The login page is located at: `AI_Chat/frontend/src/components/Login.tsx`
- Routing is configured in: `AI_Chat/frontend/src/App.tsx`
- Authentication is checked via `localStorage.getItem('isAuthenticated')`

---

## 🐛 Troubleshooting

### Issue: Login page doesn't show

**Solution**: Check if frontend is running:
```bash
cd AI_Chat/frontend
npm run dev
```

### Issue: Redirect loop

**Solution**: Clear localStorage:
```javascript
// In browser console
localStorage.clear()
```

### Issue: Backend not responding

**Solution**: Start backend server:
```bash
cd AI_Chat/api
python app.py
```

---

**The login page is now configured to open automatically when you visit the root URL!** 🎉

