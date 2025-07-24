import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import open from 'open';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Portmaster Steam Lookup</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 30px; border-radius: 10px; }
            input[type="text"] { width: 300px; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
            button { background: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #45a049; }
            .help { background: #e7f3ff; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .error { background: #ffebee; color: #c62828; padding: 15px; border-radius: 5px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎮 Steam Portmaster Checker</h1>
            <p>Compare your Steam library with Portmaster supported games!</p>
            
            <form action="/compare" method="POST">
                <label for="steamid">Steam ID, Username, or Profile URL:</label><br>
                <input type="text" id="steamid" name="steamid" placeholder="yourusername or https://steamcommunity.com/id/yourusername/" required>
                <br><br>
                <button type="submit">🔍 Compare Games</button>
            </form>
            
            <div class="help">
                <h3>What can you enter?</h3>
                <ul>
                    <li><strong>Custom URL:</strong> https://steamcommunity.com/id/yourusername/</li>
                    <li><strong>Just your username:</strong> yourusername</li>
                    <li><strong>Numeric URL:</strong> https://steamcommunity.com/profiles/76561198123456789</li>
                    <li><strong>Steam ID64:</strong> 76561198123456789</li>
                </ul>
                <p><strong>Note:</strong> Your Steam profile must be public to view your game library.</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.post('/compare', async (req, res) => {
  try {
    const steamId = await resolveSteamId(req.body.steamid);
    if (!steamId) {
      return res.send(errorPage('Invalid Steam ID format or unable to resolve Steam profile. Please check your Steam ID or profile URL.'));
    }

    console.log('Fetching Steam games for ID:', steamId);
    const steamGames = await getSteamGames(steamId);
    
    if (steamGames.error) {
      return res.send(errorPage(steamGames.error));
    }

    console.log('Fetching Portmaster games...');
    const portmasterGames = await getPortmasterGames();
    
    console.log('Comparing games...');
    const comparison = compareGames(steamGames, portmasterGames);
    
    res.send(generateReport(steamGames, portmasterGames, comparison));
  } catch (error) {
    console.error('Comparison error:', error);
    res.send(errorPage('An error occurred while comparing games. Please try again.'));
  }
});

async function resolveSteamId(input) {
  if (!input) return null;
  
  const cleanInput = input.trim();
  
  // Check if it's already a Steam ID64
  const steamId64Regex = /\b(765611\d{11})\b/;
  const directMatch = cleanInput.match(steamId64Regex);
  if (directMatch) {
    return directMatch[1];
  }
  
  // Extract custom name from various URL formats
  let customName = null;
  
  // Handle steamcommunity.com/id/username
  const customUrlMatch = cleanInput.match(/steamcommunity\.com\/id\/([^\/\?]+)/i);
  if (customUrlMatch) {
    customName = customUrlMatch[1];
  }
  
  // Handle just the username (assume it's a custom name)
  if (!customName && !cleanInput.includes('/') && !cleanInput.includes('.') && cleanInput.length > 2) {
    customName = cleanInput;
  }
  
  // Resolve custom name to Steam ID64 using Steam API
  if (customName) {
    try {
      const resolveUrl = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${customName}&format=json`;
      const response = await axios.get(resolveUrl);
      
      if (response.data.response && response.data.response.success === 1) {
        return response.data.response.steamid;
      }
    } catch (error) {
      console.error('Error resolving custom Steam URL:', error);
    }
  }
  
  return null;
}

async function getSteamGames(steamId) {
  if (!process.env.STEAM_API_KEY) {
    return { error: 'Steam API key not configured. Please contact the administrator.' };
  }

  try {
    const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&format=json`;
    const response = await axios.get(url);
    
    if (!response.data.response || !response.data.response.games) {
      return { error: 'Steam profile is private or does not exist. Please make your Steam profile public and try again.' };
    }
    
    return response.data.response.games;
  } catch (error) {
    console.error('Error fetching Steam games:', error);
    return { error: 'Failed to fetch Steam games. Please check your Steam ID and try again.' };
  }
}

async function getPortmasterGames() {
  try {
    const response = await axios.get('https://portmaster.games/games.html');
    const $ = cheerio.load(response.data);
    
    const games = [];
    
    // Look for game titles in various selectors
    $('h3, h4, .game-title, .port-title, strong').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 2 && !text.toLowerCase().includes('portmaster') && !text.toLowerCase().includes('download')) {
        games.push({ name: text });
      }
    });
    
    // Also check for links that might contain game names
    $('a').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 3 && !text.toLowerCase().includes('portmaster') && !text.toLowerCase().includes('download')) {
        games.push({ name: text });
      }
    });
    
    // Remove duplicates
    const uniqueGames = games.filter((game, index, self) => 
      index === self.findIndex(g => g.name.toLowerCase() === game.name.toLowerCase())
    );
    
    return uniqueGames;
  } catch (error) {
    console.error('Error fetching Portmaster games:', error);
    return [];
  }
}

