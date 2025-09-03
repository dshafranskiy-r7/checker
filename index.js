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

  // Read the HTML template
  const templatePath = path.join(__dirname, '/src/html/report-template.html');
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
    matchesSection = `
      <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-lg p-6 mb-8">
          <h4 class="font-semibold text-lg mb-3">Important: Read Before Installing</h4>
          <p class="text-gray-700 dark:text-gray-300">
              These matches are based on game names only. <strong>${config.disclaimerText}</strong>. Always check each port's documentation and requirements before installation.
          </p>
      </div>

      <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 md:p-8">
          <h2 class="text-xl md:text-2xl font-bold mb-6">Potential Portmaster Ports for Your ${config.platformName} Games:</h2>
          <div class="space-y-4">
              ${comparison.matches.map(match => {
                const gameName = match[config.gameProperty];
                const searchUrl = config.appIdProperty && match[config.appIdProperty]
                  ? config.searchUrl().replace('{{APP_ID}}', match[config.appIdProperty])
                  : config.searchUrl(gameName);

                return `
                  <div class="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 p-4 md:p-6">
                      <div class="flex flex-col md:flex-row md:items-center gap-4">
                          <div class="flex-shrink-0 mx-auto md:mx-0">
                              <img src="${getImageUrl(match.portData)}"
                                   alt="${match.portmasterGame} screenshot"
                                   class="w-32 h-20 md:w-40 md:h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                   onerror="this.src='https://raw.githubusercontent.com/PortsMaster/PortMaster-Website/main/no.image.png';">
                          </div>
                          <div class="flex-1 text-center md:text-left">
                              <h4 class="text-lg md:text-xl font-semibold mb-2">${gameName}</h4>
                              ${match.description ? `<p class="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed mb-4">${match.description}</p>` : ''}
                              <div class="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
                                  <a href="${searchUrl}"
                                     target="_blank"
                                     class="inline-flex items-center justify-center px-4 py-2 ${config.searchButtonClass} text-white text-sm font-medium rounded-lg transition-colors duration-200">
                                      ${config.searchButtonText}
                                  </a>
                                  <a href="https://portmaster.games/detail.html?name=${encodeURIComponent(match.originalName)}"
                                     target="_blank"
                                     class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
                                      View Port Details
                                  </a>
                              </div>
                          </div>
                      </div>
                  </div>`;
              }).join('')}
          </div>
      </div>`;
  } else {
    matchesSection = `
      <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 md:p-8">
          <h2 class="text-xl md:text-2xl font-bold mb-4">No Direct Matches Found</h2>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
              We didn't find any exact matches between your ${config.platformName} library and Portmaster supported games. This could be because:
          </p>
          <ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
              <li>Game names don't match exactly between platforms</li>
              <li>You may have games that require additional files to work with Portmaster</li>
              <li>New ports may have been added since our last update</li>
          </ul>
          <p class="text-gray-700 dark:text-gray-300">
              Check the <a href="https://portmaster.games/games.html" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">full Portmaster games list</a> manually for potential matches.
          </p>
      </div>`;
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