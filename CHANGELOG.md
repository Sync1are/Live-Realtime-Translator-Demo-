# Changelog

## [Unreleased] - Gamification System

### Added

#### Gamification System
- **XP and Leveling**: 20-level progression system with experience points
  - Base XP per task: 10 XP
  - Focus time bonus: 1 XP per minute
  - Streak bonus: 5 XP per day of current streak
  - Beat estimate bonus: 20% bonus XP for completing tasks 20% faster than estimated
  - Level thresholds from 100 XP (Level 2) to 100,000 XP (Level 20)
- **Achievement System**: 15 unique achievements across 5 categories
  - Task completion achievements (first task, 10, 50, 100 tasks)
  - Streak achievements (3, 5, 7, 30-day streaks)
  - Efficiency achievements (beat estimate, efficiency expert)
  - Focus achievements (60 min, 240 min daily focus)
  - Level achievements (reach level 5, 10, 20)
- **Streak Tracking**: Consecutive day tracking with longest streak history
  - Daily task completion resets streak counter
  - Streak bonus XP for maintaining consistency
- **Daily & Weekly Goals**: Progress tracking for tasks and focus time
  - Daily: 5 tasks, 120 minutes focus
  - Weekly: 25 tasks, 600 minutes focus
  - Visual progress bars with percentage completion
- **Celebratory Feedback**: Multi-modal celebration on task completion
  - Confetti burst (canvas-confetti library)
  - Animated checkmark (SVG stroke animation)
  - Success sound (Web Audio API two-tone chime)
  - XP popup with earned points
  - Achievement unlock notifications
  - Level-up celebrations
- **Persistent Storage**: IndexedDB for all gamification data
  - Main state (XP, level, streak, totals)
  - Unlocked achievements with timestamps
  - Daily stats by date
  - Weekly stats by week number
- **Settings & Controls**: Toggle celebration effects
  - Enable/disable confetti
  - Enable/disable animations
  - Enable/disable sounds
  - All settings persisted

#### New Services
- **GamificationService** (`electron/services/GamificationService.js`)
  - XP calculation logic
  - Level determination
  - Achievement checking
  - Streak management
  - Goal progress tracking
- **StorageService** (`electron/services/StorageService.js`)
  - IndexedDB initialization and management
  - Gamification state persistence
  - Achievement storage
  - Daily and weekly stats tracking

#### UI Enhancements
- **Gamification Widget** in main interface
  - Real-time XP and level display
  - Level progress bar
  - Daily and weekly goal cards with progress
  - Achievement grid with locked/unlocked states
  - Settings toggles for effects
  - Test button for demonstration
- **Celebration Overlays**
  - Full-screen confetti canvas
  - Centered checkmark animation
  - Sliding XP popup notifications
  - Achievement unlock popups

#### API Extensions
- 14 new IPC handlers for gamification features
- preload.js exposure of gamification APIs
- Integration with existing task completion flow

### Documentation
- **GAMIFICATION_GUIDE.md**: Complete gamification documentation
  - Feature overview
  - XP calculation rules
  - Achievement catalog
  - Goal definitions
  - API reference
  - Usage examples
  - Troubleshooting
- Updated **electron/README.md** with gamification section

### Dependencies
- `canvas-confetti@^1.9.2`: Confetti celebration effects
- `lottie-web@^5.12.2`: Animation support (for future enhancements)

### Testing
- **GamificationService.test.js**: Comprehensive test suite
  - XP calculation
  - Level progression
  - Achievement unlocking
  - Streak updates
  - Goal progress
  - All tests passing

## [Unreleased] - History & Export Features

### Added

#### Session Recording System
- **Automatic Session Recording**: All translation sessions are now automatically recorded with comprehensive metadata
  - Source and translated text for each translation event
  - Performance metrics: STT, MT, and TTS latency measurements
  - Session metadata: language pair, model configuration, device info
  - Timestamps for sessions and individual events
- **SessionManager Class** (`session_manager.py`): Core recording and management functionality
  - Start/end session tracking
  - Event recording with latency metrics
  - Query and filter capabilities
  - Export functionality

#### History Viewing
- **History Viewer CLI** (`history_viewer.py`): Browse and manage past sessions
  - `list` command: Display sessions in table format
  - `show` command: View detailed session information
  - **Filtering Options**:
    - By date range (`--start-date`, `--end-date`)
    - By relative time (`--last-days`)
    - By language pair (`--source-lang`, `--target-lang`)
    - By status (`--status`: active/completed/archived)