function compareGames(steamGames, portmasterGames) {
  const matches = [];
  
  steamGames.forEach(steamGame => {
    portmasterGames.forEach(portGame => {
      const steamName = steamGame.name.toLowerCase();
      const portName = portGame.name.toLowerCase();
      
      // Various matching strategies
      if (steamName === portName || 
          steamName.includes(portName) || 
          portName.includes(steamName) ||
          // Remove common words and compare
          steamName.replace(/\b(the|a|an|of|in|on|at|to|for|with|by)\b/g, '').trim() === 
          portName.replace(/\b(the|a|an|of|in|on|at|to|for|with|by)\b/g, '').trim()) {
        matches.push({
          steamGame: steamGame.name,
          portmasterGame: portGame.name,
          playtime: Math.round(steamGame.playtime_forever / 60) // Convert to hours
        });
      }
    });
  });
  
  return { matches };
}

function generateReport(steamGames, portmasterGames, comparison) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Steam vs Portmaster Comparison Report</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 1000px; margin: 20px auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; border-radius: 10px; text-align: center; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; }
            .stat h3 { margin: 0; color: #333; }
            .stat .number { font-size: 2em; font-weight: bold; color: #4CAF50; }
            .matches { background: #e8f5e8; padding: 20px; border-radius: 10px; margin-top: 20px; }
            .match { background: white; margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50; }
            .match h4 { margin: 0 0 10px 0; color: #333; }
            .playtime { color: #666; font-size: 0.9em; }
            .back-btn { background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎮 Steam vs Portmaster Report</h1>
            <p>Your gaming compatibility analysis</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="number">${steamGames.length}</div>
                <h3>Steam Games</h3>
            </div>
            <div class="stat">
                <div class="number">${portmasterGames.length}</div>
                <h3>Portmaster Games</h3>
            </div>
            <div class="stat">
                <div class="number">${comparison.matches.length}</div>
                <h3>Matches Found</h3>
            </div>
        </div>
        
        ${comparison.matches.length > 0 ? `
        <div class="matches">
            <h2>🎯 Games You Own That Are Supported by Portmaster:</h2>
            ${comparison.matches.map(match => `
                <div class="match">
                    <h4>${match.steamGame}</h4>
                    <div>Portmaster version: <strong>${match.portmasterGame}</strong></div>
                    <div class="playtime">Playtime: ${match.playtime} hours</div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <h2>No Direct Matches Found</h2>
            <p>We didn't find any exact matches between your Steam library and Portmaster supported games. This could be because:</p>
            <ul>
                <li>Game names don't match exactly between platforms</li>
                <li>You may have games that require additional files to work with Portmaster</li>
                <li>New ports may have been added since our last update</li>
            </ul>
            <p>Check the <a href="https://portmaster.games/games.html" target="_blank">full Portmaster games list</a> manually for potential matches.</p>
        </div>
        `}
        
        <a href="/" class="back-btn">🔄 Try Another Steam ID</a>
    </body>
    </html>
  `;
}

function errorPage(message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Error - Steam Portmaster Checker</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #ffebee; color: #c62828; padding: 30px; border-radius: 10px; text-align: center; }
            .back-btn { background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="error">
            <h2>❌ Error</h2>
            <p>${message}</p>
            <a href="/" class="back-btn">🔄 Try Again</a>
        </div>
    </body>
    </html>
  `;
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Make sure to set your STEAM_API_KEY in a .env file');
  console.log('Get your API key from: https://steamcommunity.com/dev/apikey');
  open(`http://localhost:${port}`);
});