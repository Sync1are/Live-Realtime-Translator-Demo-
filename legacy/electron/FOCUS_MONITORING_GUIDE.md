# Focus Monitoring Guide

## Overview

The Focus Monitoring feature helps users stay focused by tracking when they leave the application or switch to blacklisted apps/websites. It provides a grace period before automatically pausing the timer and logs all distraction events for later review.

## Features

### 1. Focus Detection
- **Browser Window Events**: Monitors when the Electron app loses/gains focus
- **Active Window Detection**: Uses `active-win` to detect which app/window is active
- **Real-time Monitoring**: Checks every second when enabled

### 2. Whitelist/Blacklist Management
- **Whitelist**: Apps and URL patterns that won't trigger the grace countdown
  - Example: Add "Slack" or "zoom.us/*" for work-related apps
- **Blacklist**: Apps and URL patterns that will immediately trigger grace countdown
  - Example: Add "Facebook" or "twitter.com/*" for distracting sites

### 3. Grace Countdown
- **Duration**: Configurable (default 10 seconds)
- **Notification Types**:
  - In-app banner/toast with countdown timer
  - System notification
- **Cancellation**: Returns to app within grace period cancels the countdown

### 4. Auto-Pause Timer
- Automatically pauses active task timer after grace period expires
- Records distraction event with:
  - Timestamp
  - Duration
  - App name
  - Window title
  - URL (if browser)
  - Type (blacklisted or unfocused)

### 5. Focus Activity Panel
- View complete distraction log
- Add annotations/notes to entries
- Delete individual entries
- Clear entire log
- Quick actions to adjust whitelist/blacklist from log entries

## Settings

### Enable Focus Monitoring
```javascript
await window.notificationAPI.focusMonitoringSetEnabled(true);
```

### Configure Grace Period
```javascript
await window.notificationAPI.focusMonitoringUpdateSettings({
  graceCountdownDuration: 15 // seconds
});
```

### Manage Whitelist
```javascript
// Add to whitelist
await window.notificationAPI.focusMonitoringAddToWhitelist({
  type: 'app',  // or 'url'
  pattern: 'Slack'
});

// Remove from whitelist
await window.notificationAPI.focusMonitoringRemoveFromWhitelist(index);
```

### Manage Blacklist
```javascript
// Add to blacklist
await window.notificationAPI.focusMonitoringAddToBlacklist({
  type: 'url',
  pattern: 'facebook.com/*'
});

// Remove from blacklist
await window.notificationAPI.focusMonitoringRemoveFromBlacklist(index);
```

## Pattern Matching

Patterns support wildcards:
- `*` matches any number of characters
- `?` matches a single character
- Patterns are case-insensitive

Examples:
- `Chrome` - matches Chrome browser
- `*chrome*` - matches anything containing "chrome"
- `slack.com/*` - matches any Slack URL
- `*.youtube.com/*` - matches YouTube and subdomains

## Distraction Log

### View Log
```javascript
const log = await window.notificationAPI.focusMonitoringGetDistractionLog(limit, offset);
```

### Annotate Entry
```javascript
await window.notificationAPI.focusMonitoringAnnotateDistraction(distractionId, 'Was checking work Slack');
```

### Delete Entry
```javascript
await window.notificationAPI.focusMonitoringDeleteDistraction(distractionId);
```

### Clear All
```javascript
await window.notificationAPI.focusMonitoringClearLog();
```

## Events

### Grace Countdown Started
```javascript
window.notificationAPI.onFocusGraceStarted((data) => {
  console.log('Grace countdown started:', data.target.name);
  console.log('Duration:', data.duration, 'seconds');
});
```

### Grace Countdown Cancelled
```javascript
window.notificationAPI.onFocusGraceCancelled(() => {
  console.log('User returned to app - countdown cancelled');
});
```

### Auto-Pause Triggered
```javascript
window.notificationAPI.onFocusAutoPauseTriggered((data) => {
  console.log('Timer auto-paused due to:', data.distraction.appName);
  console.log('Distraction logged:', data.distraction);
});
```

## Integration with Timer Service

The Focus Monitoring service automatically integrates with the Timer Service:
- When grace period expires and timer is active, the timer is paused
- Distraction event is logged with timestamp and duration
- User can review and annotate distraction in the Focus Activity panel

## Storage

All focus monitoring data is persisted:
- **Settings**: Stored in `notification-settings.json`
- **Distraction Log**: Stored in `focus-distraction-log.json`
- Both files are in the app's userData directory

## Use Cases

### Example 1: Work-Focused Setup
```javascript
// Enable monitoring
await window.notificationAPI.focusMonitoringSetEnabled(true);

// Whitelist work apps
await window.notificationAPI.focusMonitoringAddToWhitelist({ type: 'app', pattern: 'Slack' });
await window.notificationAPI.focusMonitoringAddToWhitelist({ type: 'app', pattern: 'Teams' });
await window.notificationAPI.focusMonitoringAddToWhitelist({ type: 'url', pattern: '*.zoom.us/*' });

// Blacklist distracting sites
await window.notificationAPI.focusMonitoringAddToBlacklist({ type: 'url', pattern: 'facebook.com/*' });
await window.notificationAPI.focusMonitoringAddToBlacklist({ type: 'url', pattern: 'twitter.com/*' });
await window.notificationAPI.focusMonitoringAddToBlacklist({ type: 'url', pattern: 'reddit.com/*' });
```

### Example 2: Study Session
```javascript
// Shorter grace period for strict focus
await window.notificationAPI.focusMonitoringUpdateSettings({
  graceCountdownDuration: 5
});

// Whitelist educational resources
await window.notificationAPI.focusMonitoringAddToWhitelist({ type: 'url', pattern: 'stackoverflow.com/*' });
await window.notificationAPI.focusMonitoringAddToWhitelist({ type: 'url', pattern: 'developer.mozilla.org/*' });
```

## Best Practices

1. **Start Simple**: Begin with a few key blacklist items and expand as needed
2. **Use Whitelist Wisely**: Only whitelist apps/sites genuinely needed for work
3. **Review Logs**: Regularly check the Focus Activity panel to identify patterns
4. **Adjust Grace Period**: Find a balance between strictness and flexibility
5. **Add Context**: Annotate distraction entries to understand triggers better

## Troubleshooting

### Active Window Detection Not Working
- `active-win` requires platform-specific permissions
- On macOS: May need Screen Recording permission
- On Linux: Works on X11 and Wayland with some limitations
- On Windows: Should work without additional setup

### False Positives
- Add legitimate apps/sites to whitelist
- Adjust pattern matching to be more specific
- Increase grace period duration

### Timer Not Pausing
- Ensure Focus Monitoring is enabled
- Check that a timer session is active
- Verify grace period has fully elapsed

## Architecture

```
FocusMonitoringService
├── Focus Detection
│   ├── Electron blur/focus events
│   └── active-win polling
├── Whitelist/Blacklist Logic
│   ├── Pattern matching
│   └── Settings persistence
├── Grace Countdown
│   ├── System notifications
│   └── In-app banner
└── Distraction Logging
    ├── JSON file storage
    └── Annotation support
```

## API Reference

See `preload.js` for complete API documentation. All methods are available under `window.notificationAPI.*`.
