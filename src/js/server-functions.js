// Server-side JavaScript functions for Portmaster Game Checker
import axios from 'axios';

// Game parsing functions
export function parseEpicGames(epicGamesText) {
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

export function parseGogGames(gogGamesText) {
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

// Game comparison functions
export function compareEpicGames(epicGames, portmasterGames) {
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

export function compareGogGames(gogGames, portmasterGames) {
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

export function compareSteamGames(steamGames, portmasterGames) {
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

// Steam API functions
export async function resolveSteamId(input) {
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

export async function getSteamGames(steamId, getCache, setCache) {
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

export async function getPortmasterGames(getCache, setCache) {
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

// Replicate the official portmaster.games functions exactly
export async function getImageUrl(port) {
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