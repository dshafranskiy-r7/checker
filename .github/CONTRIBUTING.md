# Contributing to Steam Portmaster Checker

## Quick Start for Development

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Get a Steam Web API key from https://steamcommunity.com/dev/apikey
4. Create `.env` file: `STEAM_API_KEY=your_key_here`
5. Start development server: `npm run dev`
6. Visit http://localhost:3000 to test

## Development Guidelines

### Code Style
- Use ES6+ features and ES modules
- Follow existing patterns in `index.js`
- Add comments for complex game matching logic
- Handle errors gracefully with user-friendly messages

### Testing Changes
- Test with public Steam profiles
- Verify both username and Steam ID inputs work
- Check error handling for private profiles
- Monitor server console for API errors

### Common Contribution Areas
- Improve game matching algorithm
- Add new Steam API integrations
- Enhance UI/UX of the comparison page
- Optimize caching strategies
- Add error recovery mechanisms

## Pull Request Process

1. Create a feature branch from main
2. Make your changes following the code style
3. Test thoroughly with real Steam profiles
4. Update documentation if needed
5. Submit PR with clear description of changes

## Need Help?

Check the [Copilot Instructions](.github/COPILOT_INSTRUCTIONS.md) for detailed development information.