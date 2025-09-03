import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import open from 'open';

dotenv.config();

const app = express();
const port = 3000;

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Portmaster Game Checker</title>
        <script>
          window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/insights/script.js"></script>
        <script>
          window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/speed-insights/script.js"></script>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 50px auto; 
                padding: 20px;
                background-color: var(--bg-color);
                color: var(--text-color);
                transition: background-color 0.3s, color 0.3s;
            }
            
            :root {
                --bg-color: #ffffff;
                --text-color: #333333;
                --container-bg: #f5f5f5;
                --input-bg: #ffffff;
                --input-border: #ddd;
                --help-bg: #e7f3ff;
                --error-bg: #ffebee;
                --error-text: #c62828;
                --button-bg: #4CAF50;
                --button-hover: #45a049;
                --warning-border: #ffc107;
                --warning-bg: #f8f4e6;
            }
            
            @media (prefers-color-scheme: dark) {
                :root {
                    --bg-color: #1a1a1a;
                    --text-color: #e0e0e0;
                    --container-bg: #2d2d2d;
                    --input-bg: #3d3d3d;
                    --input-border: #555;
                    --help-bg: #1e3a5f;
                    --error-bg: #4a2c2c;
                    --error-text: #ff6b6b;
                    --button-bg: #4CAF50;
                    --button-hover: #45a049;
                    --warning-border: #ffb347;
                    --warning-bg: #2a2416;
                }
            }
            
            .container { 
                background: var(--container-bg); 
                padding: 30px; 
                border-radius: 10px; 
            }
            
            input[type="text"], textarea { 
                width: 300px; 
                padding: 10px; 
                margin: 10px 0; 
                border: 1px solid var(--input-border); 
                border-radius: 5px;
                background: var(--input-bg);
                color: var(--text-color);
            }
            
            textarea {
                resize: vertical;
                font-family: inherit;
            }
            
            button { 
                background: var(--button-bg); 
                color: white; 
                padding: 12px 24px; 
                border: none; 
                border-radius: 5px; 
                cursor: pointer; 
            }
            
            button:hover { 
                background: var(--button-hover); 
            }
            
            .help { 
                background: var(--help-bg); 
                padding: 15px; 
                border-radius: 5px; 
                margin-top: 20px; 
            }
            
            .error { 
                background: var(--error-bg); 
                color: var(--error-text); 
                padding: 15px; 
                border-radius: 5px; 
                margin-top: 20px; 
            }
            
            @media (max-width: 768px) {
                body {
                    margin: 10px auto;
                    padding: 10px;
                    max-width: 100%;
                }
                
                .container {
                    padding: 20px;
                }
                
                h1 {
                    font-size: 1.5em;
                    text-align: center;
                }
                
                input[type="text"], textarea {
                    width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                    font-size: 16px; /* Prevents zoom on iOS */
                }
                
                textarea {
                    min-height: 200px;
                }
                
                button {
                    width: 100%;
                    padding: 15px;
                    font-size: 1em;
                    margin-top: 10px;
                }
                
                .help {
                    padding: 15px;
                    margin-top: 15px;
                }
                
                .help h3 {
                    font-size: 1.1em;
                    margin-top: 0;
                }
                
                .help ul {
                    padding-left: 20px;
                }
                
                .help li {
                    margin-bottom: 8px;
                    line-height: 1.4;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Portmaster Game Checker</h1>
            <p>Compare your Steam or Epic Games library with <a href="https://portmaster.games/" target="_blank">Portmaster</a> supported games!</p>
            
            <div style="margin-bottom: 30px;">
                <h3>Choose your platform:</h3>
                <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                    <button type="button" onclick="showSteamForm()" style="background: #1b2838; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;" id="steam-btn">Steam</button>
                    <button type="button" onclick="showEpicForm()" style="background: #313131; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;" id="epic-btn">Epic Games</button>
                    <button type="button" onclick="showGogForm()" style="background: #7c3aed; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;" id="gog-btn">GOG</button>
                </div>
            </div>
            
            <div id="steam-form" style="display: block;">
                <form action="/compare" method="POST">
                    <h3>Steam Library Comparison</h3>
                    <label for="steamid">Steam ID, Username, or Profile URL:</label><br>
                    <input type="text" id="steamid" name="steamid" placeholder="yourusername or https://steamcommunity.com/id/yourusername/">
                    <br><br>
                    <button type="submit">Compare Steam Games</button>
                </form>
            </div>
            
            <div id="epic-form" style="display: none;">
                <form action="/compare-epic" method="POST">
                    <h3>Epic Games Library Comparison</h3>
                    <label for="epicgames">Paste your Epic Games list (one game per line):</label><br>
                    <textarea id="epicgames" name="epicgames" rows="10" cols="80" placeholder="* >observer_ (App name: Tumeric | Version: 1.0.2)
* A Short Hike (App name: d6407c9e6fd54cb492b8c6635480d792 | Version: 1.9_v3_OSX)
* Celeste (App name: Salt | Version: 1.4.0.0-Mac)
...

Or just paste game names one per line:
A Short Hike
Celeste
Enter the Gungeon
..." style="width: 100%; max-width: 600px; padding: 10px; border: 1px solid var(--input-border); border-radius: 5px; background: var(--input-bg); color: var(--text-color); font-family: monospace; font-size: 0.9em;"></textarea>
                    <br><br>
                    <button type="submit">Compare Epic Games</button>
                </form>
            </div>
            
            <div id="gog-form" style="display: none;">
                <form action="/compare-gog" method="POST">
                    <h3>GOG Library Comparison</h3>
                    <label for="goggames">Paste your GOG games JSON export:</label><br>
                    <textarea id="goggames" name="goggames" rows="10" cols="80" placeholder='{
  "products": [
    {
      "title": "Cyberpunk 2077",
      "id": "1423049311"
    },
    {
      "title": "The Witcher 3: Wild Hunt", 
      "id": "1207658924"
    },
    {
      "title": "Disco Elysium - The Final Cut",
      "id": "1432208681"
    }
  ]
}

Or simple text format (one game per line):
Cyberpunk 2077
The Witcher 3: Wild Hunt
Disco Elysium - The Final Cut
....' style="width: 100%; max-width: 600px; padding: 10px; border: 1px solid var(--input-border); border-radius: 5px; background: var(--input-bg); color: var(--text-color); font-family: monospace; font-size: 0.9em;"></textarea>
                    <br><br>
                    <button type="submit">Compare GOG Games</button>
                </form>
            </div>
            
            <script>
                function showSteamForm() {
                    document.getElementById('steam-form').style.display = 'block';
                    document.getElementById('epic-form').style.display = 'none';
                    document.getElementById('gog-form').style.display = 'none';
                    document.getElementById('steam-btn').style.background = '#1b2838';
                    document.getElementById('epic-btn').style.background = '#666';
                    document.getElementById('gog-btn').style.background = '#666';
                }
                
                function showEpicForm() {
                    document.getElementById('steam-form').style.display = 'none';
                    document.getElementById('epic-form').style.display = 'block';
                    document.getElementById('gog-form').style.display = 'none';
                    document.getElementById('steam-btn').style.background = '#666';
                    document.getElementById('epic-btn').style.background = '#313131';
                    document.getElementById('gog-btn').style.background = '#666';
                }
                
                function showGogForm() {
                    document.getElementById('steam-form').style.display = 'none';
                    document.getElementById('epic-form').style.display = 'none';
                    document.getElementById('gog-form').style.display = 'block';
                    document.getElementById('steam-btn').style.background = '#666';
                    document.getElementById('epic-btn').style.background = '#666';
                    document.getElementById('gog-btn').style.background = '#7c3aed';
                }
            </script>
            
            <div class="help">
                <h3>How to use:</h3>
                <p><strong>Steam:</strong></p>
                <ul>
                    <li><strong>Custom URL:</strong> https://steamcommunity.com/id/yourusername/</li>
                    <li><strong>Just your username:</strong> yourusername</li>
                    <li><strong>Numeric URL:</strong> https://steamcommunity.com/profiles/76561198123456789</li>
                    <li><strong>Steam ID64:</strong> 76561198123456789</li>
                </ul>
                <p><strong>Note:</strong> Your Steam profile must be public to view your game library.</p>
                
                <p><strong>Epic Games:</strong></p>
                <ul>
                    <li>Copy your Epic Games library list and paste it in the text area</li>
                    <li>Accepts Epic's native format: <code>* Game Name (App name: id | Version: x)</code></li>
                    <li>Also accepts simple game names, one per line</li>
                    <li>You can get your Epic Games list from the Epic Games Launcher</li>
                </ul>
                
                <p><strong>GOG:</strong></p>
                <ul>
                    <li><strong>Preferred:</strong> Export your games as JSON from GOG Galaxy or GOG.com account in the format: <code>{"products": [{"title": "Game Name"}, ...]}</code></li>
                    <li><strong>Alternative:</strong> Simply paste game names, one per line</li>
                    <li>Game names should match exactly as they appear in your GOG library</li>
                    <li>JSON format allows for more accurate parsing and future features</li>
                </ul>
                
                <div style="background: var(--warning-bg); padding: 15px; border-radius: 5px; margin-top: 15px; border-left: 4px solid var(--warning-border);">
                    <h4 style="margin: 0 0 10px 0;">Important Disclaimer</h4>
                    <p style="margin: 0; font-size: 0.9em;">Finding a match means there's a Portmaster port with a similar name to your game. However, <strong>the port may require the original game files, assets, or may be a completely different version</strong>. Always check the port's requirements before assuming compatibility with your Steam, Epic, or GOG version.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.post('/compare-epic', async (req, res) => {
  try {
    const epicGamesText = req.body.epicgames;
    if (!epicGamesText || !epicGamesText.trim()) {
      return res.send(errorPage('Please provide your Epic Games list.'));
    }

    console.log('Parsing Epic games list...');
    const epicGames = parseEpicGames(epicGamesText);
    
    if (epicGames.length === 0) {
      return res.send(errorPage('No games found in the provided list. Please check the format and try again.'));
    }

    console.log(`Found ${epicGames.length} Epic games`);
    console.log('Fetching Portmaster games...');
    let portmasterGames;
    try {
      portmasterGames = await getPortmasterGames();
    } catch (error) {
      return res.send(errorPage(error.message));
    }
    
    console.log('Comparing games...');
    const comparison = compareEpicGames(epicGames, portmasterGames);
    
    res.send(generateEpicReport(epicGames, portmasterGames, comparison));
  } catch (error) {
    console.error('Epic comparison error:', error);
    res.send(errorPage('An error occurred while comparing Epic games. Please try again.'));
  }
});

app.post('/compare-gog', async (req, res) => {
  try {
    const gogGamesText = req.body.goggames;
    if (!gogGamesText || !gogGamesText.trim()) {
      return res.send(errorPage('Please provide your GOG games list.'));
    }

    console.log('Parsing GOG games list...');
    const gogGames = parseGogGames(gogGamesText);
    
    if (gogGames.length === 0) {
      return res.send(errorPage('No games found in the provided list. Please check the format and try again.'));
    }

    console.log(`Found ${gogGames.length} GOG games`);
    console.log('Fetching Portmaster games...');
    let portmasterGames;
    try {
      portmasterGames = await getPortmasterGames();
    } catch (error) {
      return res.send(errorPage(error.message));
    }
    
    console.log('Comparing games...');
    const comparison = compareGogGames(gogGames, portmasterGames);
    
    res.send(generateGogReport(gogGames, portmasterGames, comparison));
  } catch (error) {
    console.error('GOG comparison error:', error);
    res.send(errorPage('An error occurred while comparing GOG games. Please try again.'));
  }
});

function parseEpicGames(epicGamesText) {
  const lines = epicGamesText.split('\n');
  const games = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Skip header lines
    if (trimmed.toLowerCase().includes('available games:') || 
        trimmed.toLowerCase().includes('total:') ||
        trimmed.match(/^\d+\.?$/)) {
      continue;
    }
    
    let gameName = null;
    
    // Parse Epic format: * Game Name (App name: ... | Version: ...)
    const epicFormatMatch = trimmed.match(/^\*\s*(.+?)\s*\(App name:/);
    if (epicFormatMatch) {
      gameName = epicFormatMatch[1].trim();
    } else if (trimmed && !trimmed.startsWith('*') && !trimmed.includes('App name:')) {
      // Parse simple format: just game names
      gameName = trimmed;
    } else if (trimmed.startsWith('+')) {
      // Handle lines starting with + (DLC/expansions)
      const dlcMatch = trimmed.match(/^\+\s*(.+?)\s*\(App name:/);
      if (dlcMatch) {
        gameName = dlcMatch[1].trim();
      }
    }
    
    if (gameName && gameName.length > 0) {
      // Clean up the game name
      gameName = gameName.replace(/^[\*\+]\s*/, '').trim();
      
      games.push({
        name: gameName,
        platform: 'Epic Games'
      });
    }
  }
  
  // Remove duplicates
  const uniqueGames = games.filter((game, index, self) => 
    index === self.findIndex(g => g.name.toLowerCase() === game.name.toLowerCase())
  );
  
  return uniqueGames;
}

function parseGogGames(gogGamesText) {
  const games = [];
  const trimmedInput = gogGamesText.trim();
  
  // Try to parse as JSON first
  try {
    const jsonData = JSON.parse(trimmedInput);
    
    // Check if it has the expected "products" array structure
    if (jsonData && jsonData.products && Array.isArray(jsonData.products)) {
      jsonData.products.forEach(product => {
        if (product.title && typeof product.title === 'string' && product.title.trim()) {
          games.push({
            name: product.title.trim(),
            platform: 'GOG'
          });
        }
      });
      
      // Remove duplicates
      const uniqueGames = games.filter((game, index, self) => 
        index === self.findIndex(g => g.name.toLowerCase() === game.name.toLowerCase())
      );
      
      return uniqueGames;
    }
  } catch (e) {
    // If JSON parsing fails, fall back to line-by-line parsing for backward compatibility
    console.log('JSON parsing failed, falling back to line-by-line parsing');
  }
  
  // Fallback: parse as line-by-line format for backward compatibility
  const lines = trimmedInput.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Skip header lines or numbers
    if (trimmed.toLowerCase().includes('available games:') || 
        trimmed.toLowerCase().includes('total:') ||
        trimmed.match(/^\d+\.?$/)) {
      continue;
    }
    
    // GOG format is simpler - just game names one per line
    let gameName = trimmed;
    
    if (gameName && gameName.length > 0) {
      games.push({
        name: gameName,
        platform: 'GOG'
      });
    }
  }
  
  // Remove duplicates
  const uniqueGames = games.filter((game, index, self) => 
    index === self.findIndex(g => g.name.toLowerCase() === game.name.toLowerCase())
  );
  
  return uniqueGames;
}

function compareEpicGames(epicGames, portmasterGames) {
  const matches = [];
  
  epicGames.forEach(epicGame => {
    portmasterGames.forEach(portGame => {
      const epicLower = epicGame.name.toLowerCase();
      const portLower = portGame.name.toLowerCase();
      
      // Exact match
      if (epicLower === portLower) {
        matches.push({
          epicGame: epicGame.name,
          portmasterGame: portGame.name,
          originalName: portGame.originalName,
          description: portGame.description,
          portData: portGame.portData,
          matchType: 'exact'
        });
        return;
      }
      
      // Space-insensitive match (remove spaces from both)
      const epicNoSpaces = epicLower.replace(/\s+/g, '');
      const portNoSpaces = portLower.replace(/\s+/g, '');
      
      if (epicNoSpaces === portNoSpaces) {
        matches.push({
          epicGame: epicGame.name,
          portmasterGame: portGame.name,
          originalName: portGame.originalName,
          description: portGame.description,
          portData: portGame.portData,
          matchType: 'space-insensitive'
        });
      }
    });
  });
  
  // Sort matches alphabetically by Epic game name
  matches.sort((a, b) => a.epicGame.localeCompare(b.epicGame));
  
  return { matches };
}

function compareGogGames(gogGames, portmasterGames) {
  const matches = [];
  
  gogGames.forEach(gogGame => {
    portmasterGames.forEach(portGame => {
      const gogLower = gogGame.name.toLowerCase();
      const portLower = portGame.name.toLowerCase();
      
      // Exact match
      if (gogLower === portLower) {
        matches.push({
          gogGame: gogGame.name,
          portmasterGame: portGame.name,
          originalName: portGame.originalName,
          description: portGame.description,
          portData: portGame.portData,
          matchType: 'exact'
        });
        return;
      }
      
      // Space-insensitive match (remove spaces from both)
      const gogNoSpaces = gogLower.replace(/\s+/g, '');
      const portNoSpaces = portLower.replace(/\s+/g, '');
      
      if (gogNoSpaces === portNoSpaces) {
        matches.push({
          gogGame: gogGame.name,
          portmasterGame: portGame.name,
          originalName: portGame.originalName,
          description: portGame.description,
          portData: portGame.portData,
          matchType: 'space-insensitive'
        });
      }
    });
  });
  
  // Sort matches alphabetically by GOG game name
  matches.sort((a, b) => a.gogGame.localeCompare(b.gogGame));
  
  return { matches };
}

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
    let portmasterGames;
    try {
      portmasterGames = await getPortmasterGames();
    } catch (error) {
      return res.send(errorPage(error.message));
    }
    
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

  // Check cache first
  const cacheKey = `steam_games_${steamId}`;
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`Using cached Steam games for ${steamId} (${cached.length} games)`);
    return cached;
  }

  try {
    const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&format=json`;
    const response = await axios.get(url);
    
    if (!response.data.response || !response.data.response.games) {
      return { error: 'Steam profile is private or does not exist. Please make your Steam profile public and try again.' };
    }
    
    const games = response.data.response.games;
    setCache(cacheKey, games);
    return games;
  } catch (error) {
    console.error('Error fetching Steam games:', error);
    return { error: 'Failed to fetch Steam games. Please check your Steam ID and try again.' };
  }
}

async function getPortmasterGames() {
  // Check cache first
  const cached = getCache('portmaster_games');
  if (cached) {
    console.log(`Using cached Portmaster games (${cached.length} games)`);
    return cached;
  }

  try {
    console.log('Fetching Portmaster games from official ports.json...');
    
    // Use the official data source that the website uses
    const response = await axios.get('https://raw.githubusercontent.com/PortsMaster/PortMaster-Info/main/ports.json', {
      timeout: 30000,
      headers: {
        'User-Agent': 'Steam-Portmaster-Checker/1.0.0',
        'Accept': 'application/json'
      }
    });
    
    const games = [];
    
    if (response.data && response.data.ports) {
      const portsData = response.data.ports;
      console.log(`Found ${Object.keys(portsData).length} ports in official JSON`);
      

      Object.entries(portsData).forEach(([portKey, portData]) => {
        // Priority: Use the actual display name from the JSON data
        // Look for display name in various fields, prioritizing title over name
        let displayName = portData.attr?.title || 
                         portData.name || 
                         portData.attr?.desc ||
                         portData.description ||
                         null;
        
        let finalName;
        let cleanedName;
        
        // If we have a display name and it's not just the filename, use it as-is
        if (displayName && displayName !== portKey && !displayName.endsWith('.zip')) {
          finalName = displayName.trim();
        } else {
          // Fallback: Clean up the filename only if no display name exists
          cleanedName = portKey
            .replace(/\.zip$/i, '') // Remove .zip suffix
            .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capitals
            .replace(/\s+/g, ' ') // Multiple spaces to single space
            .trim();
          
          // Capitalize first letter of each word
          cleanedName = cleanedName.replace(/\b\w/g, l => l.toUpperCase());
          finalName = cleanedName;
        }
        
        games.push({ 
          name: finalName,
          originalName: portKey.replace(/\.zip$/i, ''),
          description: portData.attr?.desc || '',
          genres: portData.attr?.genres || [],
          // Store minimal data needed for image display
          portData: {
            name: portKey,
            attr: { image: portData.attr?.image || { screenshot: null } },
            source: { repo: portData.source?.repo || 'main' }
          }
        });
      });
    }
    
    console.log(`Found ${games.length} Portmaster games from official source`);
    if (games.length > 0) {
      setCache('portmaster_games', games);
      return games;
    }
    
    // If no games found, throw error to trigger fallback
    throw new Error('No games found in official ports.json');
    
  } catch (error) {
    console.error('Error fetching from official ports.json:', error.message);
    
    // Check if this is a rate limit error
    if (error.response && error.response.status === 403) {
      console.error('GitHub API rate limit exceeded');
      throw new Error('GitHub API rate limit exceeded. Please wait about an hour before trying again, or try again later when fewer people are using the service.');
    }
    
    // Fallback to original repository
    try {
      console.log('Trying fallback to original repository...');
      const response = await axios.get('https://api.github.com/repos/christianhaitian/PortMaster/contents', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Steam-Portmaster-Checker/1.0.0'
        }
      });
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
              originalName: file.name.replace('.zip', ''),
              description: '',
              portData: {
                name: file.name,
                attr: { image: { screenshot: 'screenshot.jpg' } },
                source: { repo: 'main' }
              }
            });
          }
        });
      }
      
      console.log(`Fallback: Found ${games.length} games from original repository`);
      setCache('portmaster_games', games);
      return games;
    } catch (fallbackError) {
      console.error('All GitHub sources failed:', fallbackError.message);
      
      // Check if fallback also hit rate limit
      if (fallbackError.response && fallbackError.response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please wait about an hour before trying again, or try again later when fewer people are using the service.');
      }
      
      // For other errors, provide a generic message
      throw new Error('Unable to fetch Portmaster games list. This might be due to GitHub being temporarily unavailable. Please try again later.');
    }
  }
}


function compareGames(steamGames, portmasterGames) {
  const matches = [];
  
  steamGames.forEach(steamGame => {
    portmasterGames.forEach(portGame => {
      const steamLower = steamGame.name.toLowerCase();
      const portLower = portGame.name.toLowerCase();
      
      // Exact match
      if (steamLower === portLower) {
        matches.push({
          steamGame: steamGame.name,
          steamAppId: steamGame.appid,
          portmasterGame: portGame.name,
          originalName: portGame.originalName,
          description: portGame.description,
          portData: portGame.portData,
          playtime: Math.round(steamGame.playtime_forever / 60),
          matchType: 'exact'
        });
        return;
      }
      
      // Space-insensitive match (remove spaces from both)
      const steamNoSpaces = steamLower.replace(/\s+/g, '');
      const portNoSpaces = portLower.replace(/\s+/g, '');
      
      if (steamNoSpaces === portNoSpaces) {
        matches.push({
          steamGame: steamGame.name,
          steamAppId: steamGame.appid,
          portmasterGame: portGame.name,
          originalName: portGame.originalName,
          description: portGame.description,
          portData: portGame.portData,
          playtime: Math.round(steamGame.playtime_forever / 60),
          matchType: 'space-insensitive'
        });
      }
    });
  });
  
  // Sort matches alphabetically by Steam game name
  matches.sort((a, b) => a.steamGame.localeCompare(b.steamGame));
  
  return { matches };
}

// Replicate the official portmaster.games functions exactly
function getImageUrl(port) {
  const name = port.name.replace('.zip', '');
  const imageName = port.attr.image.screenshot;
  if (imageName !== null) {
    if (port.source.repo === 'main') {
      return `https://raw.githubusercontent.com/PortsMaster/PortMaster-New/main/ports/${encodeURIComponent(name)}/${encodeURIComponent(imageName)}`;
    } else if (port.source.repo === 'multiverse') {
      return `https://raw.githubusercontent.com/PortsMaster-MV/PortMaster-MV-New/main/ports/${encodeURIComponent(name)}/${encodeURIComponent(imageName)}`;
    }
  }
  
  return 'https://raw.githubusercontent.com/PortsMaster/PortMaster-Website/main/no.image.png';
}


