# Steam Portmaster Checker

A simple web tool to compare your Steam game library with games supported by [Portmaster](https://portmaster.games/). Find out which of your Steam games can be played on handheld devices through Portmaster!

## Features

- Compare Steam / GOG / Epic library with Portmaster supported games
- Secure - no user credentials required, only public Steam IDs
- Fast comparison with detailed reports
- In-memory caching to prevent API rate limits

## How It Works

- Users enter their Steam ID (or list of games from Epic / GOG)
- The app fetches their public game library using Steam's Web API
- Compares games with the current Portmaster supported games list
- Generates a detailed report showing matches

**Important:** Users' Steam profiles must be set to public to view their game library. The tool also includes a disclaimer that port compatibility may vary and users should check port requirements before installation.

# Usage

## For Users

### Steam

1. Enter one of the following in the form:
   - Steam username (e.g., `yourusername`)
   - Steam profile URL (e.g., `https://steamcommunity.com/id/yourusername`)
   - Steam ID64 (e.g., `76561198123456789`)

2. Click "Compare Games" to generate your report

3. View matched games with thumbnails and links to port details

### GOG

1. Log in into GOG.

2. Paste this URL into your browser: `https://embed.gog.com/account/getFilteredProducts?mediaType=1&sort=title&page=1`. Note that there would be multiple pages with a result, so you have to run this URL multiple times, changing last number.

3. Paste produced result in the test field.


### Epic Games

1. Install Python

2. pip install legendary-gl

3. legendary auth

4. legendary list > games.txt


# Privacy Requirements

- Your Steam profile must be set to **Public** for the tool to access your game library
- You can temporarily make it public, run the comparison, then set it back to private
- No personal data is stored - everything is processed in real-time

# Security

- No user authentication required
- No user credentials handled
- Only accesses public Steam profile data
- Steam API key stays on server only
- No third-party authentication libraries
- No data storage or logging

