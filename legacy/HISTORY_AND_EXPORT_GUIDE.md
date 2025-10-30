# History & Export Feature Guide

This guide explains how to use the new history, archive, and export features of the Speech Translation Pipeline.

## Overview

The pipeline now automatically records all translation sessions, allowing you to:
- Browse past translation sessions
- Filter sessions by date, language, and status
- Archive old sessions to keep your active list clean
- Export session data to CSV or JSON for analysis, backup, or integration

## Session Recording

### Automatic Recording

By default, every translation session is automatically recorded with:
- **Translation Events**: Both source and translated text for each phrase
- **Performance Metrics**: Individual latency measurements for STT, MT, and TTS
- **Session Metadata**: Language pair, model configuration, timestamps
- **Session Duration**: Start and end times for the complete session

### Recorded Data

Each translation event includes:
- Source text (original transcribed speech)
- Translated text (final translation)
- STT latency (speech-to-text processing time)
- MT latency (machine translation processing time)  
- TTS latency (text-to-speech processing time)
- Event timestamp

### Storage Location

Session data is stored in your home directory:
```
~/.speech_translation/
├── sessions/     # Active and completed sessions
├── archive/      # Archived sessions
└── config.json   # Configuration settings
```

### Disabling Recording

If you prefer not to record a session, use the `--no-record` flag:

```bash
python speech_translation_pipeline.py --src-lang en --tgt-lang de --no-record
```

## Viewing Session History

### List All Sessions

View all recorded sessions:

```bash
python history_viewer.py list
```

This displays a table with:
- Session ID
- Start time
- Status (active/completed/archived)
- Language pair
- Model size
- Number of events
- Duration

### Filter Sessions

#### By Date Range

```bash
# Specific date range
python history_viewer.py list --start-date 2024-01-01 --end-date 2024-01-31

# Last N days
python history_viewer.py list --last-days 7
```

#### By Language

```bash
# Filter by source language
python history_viewer.py list --source-lang en

# Filter by target language
python history_viewer.py list --target-lang de

# Combine filters
python history_viewer.py list --source-lang en --target-lang de --last-days 30
```

#### By Status

```bash
# Only completed sessions
python history_viewer.py list --status completed

# Only archived sessions
python history_viewer.py list --status archived
```

### View Session Details

Get detailed information about a specific session:

```bash
python history_viewer.py show <session_id>
```

This displays:
- Complete session metadata
- Event count and average latency
- Recent translation events with individual latencies
- Source and translated text for each event

## Archiving Sessions

Archiving helps manage old sessions while preserving data. Archived sessions:
- Are moved to a separate archive directory
- Don't appear in default session lists (unless filtered)
- Can still be viewed, searched, and exported
- Can be unarchived if needed

### Auto-Archive Old Sessions

By default, sessions older than 30 days are eligible for archiving:

```bash
python history_viewer.py archive
```

### Custom Archive Threshold

Archive sessions older than a specific number of days:

```bash
# Archive sessions older than 90 days
python history_viewer.py archive --threshold-days 90

# Archive sessions older than 1 year
python history_viewer.py archive --threshold-days 365
```

### Unarchive Sessions

Restore an archived session to active status:

```bash
python history_viewer.py unarchive <session_id>
```

### Configuration

The archive threshold can be configured in `~/.speech_translation/config.json`:

```json
{
  "archive_threshold_days": 30,
  "auto_archive": true
}
```

## Exporting Sessions

Export session data for:
- Backup and disaster recovery
- Analysis in spreadsheet applications
- Integration with other tools
- Long-term data retention
- Performance tracking and optimization

### Export to JSON

JSON exports include complete session data with nested structure:

```bash
# Export all sessions
python history_viewer.py export sessions.json --format json

# Export with date filter
python history_viewer.py export recent.json --format json --last-days 30

# Export specific language pair
python history_viewer.py export en_de.json --format json \
  --source-lang en --target-lang de

# Export with full date range
python history_viewer.py export q1_2024.json --format json \
  --start-date 2024-01-01 --end-date 2024-03-31
```

**JSON Structure:**
```json
{
  "export_date": "2024-01-15T10:30:00",
  "total_sessions": 25,
  "filters": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "source_lang": "en",
    "target_lang": "de"
  },
  "sessions": [
    {
      "session_id": "session_1234567890_5678",
      "start_time": 1234567890.123,
      "start_time_iso": "2024-01-15T09:45:00",
      "end_time": 1234568790.456,
      "end_time_iso": "2024-01-15T10:00:00",
      "duration_seconds": 900.333,
      "source_lang": "en",
      "target_lang": "de",
      "model_size": "base",
      "device": "cpu",
      "compute_type": "int8",
      "status": "completed",
      "event_count": 45,
      "events": [
        {
          "timestamp": 1234567895.678,
          "source_text": "Hello, how are you?",
          "translated_text": "Hallo, wie geht es dir?",
          "source_lang": "en",
          "target_lang": "de",
          "stt_latency_ms": 250.5,
          "mt_latency_ms": 180.2,
          "tts_latency_ms": 95.1
        }
      ]
    }
  ]
}
```

### Export to CSV

CSV exports flatten the data for easy analysis in spreadsheet applications:

```bash
# Export all events to CSV
python history_viewer.py export sessions.csv --format csv

# Export filtered data
python history_viewer.py export last_week.csv --format csv --last-days 7

# Export for specific analysis
python history_viewer.py export performance_metrics.csv --format csv \
  --source-lang en --target-lang de --last-days 30
```

