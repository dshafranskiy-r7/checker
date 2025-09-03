import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import open from 'open';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  parseEpicGames,
  parseGogGames,
  compareEpicGames,
  compareGogGames,
  compareSteamGames,
  resolveSteamId,
  getSteamGames,
  getPortmasterGames,
  getImageUrl
} from './src/js/server-functions.js';

dotenv.config();

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Serve static files
app.use(express.static(__dirname));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/index.html'));
});

// Engine configuration for different platforms
const engineConfig = {
  steam: {
    platform: 'steam',
    inputKey: 'steamid',
    inputValidator: (input) => !!input,
    inputErrorMessage: 'Invalid Steam ID format or unable to resolve Steam profile. Please check your Steam ID or profile URL.',
    parseInput: async (input) => {
      const steamId = await resolveSteamId(input);
      if (!steamId) return null;
      return steamId;
    },
    fetchGames: async (parsedInput, getCache, setCache) => {
      console.log('Fetching Steam games for ID:', parsedInput);
      const games = await getSteamGames(parsedInput, getCache, setCache);
      if (games.error) throw new Error(games.error);
      return games;
    },
    compareGames: compareSteamGames,
    logPrefix: 'Steam',
    emptyListMessage: null, // Steam API handles this differently
    noGamesMessage: null    // Steam API handles this differently
  },
  epic: {
    platform: 'epic',
    inputKey: 'epicgames',
    inputValidator: (input) => input && input.trim(),
    inputErrorMessage: 'Please provide your Epic Games list.',
    parseInput: async (input) => {
      console.log('Parsing Epic games list...');
      const games = parseEpicGames(input);
      if (games.length === 0) throw new Error('No games found in the provided list. Please check the format and try again.');
      console.log(`Found ${games.length} Epic games`);
      return games;
    },
    fetchGames: async (parsedInput) => parsedInput, // Already parsed
    compareGames: compareEpicGames,
    logPrefix: 'Epic',
    emptyListMessage: 'Please provide your Epic Games list.',
    noGamesMessage: 'No games found in the provided list. Please check the format and try again.'
  },
  gog: {
    platform: 'gog',
    inputKey: 'goggames',
    inputValidator: (input) => input && input.trim(),
    inputErrorMessage: 'Please provide your GOG games list.',
    parseInput: async (input) => {
      console.log('Parsing GOG games list...');
      const games = parseGogGames(input);
      if (games.length === 0) throw new Error('No games found in the provided list. Please check the format and try again.');
      console.log(`Found ${games.length} GOG games`);
      return games;
    },
    fetchGames: async (parsedInput) => parsedInput, // Already parsed
    compareGames: compareGogGames,
    logPrefix: 'GOG',
    emptyListMessage: 'Please provide your GOG games list.',
    noGamesMessage: 'No games found in the provided list. Please check the format and try again.'
  }
};

// Unified comparison handler
async function handleComparison(req, res, engine) {
  try {
    const config = engineConfig[engine];
    if (!config) {
      return res.send(errorPage(`Unsupported engine: ${engine}`));
    }

    const input = req.body[config.inputKey];

    // Validate input
    if (!config.inputValidator(input)) {
      return res.send(errorPage(config.inputErrorMessage));
    }

    // Parse input (this may be async for Steam ID resolution)
    let parsedInput;
    try {
      parsedInput = await config.parseInput(input);
      if (parsedInput === null && config.platform === 'steam') {
        return res.send(errorPage(config.inputErrorMessage));
      }
    } catch (error) {
      return res.send(errorPage(error.message));
    }

    // Fetch games from the platform
    const platformGames = await config.fetchGames(parsedInput, getCache, setCache);

    // Fetch Portmaster games
    console.log('Fetching Portmaster games...');
    let portmasterGames;
    try {
      portmasterGames = await getPortmasterGames(getCache, setCache);
    } catch (error) {
      return res.send(errorPage(error.message));
    }

    // Compare games
    console.log('Comparing games...');
    const comparison = config.compareGames(platformGames, portmasterGames);

    // Generate and send report
    res.send(generateReport(config.platform, platformGames, portmasterGames, comparison));
  } catch (error) {
    console.error(`${engineConfig[engine]?.logPrefix || engine} comparison error:`, error);
    res.send(errorPage(`An error occurred while comparing ${engineConfig[engine]?.logPrefix || engine} games. Please try again.`));
  }
}

// Route handlers using the unified function
app.post('/compare', async (req, res) => {
  await handleComparison(req, res, 'steam');
});

app.post('/compare-epic', async (req, res) => {
  await handleComparison(req, res, 'epic');
});

app.post('/compare-gog', async (req, res) => {
  await handleComparison(req, res, 'gog');
});



