# Developer Instructions

## Prerequisites

- Node.js (v18 or higher)
- A Steam Web API key

## Installation

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

## Running the Application

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

## Troubleshooting - Steam

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

## Contributing

Feel free to submit issues or pull requests to improve the game matching algorithm or add new features!

## License

MIT License - feel free to use and modify as needed.