function generateEpicReport(epicGames, portmasterGames, comparison) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Your Portmaster Compatible Epic Games</title>
        <script>
          window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/insights/script.js"></script>
        <script>
          window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/speed-insights/script.js"></script>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 1000px; 
                margin: 20px auto; 
                padding: 20px;
                background-color: var(--bg-color);
                color: var(--text-color);
                transition: background-color 0.3s, color 0.3s;
            }
            
            :root {
                --bg-color: #ffffff;
                --text-color: #333333;
                --header-bg: #4CAF50;
                --stat-bg: #f5f5f5;
                --stat-number: #4CAF50;
                --matches-bg: #e8f5e8;
                --match-bg: #ffffff;
                --match-border: #4CAF50;
                --playtime-color: #666;
                --no-matches-bg: #fff3cd;
                --back-btn-bg: #2196F3;
                --image-border: #ddd;
                --placeholder-bg: #f0f0f0;
                --placeholder-text: #666;
                --warning-border: #ffc107;
                --warning-bg: #f8f4e6;
            }
            
            @media (prefers-color-scheme: dark) {
                :root {
                    --bg-color: #1a1a1a;
                    --text-color: #e0e0e0;
                    --header-bg: #4CAF50;
                    --stat-bg: #2d2d2d;
                    --stat-number: #4CAF50;
                    --matches-bg: #1e3a1e;
                    --match-bg: #2d2d2d;
                    --match-border: #4CAF50;
                    --playtime-color: #aaa;
                    --no-matches-bg: #3d3a1e;
                    --back-btn-bg: #2196F3;
                    --image-border: #555;
                    --placeholder-bg: #3d3d3d;
                    --placeholder-text: #aaa;
                    --warning-border: #ffb347;
                    --warning-bg: #2a2416;
                }
            }
            
            .header { 
                background: var(--header-bg); 
                color: white; 
                padding: 20px; 
                border-radius: 10px; 
                text-align: center; 
            }
            
            .stats { 
                display: flex; 
                justify-content: space-around; 
                margin: 20px 0; 
            }
            
            .stat { 
                background: var(--stat-bg); 
                padding: 20px; 
                border-radius: 10px; 
                text-align: center; 
            }
            
            .stat h3 { 
                margin: 0; 
                color: var(--text-color); 
            }
            
            .stat .number { 
                font-size: 2em; 
                font-weight: bold; 
                color: var(--stat-number); 
            }
            
            .matches { 
                background: var(--matches-bg); 
                padding: 20px; 
                border-radius: 10px; 
                margin-top: 20px; 
            }
            
            .match { 
                background: var(--match-bg); 
                margin: 10px 0; 
                padding: 15px; 
                border-radius: 5px; 
                border-left: 4px solid var(--match-border); 
            }
            
            .match h4 { 
                margin: 0 0 10px 0; 
                color: var(--text-color); 
            }
            
            .back-btn { 
                background: var(--back-btn-bg); 
                color: white; 
                padding: 10px 20px; 
                text-decoration: none; 
                border-radius: 5px; 
                display: inline-block; 
                margin-top: 20px; 
            }
            
            .no-matches-section {
                background: var(--no-matches-bg);
                padding: 20px;
                border-radius: 10px;
                margin-top: 20px;
            }
            
            @media (max-width: 768px) {
                body {
                    margin: 10px auto;
                    padding: 10px;
                    max-width: 100%;
                }
                
                .header {
                    padding: 15px;
                }
                
                .header h1 {
                    font-size: 1.5em;
                    margin: 0 0 10px 0;
                }
                
                .stats {
                    flex-direction: column;
                    gap: 10px;
                    margin: 15px 0;
                }
                
                .stat {
                    padding: 15px;
                }
                
                .matches {
                    padding: 15px;
                }
                
                .match {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 10px !important;
                    padding: 15px;
                }
                
                .match img, .match div:has(+ *:empty) {
                    width: 100% !important;
                    max-width: 200px;
                    height: auto !important;
                    align-self: center;
                }
                
                .match h4 {
                    font-size: 1.1em;
                    text-align: center;
                    width: 100%;
                }
                
                .match > div:last-child {
                    width: 100%;
                    text-align: center;
                }
                
                .match a {
                    display: inline-block;
                    margin: 5px 5px 0 0 !important;
                    padding: 8px 12px !important;
                    font-size: 0.85em !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Your Portmaster Compatible Epic Games</h1>
            <p>Games from your Epic Games library that work with Portmaster</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="number">${epicGames.length}</div>
                <h3>Epic Games</h3>
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
        <div style="background: var(--warning-bg); padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid var(--warning-border);">
            <h4 style="margin: 0 0 10px 0;">Important: Read Before Installing</h4>
            <p style="margin: 0; font-size: 0.9em;">These matches are based on game names only. <strong>Many Portmaster ports require original game files, assets, or may be completely different implementations</strong>. Always check each port's documentation and requirements before installation.</p>
        </div>
        
        <div class="matches">
            <h2>Potential Portmaster Ports for Your Epic Games:</h2>
            ${comparison.matches.map(match => `
                <div class="match" style="display: flex; align-items: center; gap: 15px;">
                    <div style="flex-shrink: 0;">
                        <img src="${getImageUrl(match.portData)}" 
                             alt="${match.portmasterGame} screenshot"
                             style="width: 120px; height: 80px; object-fit: cover; border-radius: 5px; border: 1px solid var(--image-border);"
                             onerror="this.src='https://raw.githubusercontent.com/PortsMaster/PortMaster-Website/main/no.image.png';">
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 10px 0;">${match.epicGame}</h4>
                        ${match.description ? `<p style="margin: 0 0 15px 0; color: var(--playtime-color); font-size: 0.9em; line-height: 1.4;">${match.description}</p>` : ''}
                        <div style="margin-top: 10px;">
                            <a href="https://store.epicgames.com/en-US/search?q=${encodeURIComponent(match.epicGame)}" 
                               target="_blank" 
                               style="background: #313131; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; font-size: 0.9em; margin-right: 10px;">
                                Search on Epic
                            </a>
                            <a href="https://portmaster.games/detail.html?name=${encodeURIComponent(match.originalName)}" 
                               target="_blank" 
                               style="background: #2196F3; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; font-size: 0.9em;">
                                View Port Details
                            </a>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="no-matches-section">
            <h2>No Direct Matches Found</h2>
            <p>We didn't find any exact matches between your Epic Games library and Portmaster supported games. This could be because:</p>
            <ul>
                <li>Game names don't match exactly between platforms</li>
                <li>You may have games that require additional files to work with Portmaster</li>
                <li>New ports may have been added since our last update</li>
            </ul>
            <p>Check the <a href="https://portmaster.games/games.html" target="_blank">full Portmaster games list</a> manually for potential matches.</p>
        </div>
        `}
        
        <a href="/" class="back-btn">Try Another Game List</a>
        
    </body>
    </html>
  `;
}

function generateGogReport(gogGames, portmasterGames, comparison) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Your Portmaster Compatible GOG Games</title>
        <script>
          window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/insights/script.js"></script>
        <script>
          window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/speed-insights/script.js"></script>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 1000px; 
                margin: 20px auto; 
                padding: 20px;
                background-color: var(--bg-color);
                color: var(--text-color);
                transition: background-color 0.3s, color 0.3s;
            }
            
            :root {
                --bg-color: #ffffff;
                --text-color: #333333;
                --header-bg: #4CAF50;
                --stat-bg: #f5f5f5;
                --stat-number: #4CAF50;
                --matches-bg: #e8f5e8;
                --match-bg: #ffffff;
                --match-border: #4CAF50;
                --playtime-color: #666;
                --no-matches-bg: #fff3cd;
                --back-btn-bg: #2196F3;
                --image-border: #ddd;
                --placeholder-bg: #f0f0f0;
                --placeholder-text: #666;
                --warning-border: #ffc107;
                --warning-bg: #f8f4e6;
            }
            
            @media (prefers-color-scheme: dark) {
                :root {
                    --bg-color: #1a1a1a;
                    --text-color: #e0e0e0;
                    --header-bg: #4CAF50;
                    --stat-bg: #2d2d2d;
                    --stat-number: #4CAF50;
                    --matches-bg: #1e3a1e;
                    --match-bg: #2d2d2d;
                    --match-border: #4CAF50;
                    --playtime-color: #aaa;
                    --no-matches-bg: #3d3a1e;
                    --back-btn-bg: #2196F3;
                    --image-border: #555;
                    --placeholder-bg: #3d3d3d;
                    --placeholder-text: #aaa;
                    --warning-border: #ffb347;
                    --warning-bg: #2a2416;
                }
            }
            
            .header { 
                background: var(--header-bg); 
                color: white; 
                padding: 20px; 
                border-radius: 10px; 
                text-align: center; 
            }
            
            .stats { 
                display: flex; 
                justify-content: space-around; 
                margin: 20px 0; 
            }
            
            .stat { 
                background: var(--stat-bg); 
                padding: 20px; 
                border-radius: 10px; 
                text-align: center; 
            }
            
            .stat h3 { 
                margin: 0; 
                color: var(--text-color); 
            }
            
            .stat .number { 
                font-size: 2em; 
                font-weight: bold; 
                color: var(--stat-number); 
            }
            
            .matches { 
                background: var(--matches-bg); 
                padding: 20px; 
                border-radius: 10px; 
                margin-top: 20px; 
            }
            
            .match { 
                background: var(--match-bg); 
                margin: 10px 0; 
                padding: 15px; 
                border-radius: 5px; 
                border-left: 4px solid var(--match-border); 
            }
            
            .match h4 { 
                margin: 0 0 10px 0; 
                color: var(--text-color); 
            }
            
            .back-btn { 
                background: var(--back-btn-bg); 
                color: white; 
                padding: 10px 20px; 
                text-decoration: none; 
                border-radius: 5px; 
                display: inline-block; 
                margin-top: 20px; 
            }
            
            .no-matches-section {
                background: var(--no-matches-bg);
                padding: 20px;
                border-radius: 10px;
                margin-top: 20px;
            }
            
            @media (max-width: 768px) {
                body {
                    margin: 10px auto;
                    padding: 10px;
                    max-width: 100%;
                }
                
                .header {
                    padding: 15px;
                }
                
                .header h1 {
                    font-size: 1.5em;
                    margin: 0 0 10px 0;
                }
                
                .stats {
                    flex-direction: column;
                    gap: 10px;
                    margin: 15px 0;
                }
                
                .stat {
                    padding: 15px;
                }
                
                .matches {
                    padding: 15px;
                }
                
                .match {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 10px !important;
                    padding: 15px;
                }
                
                .match img, .match div:has(+ *:empty) {
                    width: 100% !important;
                    max-width: 200px;
                    height: auto !important;
                    align-self: center;
                }
                
                .match h4 {
                    font-size: 1.1em;
                    text-align: center;
                    width: 100%;
                }
                
                .match > div:last-child {
                    width: 100%;
                    text-align: center;
                }
                
                .match a {
                    display: inline-block;
                    margin: 5px 5px 0 0 !important;
                    padding: 8px 12px !important;
                    font-size: 0.85em !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Your Portmaster Compatible GOG Games</h1>
            <p>Games from your GOG library that work with Portmaster</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="number">${gogGames.length}</div>
                <h3>GOG Games</h3>
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
        <div style="background: var(--warning-bg); padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid var(--warning-border);">
            <h4 style="margin: 0 0 10px 0;">Important: Read Before Installing</h4>
            <p style="margin: 0; font-size: 0.9em;">These matches are based on game names only. <strong>Many Portmaster ports require original game files, assets, or may be completely different implementations</strong>. Always check each port's documentation and requirements before installation.</p>
        </div>
        
        <div class="matches">
            <h2>Potential Portmaster Ports for Your GOG Games:</h2>
            ${comparison.matches.map(match => `
                <div class="match" style="display: flex; align-items: center; gap: 15px;">
                    <div style="flex-shrink: 0;">
                        <img src="${getImageUrl(match.portData)}" 
                             alt="${match.portmasterGame} screenshot"
                             style="width: 120px; height: 80px; object-fit: cover; border-radius: 5px; border: 1px solid var(--image-border);"
                             onerror="this.src='https://raw.githubusercontent.com/PortsMaster/PortMaster-Website/main/no.image.png';">
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 10px 0;">${match.gogGame}</h4>
                        ${match.description ? `<p style="margin: 0 0 15px 0; color: var(--playtime-color); font-size: 0.9em; line-height: 1.4;">${match.description}</p>` : ''}
                        <div style="margin-top: 10px;">
                            <a href="https://www.gog.com/en/games?search=${encodeURIComponent(match.gogGame)}" 
                               target="_blank" 
                               style="background: #7c3aed; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; font-size: 0.9em; margin-right: 10px;">
                                Search on GOG
                            </a>
                            <a href="https://portmaster.games/detail.html?name=${encodeURIComponent(match.originalName)}" 
                               target="_blank" 
                               style="background: #2196F3; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; font-size: 0.9em;">
                                View Port Details
                            </a>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="no-matches-section">
            <h2>No Direct Matches Found</h2>
            <p>We didn't find any exact matches between your GOG library and Portmaster supported games. This could be because:</p>
            <ul>
                <li>Game names don't match exactly between platforms</li>
                <li>You may have games that require additional files to work with Portmaster</li>
                <li>New ports may have been added since our last update</li>
            </ul>
            <p>Check the <a href="https://portmaster.games/games.html" target="_blank">full Portmaster games list</a> manually for potential matches.</p>
        </div>
        `}
        
        <a href="/" class="back-btn">Try Another Game List</a>
        
    </body>
    </html>
  `;
}


function generateReport(steamGames, portmasterGames, comparison) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Your Portmaster Compatible Games</title>
        <script>
          window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/insights/script.js"></script>
        <script>
          window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/speed-insights/script.js"></script>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 1000px; 
                margin: 20px auto; 
                padding: 20px;
                background-color: var(--bg-color);
                color: var(--text-color);
                transition: background-color 0.3s, color 0.3s;
            }
            
            :root {
                --bg-color: #ffffff;
                --text-color: #333333;
                --header-bg: #4CAF50;
                --stat-bg: #f5f5f5;
                --stat-number: #4CAF50;
                --matches-bg: #e8f5e8;
                --match-bg: #ffffff;
                --match-border: #4CAF50;
                --playtime-color: #666;
                --no-matches-bg: #fff3cd;
                --back-btn-bg: #2196F3;
                --image-border: #ddd;
                --placeholder-bg: #f0f0f0;
                --placeholder-text: #666;
            }
            
            @media (prefers-color-scheme: dark) {
                :root {
                    --bg-color: #1a1a1a;
                    --text-color: #e0e0e0;
                    --header-bg: #4CAF50;
                    --stat-bg: #2d2d2d;
                    --stat-number: #4CAF50;
                    --matches-bg: #1e3a1e;
                    --match-bg: #2d2d2d;
                    --match-border: #4CAF50;
                    --playtime-color: #aaa;
                    --no-matches-bg: #3d3a1e;
                    --back-btn-bg: #2196F3;
                    --image-border: #555;
                    --placeholder-bg: #3d3d3d;
                    --placeholder-text: #aaa;
                }
            }
            
            .header { 
                background: var(--header-bg); 
                color: white; 
                padding: 20px; 
                border-radius: 10px; 
                text-align: center; 
            }
            
            .stats { 
                display: flex; 
                justify-content: space-around; 
                margin: 20px 0; 
            }
            
            .stat { 
                background: var(--stat-bg); 
                padding: 20px; 
                border-radius: 10px; 
                text-align: center; 
            }
            
            .stat h3 { 
                margin: 0; 
                color: var(--text-color); 
            }
            
            .stat .number { 
                font-size: 2em; 
                font-weight: bold; 
                color: var(--stat-number); 
            }
            
            .matches { 
                background: var(--matches-bg); 
                padding: 20px; 
                border-radius: 10px; 
                margin-top: 20px; 
            }
            
            .match { 
                background: var(--match-bg); 
                margin: 10px 0; 
                padding: 15px; 
                border-radius: 5px; 
                border-left: 4px solid var(--match-border); 
            }
            
            .match h4 { 
                margin: 0 0 10px 0; 
                color: var(--text-color); 
            }
            
            .playtime { 
                color: var(--playtime-color); 
                font-size: 0.9em; 
            }
            
            .back-btn { 
                background: var(--back-btn-bg); 
                color: white; 
                padding: 10px 20px; 
                text-decoration: none; 
                border-radius: 5px; 
                display: inline-block; 
                margin-top: 20px; 
            }
            
            .no-matches-section {
                background: var(--no-matches-bg);
                padding: 20px;
                border-radius: 10px;
                margin-top: 20px;
            }
            
            @media (max-width: 768px) {
                body {
                    margin: 10px auto;
                    padding: 10px;
                    max-width: 100%;
                }
                
                .header {
                    padding: 15px;
                }
                
                .header h1 {
                    font-size: 1.5em;
                    margin: 0 0 10px 0;
                }
                
                .stats {
                    flex-direction: column;
                    gap: 10px;
                    margin: 15px 0;
                }
                
                .stat {
                    padding: 15px;
                }
                
                .matches {
                    padding: 15px;
                }
                
                .match {
                    flex-direction: column !important;
                    align-items: flex-start !important;
                    gap: 10px !important;
                    padding: 15px;
                }
                
                .match img, .match div:has(+ *:empty) {
                    width: 100% !important;
                    max-width: 200px;
                    height: auto !important;
                    align-self: center;
                }
                
                .match h4 {
                    font-size: 1.1em;
                    text-align: center;
                    width: 100%;
                }
                
                .match > div:last-child {
                    width: 100%;
                    text-align: center;
                }
                
                .match a {
                    display: inline-block;
                    margin: 5px 5px 0 0 !important;
                    padding: 8px 12px !important;
                    font-size: 0.85em !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Your Portmaster Compatible Games</h1>
            <p>Games from your Steam library that work with Portmaster</p>
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
        <div style="background: var(--warning-bg); padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid var(--warning-border);">
            <h4 style="margin: 0 0 10px 0;">Important: Read Before Installing</h4>
            <p style="margin: 0; font-size: 0.9em;">These matches are based on game names only. <strong>Many Portmaster ports require original game files, specific versions, or may be completely different implementations</strong>. Always check each port's documentation and requirements before installation.</p>
        </div>
        
        <div class="matches">
            <h2>Potential Portmaster Ports for Your Games:</h2>
            ${comparison.matches.map(match => `
                <div class="match" style="display: flex; align-items: center; gap: 15px;">
                    <div style="flex-shrink: 0;">
                        <img src="${getImageUrl(match.portData)}" 
                             alt="${match.portmasterGame} screenshot"
                             style="width: 120px; height: 80px; object-fit: cover; border-radius: 5px; border: 1px solid var(--image-border);"
                             onerror="this.src='https://raw.githubusercontent.com/PortsMaster/PortMaster-Website/main/no.image.png';">
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 10px 0;">${match.steamGame}</h4>
                        ${match.description ? `<p style="margin: 0 0 15px 0; color: var(--playtime-color); font-size: 0.9em; line-height: 1.4;">${match.description}</p>` : ''}
                        <div style="margin-top: 10px;">
                            <a href="https://store.steampowered.com/app/${match.steamAppId}/" 
                               target="_blank" 
                               style="background: #1b2838; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; font-size: 0.9em; margin-right: 10px;">
                                View on Steam
                            </a>
                            <a href="https://portmaster.games/detail.html?name=${encodeURIComponent(match.originalName)}" 
                               target="_blank" 
                               style="background: #2196F3; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; font-size: 0.9em;">
                                View Port Details
                            </a>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : `
        <div class="no-matches-section">
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
        
        <a href="/" class="back-btn">Try Another Steam ID</a>
        
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
        <script>
          window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/insights/script.js"></script>
        <script>
          window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/speed-insights/script.js"></script>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #ffebee; color: #c62828; padding: 30px; border-radius: 10px; text-align: center; }
            .back-btn { background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="error">
            <h2>Error</h2>
            <p>${message}</p>
            <a href="/" class="back-btn">Try Again</a>
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