function generateReport(platform, platformGames, portmasterGames, comparison) {
  // Platform configuration
  const platformConfig = {
    steam: {
      pageTitle: 'Your Portmaster Compatible Games',
      headerTitle: 'Your Portmaster Compatible Games',
      headerSubtitle: 'Games from your Steam library that work with Portmaster',
      platformName: 'Steam',
      backButtonText: 'Try Another Steam ID',
      gameProperty: 'steamGame',
      appIdProperty: 'steamAppId',
      searchUrl: (gameName) => `https://store.steampowered.com/app/{{APP_ID}}/`,
      searchButtonText: 'View on Steam',
      searchButtonClass: 'bg-blue-900 hover:bg-blue-800',
      disclaimerText: 'Many Portmaster ports require original game files, specific versions, or may be completely different implementations'
    },
    epic: {
      pageTitle: 'Your Portmaster Compatible Epic Games',
      headerTitle: 'Your Portmaster Compatible Epic Games',
      headerSubtitle: 'Games from your Epic Games library that work with Portmaster',
      platformName: 'Epic',
      backButtonText: 'Try Another Game List',
      gameProperty: 'epicGame',
      appIdProperty: null,
      searchUrl: (gameName) => `https://store.epicgames.com/en-US/search?q=${encodeURIComponent(gameName)}`,
      searchButtonText: 'Search on Epic',
      searchButtonClass: 'bg-gray-800 hover:bg-gray-700',
      disclaimerText: 'Many Portmaster ports require original game files, assets, or may be completely different implementations'
    },
    gog: {
      pageTitle: 'Your Portmaster Compatible GOG Games',
      headerTitle: 'Your Portmaster Compatible GOG Games',
      headerSubtitle: 'Games from your GOG library that work with Portmaster',
      platformName: 'GOG',
      backButtonText: 'Try Another Game List',
      gameProperty: 'gogGame',
      appIdProperty: null,
      searchUrl: (gameName) => `https://www.gog.com/en/games?search=${encodeURIComponent(gameName)}`,
      searchButtonText: 'Search on GOG',
      searchButtonClass: 'bg-purple-600 hover:bg-purple-700',
      disclaimerText: 'Many Portmaster ports require original game files, assets, or may be completely different implementations'
    }
  };

  const config = platformConfig[platform];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Read the main HTML template
  const templatePath = path.join(__dirname, 'src/html/portmaster-page.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholders with actual data
  template = template.replace('{{PAGE_TITLE}}', config.pageTitle);
  template = template.replace('{{HEADER_TITLE}}', config.headerTitle);
  template = template.replace('{{HEADER_SUBTITLE}}', config.headerSubtitle);
  template = template.replace('{{PLATFORM_NAME}}', config.platformName);
  template = template.replace('{{PLATFORM_GAMES_COUNT}}', platformGames.length);
  template = template.replace('{{PORTMASTER_GAMES_COUNT}}', portmasterGames.length);
  template = template.replace('{{MATCHES_COUNT}}', comparison.matches.length);
  template = template.replace('{{BACK_BUTTON_TEXT}}', config.backButtonText);

  // Generate the matches section
  let matchesSection;
  if (comparison.matches.length > 0) {
    // Read matches found template
    const matchesFoundPath = path.join(__dirname, 'src/html/matches-found.html');
    const gameMatchPath = path.join(__dirname, 'src/html/game-match.html');

    let matchesFoundTemplate = fs.readFileSync(matchesFoundPath, 'utf8');
    const gameMatchTemplate = fs.readFileSync(gameMatchPath, 'utf8');

    // Generate individual game matches
    const gameMatches = comparison.matches.map(match => {
      const gameName = match[config.gameProperty];
      const searchUrl = config.appIdProperty && match[config.appIdProperty]
        ? config.searchUrl().replace('{{APP_ID}}', match[config.appIdProperty])
        : config.searchUrl(gameName);

      let gameMatch = gameMatchTemplate;
      gameMatch = gameMatch.replace('{{GAME_IMAGE_URL}}', getImageUrl(match.portData));
      gameMatch = gameMatch.replace('{{PORTMASTER_GAME}}', match.portmasterGame);
      gameMatch = gameMatch.replace('{{GAME_NAME}}', gameName);
      gameMatch = gameMatch.replace('{{GAME_DESCRIPTION}}',
        match.description ? `<p class="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed mb-4">${match.description}</p>` : ''
      );
      gameMatch = gameMatch.replace('{{SEARCH_URL}}', searchUrl);
      gameMatch = gameMatch.replace('{{SEARCH_BUTTON_CLASS}}', config.searchButtonClass);
      gameMatch = gameMatch.replace('{{SEARCH_BUTTON_TEXT}}', config.searchButtonText);
      gameMatch = gameMatch.replace('{{ENCODED_ORIGINAL_NAME}}', encodeURIComponent(match.originalName));

      return gameMatch;
    }).join('');

    // Replace placeholders in matches found template
    matchesFoundTemplate = matchesFoundTemplate.replace('{{DISCLAIMER_TEXT}}', config.disclaimerText);
    matchesFoundTemplate = matchesFoundTemplate.replace('{{PLATFORM_NAME}}', config.platformName);
    matchesFoundTemplate = matchesFoundTemplate.replace('{{GAME_MATCHES}}', gameMatches);

    matchesSection = matchesFoundTemplate;
  } else {
    // Read no matches template
    const noMatchesPath = path.join(__dirname, 'src/html/no-matches.html');
    let noMatchesTemplate = fs.readFileSync(noMatchesPath, 'utf8');

    noMatchesTemplate = noMatchesTemplate.replace('{{PLATFORM_NAME}}', config.platformName);
    matchesSection = noMatchesTemplate;
  }

  template = template.replace('{{MATCHES_SECTION}}', matchesSection);

  return template;
}

// Wrapper functions for backward compatibility
function generateEpicReport(epicGames, portmasterGames, comparison) {
  return generateReport('epic', epicGames, portmasterGames, comparison);
}

function generateGogReport(gogGames, portmasterGames, comparison) {
  return generateReport('gog', gogGames, portmasterGames, comparison);
}

function generateSteamReport(steamGames, portmasterGames, comparison) {
  return generateReport('steam', steamGames, portmasterGames, comparison);
}

function errorPage(message) {
  // Read the HTML template
  const templatePath = path.join(__dirname, 'src/html/error-page.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholder with actual error message
  template = template.replace('{{ERROR_MESSAGE}}', message);

  return template;
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Make sure to set your STEAM_API_KEY in a .env file');
  console.log('Get your API key from: https://steamcommunity.com/dev/apikey');
  open(`http://localhost:${port}`);
});