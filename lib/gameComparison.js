export function parseEpicGames(epicGamesText) {
  const lines = epicGamesText.split('\n');
  const games = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Handle Epic's native format: * Game Name (App name: id | Version: x)
    let gameName = null;
    
    const epicFormatMatch = trimmed.match(/^\*\s+(.+?)\s*\(/);
    if (epicFormatMatch) {
      gameName = epicFormatMatch[1].trim();
    } else {
      // Fallback to just the line itself for simple formats
      gameName = trimmed.replace(/^\*\s*/, '').trim();
    }
    
    if (gameName && gameName.length > 0) {
      games.push({
        name: gameName,
        platform: 'Epic'
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
  
  // First, try to parse as JSON
  try {
    const data = JSON.parse(gogGamesText);
    if (data.products && Array.isArray(data.products)) {
      data.products.forEach(product => {
        if (product.title) {
          games.push({
            name: product.title.trim(),
            platform: 'GOG'
          });
        }
      });
      
      // If we successfully parsed JSON and found games, return them
      if (games.length > 0) {
        const uniqueGames = games.filter((game, index, self) => 
          index === self.findIndex(g => g.name.toLowerCase() === game.name.toLowerCase())
        );
        return uniqueGames;
      }
    }
  } catch (e) {
    // Not valid JSON, continue to line-by-line parsing
  }
  
  // Fallback to line-by-line parsing
  const lines = gogGamesText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
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

export function compareGames(steamGames, portmasterGames) {
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