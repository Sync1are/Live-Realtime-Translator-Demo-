# Quick Reference: History & Export Commands

## Session Recording

```bash
# Normal operation (recording enabled)
python speech_translation_pipeline.py --src-lang en --tgt-lang de

# Disable recording
python speech_translation_pipeline.py --src-lang en --tgt-lang de --no-record
```

## Viewing History

```bash
# List all sessions
python history_viewer.py list

# Last 7 days
python history_viewer.py list --last-days 7

# Specific language pair
python history_viewer.py list --source-lang en --target-lang de

# View details
python history_viewer.py show <session_id>
```

## Archiving

```bash
# Archive sessions older than 30 days (default)
python history_viewer.py archive

# Custom threshold
python history_viewer.py archive --threshold-days 90

# Unarchive a session
python history_viewer.py unarchive <session_id>
```

## Exporting

```bash
# Export to JSON
python history_viewer.py export sessions.json --format json

# Export to CSV
python history_viewer.py export sessions.csv --format csv

# Export with filters
python history_viewer.py export filtered.json --format json \
  --last-days 30 --source-lang en --target-lang de

# Export date range
python history_viewer.py export q1.csv --format csv \
  --start-date 2024-01-01 --end-date 2024-03-31
```

## Common Workflows

### Daily Use
```bash
# Just run normally - recording is automatic
python speech_translation_pipeline.py --src-lang en --tgt-lang de
```

### Weekly Review
```bash
# View this week's sessions
python history_viewer.py list --last-days 7
```

### Monthly Backup
```bash
# Export last month
python history_viewer.py export backup_$(date +%Y%m).json --format json
# Archive old sessions
python history_viewer.py archive
```

### Performance Analysis
```bash
# Export to CSV for spreadsheet analysis
python history_viewer.py export performance.csv --format csv --last-days 30
```

## Data Locations

- **Sessions**: `~/.speech_translation/sessions/`
- **Archive**: `~/.speech_translation/archive/`
- **Config**: `~/.speech_translation/config.json`
