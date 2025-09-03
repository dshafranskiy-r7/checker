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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/insights/script.js"></script>
        <script>
          window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/speed-insights/script.js"></script>
    </head>
    <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div class="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 md:p-8">
                <h1 class="text-2xl md:text-3xl font-bold text-center mb-4">Portmaster Game Checker</h1>
                <p class="text-center text-gray-600 dark:text-gray-300 mb-8">
                    Compare your Steam or Epic Games library with <a href="https://portmaster.games/" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">Portmaster</a> supported games!
                </p>

                <div class="mb-8">
                    <h3 class="text-lg font-semibold mb-4">Choose your platform:</h3>
                    <div class="flex flex-wrap gap-3 mb-6">
                        <button type="button" onclick="showSteamForm()"
                                class="px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200"
                                style="background-color: #1b2838;" id="steam-btn">Steam</button>
                        <button type="button" onclick="showEpicForm()"
                                class="px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600"
                                id="epic-btn">Epic Games</button>
                        <button type="button" onclick="showGogForm()"
                                class="px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600"
                                id="gog-btn">GOG</button>
                    </div>
                </div>

                <div id="steam-form" class="block">
                    <form action="/compare" method="POST" class="space-y-4">
                        <h3 class="text-lg font-semibold">Steam Library Comparison</h3>
                        <div>
                            <label for="steamid" class="block text-sm font-medium mb-2">Steam ID, Username, or Profile URL:</label>
                            <input type="text" id="steamid" name="steamid"
                                   placeholder="yourusername or https://steamcommunity.com/id/yourusername/"
                                   class="w-full md:w-96 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <button type="submit"
                                class="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200">
                            Compare Steam Games
                        </button>
                    </form>
                </div>

                <div id="epic-form" class="hidden">
                    <form action="/compare-epic" method="POST" class="space-y-4">
                        <h3 class="text-lg font-semibold">Epic Games Library Comparison</h3>
                        <div>
                            <label for="epicgames" class="block text-sm font-medium mb-2">Paste your Epic Games list (one game per line):</label>
                            <textarea id="epicgames" name="epicgames" rows="10"
                                      placeholder="* >observer_ (App name: Tumeric | Version: 1.0.2)&#10;* A Short Hike (App name: d6407c9e6fd54cb492b8c6635480d792 | Version: 1.9_v3_OSX)&#10;* Celeste (App name: Salt | Version: 1.4.0.0-Mac)&#10;...&#10;&#10;Or just paste game names one per line:&#10;A Short Hike&#10;Celeste&#10;Enter the Gungeon&#10;..."
                                      class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-vertical"></textarea>
                        </div>
                        <button type="submit"
                                class="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200">
                            Compare Epic Games
                        </button>
                    </form>
                </div>

                <div id="gog-form" class="hidden">
                    <form action="/compare-gog" method="POST" class="space-y-4">
                        <h3 class="text-lg font-semibold">GOG Library Comparison</h3>
                        <div>
                            <label for="goggames" class="block text-sm font-medium mb-2">Paste your GOG games JSON export:</label>
                            <textarea id="goggames" name="goggames" rows="10"
                                      placeholder='{&#10;  "products": [&#10;    {&#10;      "title": "Cyberpunk 2077",&#10;      "id": "1423049311"&#10;    },&#10;    {&#10;      "title": "The Witcher 3: Wild Hunt",&#10;      "id": "1207658924"&#10;    },&#10;    {&#10;      "title": "Disco Elysium - The Final Cut",&#10;      "id": "1432208681"&#10;    }&#10;  ]&#10;}&#10;&#10;Or simple text format (one game per line):&#10;Cyberpunk 2077&#10;The Witcher 3: Wild Hunt&#10;Disco Elysium - The Final Cut&#10;....'
                                      class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-vertical"></textarea>
                        </div>
                        <button type="submit"
                                class="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200">
                            Compare GOG Games
                        </button>
                    </form>
                </div>

                <script>
                    function showSteamForm() {
                        document.getElementById('steam-form').className = 'block';
                        document.getElementById('epic-form').className = 'hidden';
                        document.getElementById('gog-form').className = 'hidden';
                        document.getElementById('steam-btn').style.backgroundColor = '#1b2838';
                        document.getElementById('epic-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
                        document.getElementById('gog-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
                    }

                    function showEpicForm() {
                        document.getElementById('steam-form').className = 'hidden';
                        document.getElementById('epic-form').className = 'block';
                        document.getElementById('gog-form').className = 'hidden';
                        document.getElementById('steam-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
                        document.getElementById('epic-btn').style.backgroundColor = '#313131';
                        document.getElementById('gog-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
                    }

                    function showGogForm() {
                        document.getElementById('steam-form').className = 'hidden';
                        document.getElementById('epic-form').className = 'hidden';
                        document.getElementById('gog-form').className = 'block';
                        document.getElementById('steam-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
                        document.getElementById('epic-btn').className = 'px-5 py-2.5 rounded-lg text-white font-medium transition-colors duration-200 bg-gray-600';
                        document.getElementById('gog-btn').style.backgroundColor = '#7c3aed';
                    }
                </script>

                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-8">
                    <h3 class="text-lg font-semibold mb-4">How to use:</h3>

                    <div class="space-y-4">
                        <div>
                            <p class="font-semibold mb-2">Steam:</p>
                            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                <li><strong>Custom URL:</strong> https://steamcommunity.com/id/yourusername/</li>
                                <li><strong>Just your username:</strong> yourusername</li>
                                <li><strong>Numeric URL:</strong> https://steamcommunity.com/profiles/76561198123456789</li>
                                <li><strong>Steam ID64:</strong> 76561198123456789</li>
                            </ul>
                            <p class="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                <strong>Note:</strong> Your Steam profile must be public to view your game library.
                            </p>
                        </div>

                        <div>
                            <p class="font-semibold mb-2">Epic Games:</p>
                            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                <li>Copy your Epic Games library list and paste it in the text area</li>
                                <li>Accepts Epic's native format: <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">* Game Name (App name: id | Version: x)</code></li>
                                <li>Also accepts simple game names, one per line</li>
                                <li>You can get your Epic Games list from the Epic Games Launcher</li>
                            </ul>
                        </div>

                        <div>
                            <p class="font-semibold mb-2">GOG:</p>
                            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                <li><strong>Preferred:</strong> Export your games as JSON from GOG Galaxy or GOG.com account in the format: <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">{"products": [{"title": "Game Name"}, ...]}</code></li>
                                <li><strong>Alternative:</strong> Simply paste game names, one per line</li>
                                <li>Game names should match exactly as they appear in your GOG library</li>
                                <li>JSON format allows for more accurate parsing and future features</li>
                            </ul>
                        </div>
                    </div>

                    <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mt-6">
                        <h4 class="font-semibold mb-2">Important Disclaimer</h4>
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                            Finding a match means there's a Portmaster port with a similar name to your game. However, <strong>the port may require the original game files, assets, or may be a completely different version</strong>. Always check the port's requirements before assuming compatibility with your Steam, Epic, or GOG version.
                        </p>
                    </div>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/insights/script.js"></script>
        <script>
          window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/speed-insights/script.js"></script>
    </head>
    <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div class="max-w-6xl mx-auto px-4 py-6 md:py-8">
            <div class="bg-green-600 text-white rounded-xl p-6 md:p-8 text-center mb-6">
                <h1 class="text-2xl md:text-3xl font-bold mb-2">Your Portmaster Compatible Epic Games</h1>
                <p class="text-green-100">Games from your Epic Games library that work with Portmaster</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                    <div class="text-3xl md:text-4xl font-bold text-green-600 mb-2">${epicGames.length}</div>
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">Epic Games</h3>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                    <div class="text-3xl md:text-4xl font-bold text-green-600 mb-2">${portmasterGames.length}</div>
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">Portmaster Games</h3>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                    <div class="text-3xl md:text-4xl font-bold text-green-600 mb-2">${comparison.matches.length}</div>
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">Matches Found</h3>
                </div>
            </div>

            ${comparison.matches.length > 0 ? `
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-lg p-6 mb-8">
                <h4 class="font-semibold text-lg mb-3">Important: Read Before Installing</h4>
                <p class="text-gray-700 dark:text-gray-300">
                    These matches are based on game names only. <strong>Many Portmaster ports require original game files, assets, or may be completely different implementations</strong>. Always check each port's documentation and requirements before installation.
                </p>
            </div>

            <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 md:p-8">
                <h2 class="text-xl md:text-2xl font-bold mb-6">Potential Portmaster Ports for Your Epic Games:</h2>
                <div class="space-y-4">
                    ${comparison.matches.map(match => `
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 p-4 md:p-6">
                            <div class="flex flex-col md:flex-row md:items-center gap-4">
                                <div class="flex-shrink-0 mx-auto md:mx-0">
                                    <img src="${getImageUrl(match.portData)}"
                                         alt="${match.portmasterGame} screenshot"
                                         class="w-32 h-20 md:w-40 md:h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                         onerror="this.src='https://raw.githubusercontent.com/PortsMaster/PortMaster-Website/main/no.image.png';">
                                </div>
                                <div class="flex-1 text-center md:text-left">
                                    <h4 class="text-lg md:text-xl font-semibold mb-2">${match.epicGame}</h4>
                                    ${match.description ? `<p class="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed mb-4">${match.description}</p>` : ''}
                                    <div class="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
                                        <a href="https://store.epicgames.com/en-US/search?q=${encodeURIComponent(match.epicGame)}"
                                           target="_blank"
                                           class="inline-flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                                            Search on Epic
                                        </a>
                                        <a href="https://portmaster.games/detail.html?name=${encodeURIComponent(match.originalName)}"
                                           target="_blank"
                                           class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                                            View Port Details
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : `
            <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 md:p-8">
                <h2 class="text-xl md:text-2xl font-bold mb-4">No Direct Matches Found</h2>
                <p class="text-gray-700 dark:text-gray-300 mb-4">
                    We didn't find any exact matches between your Epic Games library and Portmaster supported games. This could be because:
                </p>
                <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
                    <li>Game names don't match exactly between platforms</li>
                    <li>You may have games that require additional files to work with Portmaster</li>
                    <li>New ports may have been added since our last update</li>
                </ul>
                <p class="text-gray-700 dark:text-gray-300">
                    Check the <a href="https://portmaster.games/games.html" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">full Portmaster games list</a> manually for potential matches.
                </p>
            </div>
            `}

            <div class="mt-8 text-center">
                <a href="/" class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
                    Try Another Game List
                </a>
            </div>
        </div>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/insights/script.js"></script>
        <script>
          window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/speed-insights/script.js"></script>
    </head>
    <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div class="max-w-6xl mx-auto px-4 py-6 md:py-8">
            <div class="bg-green-600 text-white rounded-xl p-6 md:p-8 text-center mb-6">
                <h1 class="text-2xl md:text-3xl font-bold mb-2">Your Portmaster Compatible GOG Games</h1>
                <p class="text-green-100">Games from your GOG library that work with Portmaster</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                    <div class="text-3xl md:text-4xl font-bold text-green-600 mb-2">${gogGames.length}</div>
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">GOG Games</h3>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                    <div class="text-3xl md:text-4xl font-bold text-green-600 mb-2">${portmasterGames.length}</div>
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">Portmaster Games</h3>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                    <div class="text-3xl md:text-4xl font-bold text-green-600 mb-2">${comparison.matches.length}</div>
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">Matches Found</h3>
                </div>
            </div>

            ${comparison.matches.length > 0 ? `
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-lg p-6 mb-8">
                <h4 class="font-semibold text-lg mb-3">Important: Read Before Installing</h4>
                <p class="text-gray-700 dark:text-gray-300">
                    These matches are based on game names only. <strong>Many Portmaster ports require original game files, assets, or may be completely different implementations</strong>. Always check each port's documentation and requirements before installation.
                </p>
            </div>

            <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 md:p-8">
                <h2 class="text-xl md:text-2xl font-bold mb-6">Potential Portmaster Ports for Your GOG Games:</h2>
                <div class="space-y-4">
                    ${comparison.matches.map(match => `
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 p-4 md:p-6">
                            <div class="flex flex-col md:flex-row md:items-center gap-4">
                                <div class="flex-shrink-0 mx-auto md:mx-0">
                                    <img src="${getImageUrl(match.portData)}"
                                         alt="${match.portmasterGame} screenshot"
                                         class="w-32 h-20 md:w-40 md:h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                         onerror="this.src='https://raw.githubusercontent.com/PortsMaster/PortMaster-Website/main/no.image.png';">
                                </div>
                                <div class="flex-1 text-center md:text-left">
                                    <h4 class="text-lg md:text-xl font-semibold mb-2">${match.gogGame}</h4>
                                    ${match.description ? `<p class="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed mb-4">${match.description}</p>` : ''}
                                    <div class="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
                                        <a href="https://www.gog.com/en/games?search=${encodeURIComponent(match.gogGame)}"
                                           target="_blank"
                                           class="inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                                            Search on GOG
                                        </a>
                                        <a href="https://portmaster.games/detail.html?name=${encodeURIComponent(match.originalName)}"
                                           target="_blank"
                                           class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                                            View Port Details
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : `
            <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 md:p-8">
                <h2 class="text-xl md:text-2xl font-bold mb-4">No Direct Matches Found</h2>
                <p class="text-gray-700 dark:text-gray-300 mb-4">
                    We didn't find any exact matches between your GOG library and Portmaster supported games. This could be because:
                </p>
                <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
                    <li>Game names don't match exactly between platforms</li>
                    <li>You may have games that require additional files to work with Portmaster</li>
                    <li>New ports may have been added since our last update</li>
                </ul>
                <p class="text-gray-700 dark:text-gray-300">
                    Check the <a href="https://portmaster.games/games.html" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">full Portmaster games list</a> manually for potential matches.
                </p>
            </div>
            `}

            <div class="mt-8 text-center">
                <a href="/" class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
                    Try Another Game List
                </a>
            </div>
        </div>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/insights/script.js"></script>
        <script>
          window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/speed-insights/script.js"></script>
    </head>
    <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div class="max-w-6xl mx-auto px-4 py-6 md:py-8">
            <div class="bg-green-600 text-white rounded-xl p-6 md:p-8 text-center mb-6">
                <h1 class="text-2xl md:text-3xl font-bold mb-2">Your Portmaster Compatible Games</h1>
                <p class="text-green-100">Games from your Steam library that work with Portmaster</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                    <div class="text-3xl md:text-4xl font-bold text-green-600 mb-2">${steamGames.length}</div>
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">Steam Games</h3>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                    <div class="text-3xl md:text-4xl font-bold text-green-600 mb-2">${portmasterGames.length}</div>
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">Portmaster Games</h3>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                    <div class="text-3xl md:text-4xl font-bold text-green-600 mb-2">${comparison.matches.length}</div>
                    <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">Matches Found</h3>
                </div>
            </div>

            ${comparison.matches.length > 0 ? `
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-lg p-6 mb-8">
                <h4 class="font-semibold text-lg mb-3">Important: Read Before Installing</h4>
                <p class="text-gray-700 dark:text-gray-300">
                    These matches are based on game names only. <strong>Many Portmaster ports require original game files, specific versions, or may be completely different implementations</strong>. Always check each port's documentation and requirements before installation.
                </p>
            </div>

            <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 md:p-8">
                <h2 class="text-xl md:text-2xl font-bold mb-6">Potential Portmaster Ports for Your Games:</h2>
                <div class="space-y-4">
                    ${comparison.matches.map(match => `
                        <div class="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 p-4 md:p-6">
                            <div class="flex flex-col md:flex-row md:items-center gap-4">
                                <div class="flex-shrink-0 mx-auto md:mx-0">
                                    <img src="${getImageUrl(match.portData)}"
                                         alt="${match.portmasterGame} screenshot"
                                         class="w-32 h-20 md:w-40 md:h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                         onerror="this.src='https://raw.githubusercontent.com/PortsMaster/PortMaster-Website/main/no.image.png';">
                                </div>
                                <div class="flex-1 text-center md:text-left">
                                    <h4 class="text-lg md:text-xl font-semibold mb-2">${match.steamGame}</h4>
                                    ${match.description ? `<p class="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed mb-4">${match.description}</p>` : ''}
                                    <div class="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
                                        <a href="https://store.steampowered.com/app/${match.steamAppId}/"
                                           target="_blank"
                                           class="inline-flex items-center justify-center px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                                            View on Steam
                                        </a>
                                        <a href="https://portmaster.games/detail.html?name=${encodeURIComponent(match.originalName)}"
                                           target="_blank"
                                           class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                                            View Port Details
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : `
            <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 md:p-8">
                <h2 class="text-xl md:text-2xl font-bold mb-4">No Direct Matches Found</h2>
                <p class="text-gray-700 dark:text-gray-300 mb-4">
                    We didn't find any exact matches between your Steam library and Portmaster supported games. This could be because:
                </p>
                <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
                    <li>Game names don't match exactly between platforms</li>
                    <li>You may have games that require additional files to work with Portmaster</li>
                    <li>New ports may have been added since our last update</li>
                </ul>
                <p class="text-gray-700 dark:text-gray-300">
                    Check the <a href="https://portmaster.games/games.html" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">full Portmaster games list</a> manually for potential matches.
                </p>
            </div>
            `}

            <div class="mt-8 text-center">
                <a href="/" class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
                    Try Another Steam ID
                </a>
            </div>
        </div>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/insights/script.js"></script>
        <script>
          window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
        </script>
        <script defer src="/_vercel/speed-insights/script.js"></script>
    </head>
    <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div class="max-w-2xl mx-auto px-4 py-12 md:py-20">
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
                <div class="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                </div>
                <h2 class="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">Error</h2>
                <p class="text-red-700 dark:text-red-300 mb-8 leading-relaxed">${message}</p>
                <a href="/" class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
                    Try Again
                </a>
            </div>
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