- Table display with session ID, start time, status, languages, model, event count, and duration
- Fallback formatting when `tabulate` is not available

#### Archival System
- **Archive Management**: Keep active session list clean while preserving data
  - `archive` command: Archive old completed sessions
  - Configurable threshold (default: 30 days)
  - `unarchive` command: Restore archived sessions
  - Archived sessions remain searchable and exportable
- Configuration file (`~/.speech_translation/config.json`)
  - `archive_threshold_days`: Configurable archive threshold
  - `auto_archive`: Toggle automatic archiving

#### Export Capabilities
- **JSON Export**: Complete session data with nested structure
  - Full metadata preservation
  - Suitable for re-import and programmatic analysis
  - Includes export metadata and applied filters
- **CSV Export**: Flattened event data for spreadsheet analysis
  - One row per translation event
  - Session context included in each row
  - Individual and total latency metrics
  - **Fields**: session_id, session_start_time, session_status, source_lang, target_lang, 
    model_size, device, event_timestamp, event_time_iso, source_text, translated_text, 
    stt_latency_ms, mt_latency_ms, tts_latency_ms, total_latency_ms
- **Date Range Filtering**: Filter exports by date, language, or other criteria
- Export command supports all filter options from list command

#### Documentation
- **HISTORY_AND_EXPORT_GUIDE.md**: Comprehensive guide covering:
  - Session recording overview and storage
  - History viewing and filtering
  - Archive management and configuration
  - Export formats and use cases
  - Best practices and workflows
  - API integration examples
  - Troubleshooting
- **QUICK_REFERENCE.md**: Command cheat sheet for quick access
- **Updated README.md**: 
  - Added new features to feature list
  - Session history, archive & export section with examples
  - Updated configuration table with `--no-record` flag
  - Updated project structure
  - Updated roadmap (marked recording/export features as complete)
  - Links to additional documentation

#### Configuration
- **New CLI Flag**: `--no-record` to disable session recording
- **Data Directory**: `~/.speech_translation/` for all session data
  - `sessions/`: Active and completed sessions
  - `archive/`: Archived sessions
  - `config.json`: Configuration settings
- **Pipeline Integration**: Session recording integrated into main pipeline
  - Latency metrics captured at each stage (STT, MT, TTS)
  - Source text preserved and passed through pipeline
  - Automatic session start/end on pipeline lifecycle

#### Testing
- **test_session_manager.py**: Comprehensive test script demonstrating:
  - Session creation and recording
  - Event logging
  - Session queries
  - Export functionality (JSON and CSV)
  - File size verification

### Changed
- **Event Schema**: Added fields for latency tracking
  - `stt_latency_ms`: Speech-to-text processing time
  - `mt_latency_ms`: Machine translation processing time
  - `tts_latency_ms`: Text-to-speech processing time
  - `source_text`: Original transcribed text preserved through pipeline
- **Pipeline Initialization**: Added session manager initialization
- **TTS Worker**: Enhanced to record events with complete metrics

### Infrastructure
- **requirements.txt**: Created with all dependencies
  - Core: faster-whisper, webrtcvad, pyaudio, transformers, torch, pyttsx3
  - Optional: tabulate (with fallback)
- **.gitignore**: Added to exclude session data and cache directories
  - `.speech_translation/`: Session data directory
  - `.cache/`: Model cache
  - Python cache and virtual environment files

## Use Cases Enabled

### Performance Analysis
- Track latency trends over time
- Compare different model configurations
- Identify performance bottlenecks
- Benchmark CPU vs GPU performance

### Data Management
- Regular backups of translation history
- Long-term data retention with archiving
- Selective data export for specific periods
- Integration with external analysis tools

### Language Learning
- Track translation practice sessions
- Review past translations
- Monitor progress over time
- Identify common phrases

### Research & Development
- Collect performance data for optimization
- Test different configurations
- Validate improvements
- Generate datasets for analysis

## Breaking Changes
None - all features are additive and backwards compatible.

## Migration Guide
No migration needed. Existing installations will automatically create the session directory structure on first run with recording enabled.

## Future Enhancements
- Web UI for session browsing
- Automatic performance report generation
- Session comparison tools
- Real-time analytics dashboard
- Session replay functionality
- Cloud backup integration
- Multi-user session management
