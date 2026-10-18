# Discord Server Website

Website for Discord server: https://discord.gg/rGxv4Bfs8

## Features
- Beautiful landing page
- Discord OAuth login (NextAuth)
- Join server button after login

## Environment Variables (add in Vercel)

```
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=any_random_long_string
NEXTAUTH_URL=https://your-project.vercel.app
```

## Discord Developer Portal Setup
1. Go to https://discord.com/developers/applications
2. Create application → OAuth2
3. Add Redirect URL:
   `https://your-project.vercel.app/api/auth/callback/discord`
4. Copy Client ID & Client Secret → put them in Vercel Environment Variables
