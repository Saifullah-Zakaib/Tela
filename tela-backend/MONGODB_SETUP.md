# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Free Cloud - Easiest)

1. **Go to:** https://www.mongodb.com/cloud/atlas
2. **Click:** "Try Free"
3. **Sign up** with email
4. **Create a cluster** (choose FREE tier)
5. **Security:**
   - Set username: `telauser`
   - Set password: `telapass123` (or your choice)
   - Add IP: Click "Allow Access from Anywhere" (0.0.0.0/0)
6. **Get connection string:**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://telauser:<password>@cluster0.xxxxx.mongodb.net/`

7. **Update your .env:**
```env
MONGO_URI=mongodb+srv://telauser:telapass123@cluster0.xxxxx.mongodb.net/tela?retryWrites=true&w=majority
```
Replace `<password>` with your actual password and the cluster URL with yours.

8. **Restart backend:**
```bash
npm run dev
```

You should see: `MongoDB Connected: cluster0-shard-xxxxx.mongodb.net`

## Option 2: Local MongoDB

1. **Download:** https://www.mongodb.com/try/download/community
2. **Install** MongoDB Community Server
3. **Start MongoDB** (usually starts automatically)
4. **Your .env should have:**
```env
MONGO_URI=mongodb://localhost:27017/tela
```
5. **Restart backend**

## Testing Connection

After setup, run:
```bash
cd tela-backend
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB Connected: ...
```

If you see "MongoDB Connected", you're good to go!
