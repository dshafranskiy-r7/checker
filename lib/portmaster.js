import axios from 'axios';
import { getCache, setCache } from './cache.js';

export async function getPortmasterGames() {
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
export function getImageUrl(port) {
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