# Analytics Dashboards Guide

## Overview

The analytics dashboards provide comprehensive insights into your productivity, task completion, and time management. The feature includes two main dashboards: Daily and Weekly.

## Accessing the Dashboards

1. Start the application: `npm start`
2. Click the **"📊 View Analytics Dashboards"** button on the main page
3. You'll see two tabs: **Daily Dashboard** and **Weekly Dashboard**

## Daily Dashboard

### Features

1. **Date Navigation**
   - Use the date picker to select any day
   - Navigate with "Previous Day" and "Next Day" buttons
   - View historical data for past days

2. **Key Metrics**
   - **Completed Tasks**: Number of tasks completed vs. daily goal
   - **Focus Time**: Total minutes spent in focus sessions
   - **Break Time**: Total minutes spent on breaks
   - **Focus/Break Ratio**: Balance between productive work and rest

3. **Goal Progress Bars**
   - Visual representation of progress towards daily goals
   - Focus Time Goal: Default 240 minutes (4 hours)
   - Tasks Goal: Default 5 tasks per day
   - Progress shown as percentage with color-coded bars

4. **Tasks by Status**
   - **Pending**: Tasks waiting to be started
   - **In Progress**: Currently active tasks
   - **Completed**: Finished tasks for the selected day
   - Each section shows up to 5 tasks with a count indicator

## Weekly Dashboard

### Features

1. **Week Navigation**
   - Navigate by weeks (Monday to Sunday)
   - View current week or historical weeks
   - Date range displayed at the top

2. **Weekly Statistics**
   - **Tasks Completed**: Total tasks finished during the week
   - **Total Productive Hours**: Sum of all focus time in hours
   - **Average Completion Rate**: Average tasks per day
   - **Weekly Streak**: Consecutive days with completed tasks

3. **Most Productive Day**
   - Highlights the day with the most focus time
   - Shows focus time and task count for that day

4. **Productive Hours Chart**
   - Bar chart showing daily productive hours
   - Compares focus hours vs. tasks completed
   - Helps identify productivity patterns

5. **Time per Category Chart**
   - Donut/Pie chart showing time distribution across task categories
   - Categories include: Development, Design, Meeting, Research, Documentation
   - Percentage breakdown of focus time

6. **Daily Breakdown Table**
   - Detailed table with metrics for each day of the week
   - Columns: Day, Focus Time, Break Time, Tasks, Productive Hours
   - Easy comparison of daily performance

## Data Sources

The analytics derive data from:

1. **Timer Sessions** (`timer-sessions.json`)
   - Focus session duration and timing
   - Break session duration and timing
   - Pomodoro vs. manual sessions

2. **Task History** (`task-history.json`)
   - Completed tasks with timestamps
   - Task categories and metadata
   - Task completion dates

3. **Task Scheduler**
   - Current pending tasks
   - In-progress tasks
   - Task status changes

## Generating Test Data

To see the dashboards in action with sample data:

1. Open the Analytics Dashboards page
2. Click the **"📊 Generate Test Data"** button
3. Confirm the action
4. The system will create:
   - 3-6 focus sessions per day for the past 7 days
   - 1-3 break sessions per day
   - 2-5 completed tasks per day with various categories
5. Dashboards will automatically refresh with the new data

## Customizing Goals

Default daily goals:
- Focus Time: 240 minutes (4 hours)
- Tasks: 5 per day

To modify goals, use the API:
```javascript
await window.notificationAPI.analyticsSetDailyGoals({
  focusTimeMinutes: 300,  // 5 hours
  tasksCount: 8           // 8 tasks
});
```

## Responsive Design

The dashboards are fully responsive and adapt to different screen sizes:
- **Desktop**: Full layout with side-by-side charts
- **Tablet**: Stacked charts, optimized for portrait orientation
- **Minimum Width**: 768px (tablet width)

## Technology Stack

- **Tailwind CSS**: Utility-first styling framework
- **Recharts**: React-based charting library
- **React 18**: Required for Recharts components
- **Vanilla JavaScript**: No build system required

## Tips for Best Results

1. **Record Sessions Regularly**: Start focus and break sessions to accumulate data
2. **Complete Tasks**: Mark tasks as completed to see accurate statistics
3. **Use Categories**: Assign categories to tasks for better insights in the weekly chart
4. **Review Weekly**: Check the weekly dashboard to identify trends and patterns
5. **Set Realistic Goals**: Adjust daily goals based on your actual capacity

## Troubleshooting

### No Data Showing

- Ensure you have completed tasks or focus sessions
- Use the "Generate Test Data" button to populate sample data
- Check that the date range is correct

### Charts Not Rendering

- Ensure you have an internet connection (for CDN resources)
- Check the browser console for errors
- Verify Recharts and React libraries are loading

### Date Navigation Issues

- Click the date picker to manually select a date
- Use the arrow buttons for relative navigation
- Current day is set automatically on load

## API Reference

### Get Daily Dashboard
```javascript
const data = await window.notificationAPI.analyticsGetDailyDashboard(date);
```

### Get Weekly Dashboard
```javascript
const data = await window.notificationAPI.analyticsGetWeeklyDashboard(weekStartDate);
```

### Set Daily Goals
```javascript
await window.notificationAPI.analyticsSetDailyGoals(goals);
```

### Get Daily Goals
```javascript
const goals = await window.notificationAPI.analyticsGetDailyGoals();
```

### Populate Test Data
```javascript
await window.notificationAPI.analyticsPopulateTestData();
```

## Future Enhancements

Potential improvements for future versions:

1. Export dashboard data as PDF or CSV
2. Custom date ranges beyond daily/weekly
3. Monthly and yearly views
4. Goal tracking over time with trend analysis
5. Comparison between different time periods
6. Custom categories management
7. Advanced filtering and search
8. Productivity insights and recommendations
9. Integration with calendar apps
10. Mobile-responsive improvements

## Support

For issues or questions, please refer to the main README.md or open an issue in the repository.
