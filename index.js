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
    // Get all games from the new PortMaster repository with pagination
    const games = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await axios.get(`https://api.github.com/repos/PortsMaster/PortMaster-New/contents/ports?per_page=100&page=${page}`);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        response.data.forEach(item => {
          if (item.type === 'dir') {
            // Clean up directory name to make it readable
            let gameName = item.name
              .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
              .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capitals
              .replace(/\s+/g, ' ') // Multiple spaces to single space
              .trim();
            
            // Capitalize first letter of each word
            gameName = gameName.replace(/\b\w/g, l => l.toUpperCase());
            
            games.push({ 
              name: gameName,
              originalName: item.name
            });
          }
        });
        
        // Check if we need to fetch more pages
        if (response.data.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }
    
    console.log(`Found ${games.length} Portmaster games from GitHub (PortMaster-New)`);
    return games;
  } catch (error) {
    console.error('Error fetching from PortMaster-New:', error);
    
    // Fallback to original repository
    try {
      const response = await axios.get('https://api.github.com/repos/christianhaitian/PortMaster/contents');
      const games = [];
      
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(file => {
          if (file.name && file.name.endsWith('.zip')) {
            let gameName = file.name.replace('.zip', '')
              .replace(/[-_]/g, ' ')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .replace(/\s+/g, ' ')
              .trim();
            
            gameName = gameName.replace(/\b\w/g, l => l.toUpperCase());
            
            games.push({ 
              name: gameName,
              originalName: file.name.replace('.zip', '')
            });
          }
        });
      }
      
      console.log(`Fallback: Found ${games.length} games from original repository`);
      return games;
    } catch (fallbackError) {
      console.error('All GitHub sources failed:', fallbackError);
      return [];
    }
  }
}

// Simple Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,      // insertion
        matrix[j - 1][i] + 1,      // deletion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function normalizeGameName(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\b(the|a|an|of|in|on|at|to|for|with|by|and|&)\b/g, '') // Remove common words
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
}

function compareGames(steamGames, portmasterGames) {
  const matches = [];
  const maxDistance = 3; // Maximum allowed character differences
  
  steamGames.forEach(steamGame => {
    portmasterGames.forEach(portGame => {
      const steamName = steamGame.name.toLowerCase();
      const portName = portGame.name.toLowerCase();
      
      // Exact matches
      if (steamName === portName) {
        matches.push({
          steamGame: steamGame.name,
          portmasterGame: portGame.name,
          playtime: Math.round(steamGame.playtime_forever / 60),
          matchType: 'exact'
        });
        return;
      }
      
      // Substring matches
      if (steamName.includes(portName) || portName.includes(steamName)) {
        matches.push({
          steamGame: steamGame.name,
          portmasterGame: portGame.name,
          playtime: Math.round(steamGame.playtime_forever / 60),
          matchType: 'substring'
        });
        return;
      }
      
      // Normalized comparison (remove common words, punctuation)
      const steamNormalized = normalizeGameName(steamGame.name);
      const portNormalized = normalizeGameName(portGame.name);
      
      if (steamNormalized && portNormalized) {
        if (steamNormalized === portNormalized) {
          matches.push({
            steamGame: steamGame.name,
            portmasterGame: portGame.name,
            playtime: Math.round(steamGame.playtime_forever / 60),
            matchType: 'normalized'
          });
          return;
        }
        
        // Much stricter fuzzy matching - only for very close matches
        if (steamNormalized.length > 6 && portNormalized.length > 6) {
          // Only check if the names are similar in length (within 3 characters)
          const lengthDiff = Math.abs(steamNormalized.length - portNormalized.length);
          if (lengthDiff <= 3) {
            const distance = levenshteinDistance(steamNormalized, portNormalized);
            const similarity = 1 - (distance / Math.max(steamNormalized.length, portNormalized.length));
            
            // Much stricter: 95% similarity and max 2 character differences
            if (similarity >= 0.95 && distance <= 2) {
              matches.push({
                steamGame: steamGame.name,
                portmasterGame: portGame.name,
                playtime: Math.round(steamGame.playtime_forever / 60),
                matchType: 'fuzzy',
                similarity: Math.round(similarity * 100)
              });
            }
          }
        }
      }
      
      // Check if Portmaster original name matches better
      if (portGame.originalName) {
        const originalNormalized = normalizeGameName(portGame.originalName);
        if (originalNormalized && steamNormalized === originalNormalized) {
          matches.push({
            steamGame: steamGame.name,
            portmasterGame: portGame.name,
            playtime: Math.round(steamGame.playtime_forever / 60),
            matchType: 'original'
          });
        }
      }
    });
  });
  
  // Remove duplicates (keep best match type)
  const uniqueMatches = [];
  const seen = new Set();
  
  ['exact', 'substring', 'normalized', 'original', 'fuzzy'].forEach(matchType => {
    matches.filter(m => m.matchType === matchType).forEach(match => {
      const key = `${match.steamGame}_${match.portmasterGame}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMatches.push(match);
      }
    });
  });
  
  console.log(`Found ${uniqueMatches.length} unique matches`);
  return { matches: uniqueMatches };
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
                    <div style="font-size: 0.8em; color: #888;">
                        Match type: ${match.matchType}${match.similarity ? ` (${match.similarity}% similarity)` : ''}
                    </div>
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