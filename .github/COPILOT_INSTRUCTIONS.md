# Copilot Instructions for Steam Portmaster Checker

## Project Overview

This is a Node.js Express web application that compares a user's Steam game library with games supported by Portmaster. The app helps users identify which of their Steam games can be played on handheld devices through Portmaster.

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Module System**: ES Modules (`"type": "module"` in package.json)
- **Environment**: dotenv for configuration
- **HTTP Client**: axios for API calls
- **Web Scraping**: cheerio for HTML parsing
- **Development**: Built-in Node.js `--watch` flag for auto-restart
- **Deployment**: Vercel (see vercel.json)

## Development Setup

### Prerequisites
- Node.js v18 or higher
- Steam Web API key (get from https://steamcommunity.com/dev/apikey)

### Installation
```bash
npm install
# Note: If puppeteer fails to download Chrome, use:
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

### Environment Configuration
Create a `.env` file in the project root:
```
STEAM_API_KEY=your_steam_api_key_here
```

### Running the Application
```bash
# Production mode
npm start

# Development mode with auto-restart
npm run dev
```

The app runs on http://localhost:3000 and automatically opens in the browser.

## Code Structure

### Main Files
- `index.js` - Main application file containing all server logic
- `package.json` - Dependencies and scripts
- `.env` - Environment variables (not committed)
- `vercel.json` - Vercel deployment configuration

### Key Components in index.js
1. **Cache System** - Simple in-memory cache with TTL for API responses
2. **Steam API Integration** - Functions to fetch user games and resolve Steam IDs
3. **Portmaster Data** - Web scraping to get supported games list
4. **Web Interface** - Single-page HTML form with embedded CSS/JS
5. **Comparison Logic** - Game matching between Steam library and Portmaster

## Coding Standards

### File Organization
- All server logic is in a single `index.js` file
- Use ES6+ features and ES modules syntax
- Import statements at the top, grouped by type (built-in, external, local)

### Variable Naming
- Use camelCase for variables and functions
- Use UPPER_SNAKE_CASE for constants
- Descriptive names for API-related functions

### Error Handling
- Always handle API failures gracefully
- Return user-friendly error messages
- Log errors for debugging but don't expose sensitive data

### API Integration
- Use axios for HTTP requests
- Implement caching to respect API rate limits
- Handle both username and Steam ID64 inputs

## Testing

Currently, there are no automated tests. When adding tests:
- Consider testing API integration functions separately
- Mock external API calls (Steam, Portmaster website)
- Test both success and error scenarios
- Focus on the core comparison logic

## Development Workflow

### Making Changes
1. Modify `index.js` for server-side changes
2. Use `npm run dev` for auto-restart during development
3. Test manually by visiting http://localhost:3000
4. Check browser console for client-side errors
5. Monitor server console for API errors

### Adding Features
- **New API endpoints**: Add route handlers in the main file
- **UI changes**: Modify the HTML template in the root route handler
- **Cache improvements**: Modify the cache functions at the top of the file
- **Steam API changes**: Update the Steam-related functions

### Common Tasks

#### Adding a new Steam API endpoint
```javascript
async function newSteamFunction(steamId) {
  try {
    const response = await axios.get('https://api.steampowered.com/...', {
      params: { key: process.env.STEAM_API_KEY, steamid: steamId }
    });
    return response.data;
  } catch (error) {
    console.error('Steam API error:', error.message);
    throw error;
  }
}
```

#### Modifying the comparison logic
- Find the `compareGames` function
- Update game matching criteria
- Consider case sensitivity and partial matches
- Test with various Steam libraries

#### Updating the UI
- Modify the HTML template in the root route (`app.get('/', ...)`)
- Embedded CSS is in the `<style>` section
- JavaScript is in the `<script>` section
- Keep the single-page approach for simplicity

## Security Considerations

- Never expose the Steam API key to the client
- Only access public Steam profile data
- No user authentication or data storage
- Validate and sanitize user inputs (Steam IDs, usernames)
- Use HTTPS in production (handled by Vercel)

## Deployment

The app is configured for Vercel deployment:
- `vercel.json` contains routing configuration
- Environment variables must be set in Vercel dashboard
- Uses serverless functions approach

## Troubleshooting

### Common Issues
1. **"Steam API key not configured"** - Check `.env` file and restart server
2. **"Steam profile is private"** - User needs to set Steam profile to public
3. **Rate limiting** - Cache system helps, but may need to implement retry logic
4. **Portmaster site changes** - May need to update web scraping selectors

### Debugging
- Check server console for API errors
- Use browser dev tools for client-side issues
- Verify Steam API responses manually
- Test with known public Steam profiles

## Best Practices for AI Coding Assistance

### When working with this codebase:
1. **Understand the single-file architecture** - Most logic is in `index.js`
2. **Respect the cache system** - Don't break the TTL mechanism
3. **Test API integrations** - Steam API and Portmaster scraping can fail
4. **Maintain the simple UI** - Keep the single-page design
5. **Consider rate limits** - Both Steam API and Portmaster website
6. **Handle errors gracefully** - Users should see helpful messages
7. **Preserve environment variable usage** - Don't hardcode API keys
8. **Keep the ES module syntax** - Use import/export, not require

### Code modification tips:
- Always test changes with `npm run dev`
- Check both server console and browser console for errors
- Use descriptive variable names for Steam-related data
- Comment complex game matching logic
- Maintain the existing code style and structure