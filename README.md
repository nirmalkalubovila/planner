# Personal Plan Maker

A lightning-fast, minimalist weekly planner built with vanilla HTML, CSS, and JavaScript. No frameworks, no dependencies - just pure web technologies.

## Features

- **Habit Tracker**: Define daily recurring habits with specific time slots
- **Goal Tracker**: Break down long-term goals into weekly sub-goals
- **Smart Shifting**: Pause and shift your goals when unexpected events occur
- **Week Planner**: Visual 24x7 grid to plan your entire week
- **Persistent Storage**: All data saved locally in your browser
- **Zero Dependencies**: Pure vanilla JavaScript - no build process needed

## Running Locally

### Method 1: Simple File Opening (Quick Start)
1. Navigate to the project folder
2. Double-click `index.html` to open in your browser
3. Use the navigation bar to switch between pages

### Method 2: Using Python HTTP Server (Recommended)
```bash
# Navigate to project directory
cd planner

# Python 3.x
python -m http.server 8000

# Or Python 2.x
python -m SimpleHTTPServer 8000
```
Then open: `http://localhost:8000`

### Method 3: Using Node.js HTTP Server
```bash
# Install http-server globally (one-time)
npm install -g http-server

# Run server
http-server -p 8000
```
Then open: `http://localhost:8000`

### Method 4: Using VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Deploying to Vercel

### Prerequisites
- [Vercel Account](https://vercel.com/signup) (free)
- [Vercel CLI](https://vercel.com/cli) (optional)

### Option 1: Deploy via Vercel Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository (GitHub/GitLab/Bitbucket)
4. Vercel auto-detects static site - no configuration needed
5. Click "Deploy"
6. Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI (one-time)
npm i -g vercel

# Navigate to project directory
cd planner

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - Project name? personal-plan-maker
# - Directory? ./
# - Override settings? No

# Your app is now live!
```

### Option 3: Deploy via Git Push
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Deploy automatically happens
5. Every push to main branch auto-deploys

## Project Structure

```
planner/
├── index.html          # Habit Tracker (Homepage)
├── goals.html          # Goal Tracker
├── planner.html        # Week Planner
├── css/
│   ├── style.css       # Global styles
│   ├── habits.css      # Habit page styles
│   ├── goals.css       # Goal page styles
│   └── planner.css     # Planner grid styles
├── js/
│   ├── storage.js      # LocalStorage manager
│   ├── habits.js       # Habit logic
│   ├── goals.js        # Goal logic
│   └── planner.js      # Planner grid logic
├── vercel.json         # Vercel configuration
├── package.json        # Project metadata
└── README.md           # This file
```

## Usage Workflow

### 1. Create Habits
- Go to **Habit Tracker** (index.html)
- Add recurring habits with time slots (e.g., "Sleep 23:00-06:00")
- These appear as locked gray cells in the Week Planner

### 2. Define Goals
- Go to **Goal Tracker** (goals.html)
- Create a goal with total weeks (e.g., "Learn Piano - 12 weeks")
- For each week, set target hours and sub-goal description
- Use the Shift feature if unexpected events occur

### 3. Plan Your Week
- Go to **Week Planner** (planner.html)
- Select an active goal from dropdown
- Use paint tools:
  - **Erase**: Clear cells
  - **Goal Work**: Allocate hours for your goal (green)
  - **Custom Event**: Add one-time events (yellow)
- Click "Save Plan" to persist your schedule

## Data Storage

All data is stored in your browser's LocalStorage:
- `ppm_habits`: Your habit definitions
- `ppm_goals`: Your goals and weekly breakdowns
- `ppm_saved_plan`: Your current week plan

**Note**: Data is browser-specific and will be lost if you clear browser data. Consider exporting important data regularly.

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (Recommended)
- Firefox
- Safari
- Opera

## License

MIT License - Free to use and modify

## Support

For issues or feature requests, please open an issue on the repository.

---

Built with ❤️ using vanilla web technologies