**CSV Columns:**
- `session_id`: Unique identifier for the session
- `session_start_time`: When the session started (ISO format)
- `session_status`: Session status (active/completed/archived)
- `source_lang`: Source language code
- `target_lang`: Target language code
- `model_size`: Whisper model size used
- `device`: Compute device (cpu/cuda)
- `event_timestamp`: Unix timestamp of the event
- `event_time_iso`: Human-readable event time (ISO format)
- `source_text`: Original transcribed text
- `translated_text`: Translated text
- `stt_latency_ms`: Speech-to-text latency in milliseconds
- `mt_latency_ms`: Machine translation latency in milliseconds
- `tts_latency_ms`: Text-to-speech latency in milliseconds
- `total_latency_ms`: Total end-to-end latency

**Example CSV:**
```csv
session_id,session_start_time,session_status,source_lang,target_lang,model_size,device,event_timestamp,event_time_iso,source_text,translated_text,stt_latency_ms,mt_latency_ms,tts_latency_ms,total_latency_ms
session_1234567890_5678,2024-01-15T09:45:00,completed,en,de,base,cpu,1234567895.678,2024-01-15T09:45:05,"Hello, how are you?","Hallo, wie geht es dir?",250.5,180.2,95.1,525.8
```

## Use Cases

### Performance Analysis

Export sessions to CSV and analyze in Excel or Google Sheets:

```bash
# Export last month's data
python history_viewer.py export performance.csv --format csv --last-days 30
```

Then in your spreadsheet:
- Calculate average latencies by language pair
- Identify performance trends over time
- Compare different model sizes
- Analyze CPU vs GPU performance

### Backup and Restore

Export all sessions for backup:

```bash
# Complete backup
python history_viewer.py export backup_$(date +%Y%m%d).json --format json
```

Store the JSON file in your backup system. The JSON format preserves all data and can be imported back if needed.

### Language Learning Progress

Track your translation usage patterns:

```bash
# Export your practice sessions
python history_viewer.py export my_practice.csv --format csv \
  --source-lang en --target-lang de --last-days 90
```

Analyze:
- How many phrases you've translated
- Average session duration
- Translation frequency over time
- Common phrases and patterns

### Research and Development

Export data for research purposes:

```bash
# Export all sessions with specific configuration
python history_viewer.py export research_data.json --format json \
  --model-size base --device cuda
```

Use the data to:
- Benchmark model performance
- Test new translation approaches
- Analyze latency patterns
- Validate improvements

## Best Practices

### Regular Archiving

Set up a regular archiving schedule:

```bash
# Add to crontab for monthly archiving
0 0 1 * * cd /path/to/project && python history_viewer.py archive --threshold-days 30
```

### Periodic Exports

Create regular backups:

```bash
# Weekly backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
python history_viewer.py export backup_$DATE.json --format json
# Upload to cloud storage
aws s3 cp backup_$DATE.json s3://my-bucket/backups/
```

### Selective Retention

Export important sessions before archiving:

```bash
# Export important sessions
python history_viewer.py export important_sessions.json --format json \
  --start-date 2024-01-01 --end-date 2024-01-31

# Then archive
python history_viewer.py archive --threshold-days 30
```

### Data Privacy

Remember that session data includes:
- Transcribed speech (potentially sensitive)
- Translation content
- Usage patterns

Protect exported files appropriately:
- Encrypt backups
- Use secure storage
- Follow data retention policies
- Delete when no longer needed

## Troubleshooting

### Can't Find Sessions

Check both active and archive directories:

```bash
# List all sessions including archived
python history_viewer.py list

# List only archived
python history_viewer.py list --status archived
```

### Export File Size

Large exports may take time. Filter to reduce size:

```bash
# Instead of exporting all sessions
# python history_viewer.py export huge.csv --format csv

# Export specific date range
python history_viewer.py export q4_2024.csv --format csv \
  --start-date 2024-10-01 --end-date 2024-12-31
```

### Missing Data

Ensure recording was enabled:
- Check that `--no-record` flag wasn't used
- Verify session completed successfully
- Look in the sessions directory: `~/.speech_translation/sessions/`

### Permission Issues

If you encounter permission errors:

```bash
# Check directory permissions
ls -la ~/.speech_translation/

# Fix if needed
chmod 755 ~/.speech_translation/
chmod 644 ~/.speech_translation/sessions/*.json
```

## API Integration

The `SessionManager` class can be integrated into your own applications:

```python
from session_manager import SessionManager
from datetime import datetime, timedelta

# Create manager
manager = SessionManager()

# Start a session
session_id = manager.start_session(
    source_lang="en",
    target_lang="de",
    model_size="base",
    device="cpu",
    compute_type="int8"
)

# Record events
manager.record_event(
    source_text="Hello world",
    translated_text="Hallo Welt",
    stt_latency_ms=250.0,
    mt_latency_ms=180.0,
    tts_latency_ms=95.0
)

# End session
manager.end_session()

# Query sessions
recent_sessions = manager.get_sessions(
    start_date=datetime.now() - timedelta(days=7)
)

# Export programmatically
manager.export_to_json("output.json")
manager.export_to_csv("output.csv")

# Archive old sessions
archived_count = manager.archive_old_sessions(threshold_days=30)
```

## Summary

The history and export features provide comprehensive session tracking and data management:

✅ **Automatic recording** of all translation sessions
✅ **Flexible filtering** by date, language, and status  
✅ **Archive management** for long-term data retention
✅ **Multiple export formats** (JSON and CSV)
✅ **Performance metrics** for every translation event
✅ **Privacy controls** with optional recording disable

These features enable:
- Performance analysis and optimization
- Data backup and disaster recovery
- Language learning progress tracking
- Research and development
- Integration with external tools

Start using these features today to get more value from your translation sessions!
