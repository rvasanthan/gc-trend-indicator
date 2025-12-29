# GitHub Actions Workflow

## Automated Visa Bulletin Scraper

The `scraper.yml` workflow automatically runs the visa bulletin scraper on a monthly schedule.

### Schedule
- **Automatic**: Runs on the 15th of each month at 2 AM UTC
- **Manual**: Can be triggered anytime from the [Actions tab](../../actions)

### What it does
1. Sets up Python 3.12 environment
2. Installs dependencies from `requirements.txt`
3. Runs `main.py` to scrape visa bulletin data
4. Commits and pushes updated `data.csv` and `data.json` files to the repository

### Manual Trigger
To run the scraper manually:
1. Go to the [Actions tab](../../actions)
2. Click on "Run Visa Bulletin Scraper" workflow
3. Click "Run workflow" button
4. Select the branch (main) and click "Run workflow"

### Viewing Results
- Check the [Actions tab](../../actions) for workflow run history
- View updated data files in the `output/` directory after each run
- Each commit message includes the date: "📊 Update visa bulletin data - YYYY-MM-DD"

### Cost
GitHub Actions provides 2,000 free minutes per month for public repositories. This workflow uses approximately 5-10 minutes per run, so you can run it ~200-400 times per month for free.
