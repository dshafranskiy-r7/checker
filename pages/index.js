import Head from 'next/head'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function Home() {
  return (
    <>
      <Head>
        <title>Portmaster Game Checker</title>
        <meta name="description" content="Compare your Steam library with Portmaster supported games" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <style jsx>{`
        :root {
            --bg-color: #ffffff;
            --text-color: #333333;
            --input-bg: #ffffff;
            --input-border: #ddd;
            --button-bg: #4CAF50;
            --button-hover: #45a049;
            --help-bg: #f9f9f9;
            --error-bg: #ffebee;
            --error-text: #c62828;
            --warning-bg: #f8f4e6;
            --warning-border: #ffc107;
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #1a1a1a;
                --text-color: #e0e0e0;
                --input-bg: #2d2d2d;
                --input-border: #555;
                --button-bg: #4CAF50;
                --button-hover: #45a049;
                --help-bg: #2d2d2d;
                --error-bg: #2d1a1a;
                --error-text: #ff6b6b;
                --warning-bg: #2a2416;
                --warning-border: #ffb347;
            }
        }
        
        body { 
            font-family: Arial, sans-serif; 
            background-color: var(--bg-color);
            color: var(--text-color);
            transition: background-color 0.3s, color 0.3s;
            margin: 0;
            padding: 0;
        }
        
        .container {
            max-width: 600px; 
            margin: 50px auto; 
            padding: 30px;
            background: var(--bg-color);
            border-radius: 10px;
        }
        
        h1 { 
            color: var(--text-color); 
            text-align: center; 
            margin-bottom: 30px; 
        }
        
        form { 
            margin: 20px 0; 
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
      `}</style>
      
      <div className="container">
        <h1>Portmaster Game Checker</h1>
        
        <form action="/api/compare" method="post">
          <h3>Steam Library Comparison</h3>
          <label htmlFor="steamid">Enter your Steam ID, username, or profile URL:</label><br />
          <input type="text" id="steamid" name="steamid" placeholder="e.g., yourusername or 76561198123456789" required /><br />
          <button type="submit">Compare Steam Library</button>
        </form>
        
        <hr style={{margin: '30px 0'}} />
        
        <form action="/api/compare-epic" method="post">
          <h3>Epic Games Library Comparison</h3>
          <label htmlFor="epicgames">Paste your Epic Games library list:</label><br />
          <textarea id="epicgames" name="epicgames" rows="10" placeholder="Paste your Epic Games list here..." required></textarea><br />
          <button type="submit">Compare Epic Games Library</button>
        </form>
        
        <hr style={{margin: '30px 0'}} />
        
        <form action="/api/compare-gog" method="post">
          <h3>GOG Library Comparison</h3>
          <label htmlFor="goggames">Paste your GOG games list:</label><br />
          <textarea id="goggames" name="goggames" rows="10" placeholder="Paste your GOG games list here (JSON format preferred)..." required></textarea><br />
          <button type="submit">Compare GOG Library</button>
        </form>
        
        <div className="help">
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
            <li><strong>Preferred:</strong> Export your games as JSON from GOG Galaxy or GOG.com account in the format: <code>{"{"}"products": [{"{"}"title": "Game Name"{"}"}, ...]{"}"}</code></li>
            <li><strong>Alternative:</strong> Simply paste game names, one per line</li>
            <li>Game names should match exactly as they appear in your GOG library</li>
            <li>JSON format allows for more accurate parsing and future features</li>
          </ul>
          
          <div style={{
            background: 'var(--warning-bg)', 
            padding: '15px', 
            borderRadius: '5px', 
            marginTop: '15px', 
            borderLeft: '4px solid var(--warning-border)'
          }}>
            <h4 style={{margin: '0 0 10px 0'}}>Important Disclaimer</h4>
            <p style={{margin: '0', fontSize: '0.9em'}}>
              Finding a match means there's a Portmaster port with a similar name to your game. However, 
              <strong> the port may require the original game files, assets, or may be a completely different version</strong>. 
              Always check the port's requirements before assuming compatibility with your Steam, Epic, or GOG version.
            </p>
          </div>
        </div>
      </div>
      
      <Analytics />
      <SpeedInsights />
    </>
  )
}