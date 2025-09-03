import { getPortmasterGames, getImageUrl } from '../../lib/portmaster.js';
import { parseEpicGames, compareEpicGames } from '../../lib/gameComparison.js';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
}