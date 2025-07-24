# Steam Portmaster Checker

A simple web tool to compare your Steam game library with games supported by [Portmaster](https://portmaster.games/). Find out which of your Steam games can be played on handheld devices through Portmaster!

## Features

- Compare Steam library with Portmaster supported games
- Secure - no user credentials required, only public Steam IDs
- Fast comparison with detailed reports
- Simple web interface with dark/light theme support
- In-memory caching to prevent API rate limits

## How It Works

1. Users enter their Steam ID (found in their Steam profile URL)
2. The app fetches their public game library using Steam's Web API
3. Compares games with the current Portmaster supported games list
4. Generates a detailed report showing matches

**Important:** Users' Steam profiles must be set to public to view their game library. The tool also includes a disclaimer that port compatibility may vary and users should check port requirements before installation.

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- A Steam Web API key

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Get a Steam Web API key:
   - Go to https://steamcommunity.com/dev/apikey
   - Sign in with your Steam account
   - Enter any domain name (e.g., `localhost`)
   - Copy your API key

4. Create a `.env` file in the project root:
   ```
   STEAM_API_KEY=your_steam_api_key_here
   ```

### Running the Application

Start the server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

The application will:
- Start on http://localhost:3000
- Automatically open in your browser
- Display a simple form for Steam ID input

## Usage

### For Users

1. Enter one of the following in the form:
   - Steam username (e.g., `yourusername`)
   - Steam profile URL (e.g., `https://steamcommunity.com/id/yourusername`)
   - Steam ID64 (e.g., `76561198123456789`)

2. Click "Compare Games" to generate your report

3. View matched games with thumbnails and links to port details

### Privacy Requirements

- Your Steam profile must be set to **Public** for the tool to access your game library
- You can temporarily make it public, run the comparison, then set it back to private
- No personal data is stored - everything is processed in real-time

## Security

- No user authentication required
- No user credentials handled
- Only accesses public Steam profile data
- Steam API key stays on server only
- No third-party authentication libraries
- No data storage or logging

## API Limits

Steam Web API has rate limits:
- 100,000 requests per day per API key
- Reasonable usage should stay well within limits

## Troubleshooting

### "Steam profile is private" error
- Set your Steam profile to Public in Privacy Settings
- Make sure your "Game details" are set to Public

### "Invalid Steam ID" error
- Check that your username or URL is correct
- Ensure your Steam profile exists and is accessible
- Try using your Steam ID64 directly if username resolution fails

### "Steam API key not configured" error
- Make sure your `.env` file exists and contains `STEAM_API_KEY=your_key`
- Restart the server after adding the API key

## About Portmaster

[Portmaster](https://portmaster.games/) is a management software for installing and updating various game ports for Linux-driven handheld video game systems. It allows you to play games natively on devices like Steam Deck, ROG Ally, and other handheld gaming devices.

## Contributing

Feel free to submit issues or pull requests to improve the game matching algorithm or add new features!

## Deployment

### Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up with GitHub
3. Click "Import Project" and select your repository
4. Vercel will auto-detect it's a Node.js project
5. In project settings, add environment variable:
   - Name: `STEAM_API_KEY`
   - Value: Your Steam API key
   - **Important**: Mark it as "Sensitive"
6. Deploy! Your app will be live at `yourproject.vercel.app`

Vercel's free tier includes:
- 100 GB bandwidth/month
- Unlimited deployments
- Custom domains
- Perfect for community projects!

## License

MIT License - feel free to use and modify as needed.