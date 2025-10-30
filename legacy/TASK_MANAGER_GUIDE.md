# Task Manager & Timer Guide

## Overview

The Task Manager provides a comprehensive task management system with integrated timer functionality and time-blocking features. It allows you to create, organize, and track tasks while monitoring time spent on each task.

## Features

### Task Management
- **Create Tasks**: Add tasks with title, description, estimated time, priority, categories, and tags
- **Edit Tasks**: Update any task properties at any time
- **Delete Tasks**: Remove tasks (cannot delete tasks with active timers)
- **Quick Add**: Rapidly add tasks using the quick-add input (Ctrl/Cmd+N)

### Task Organization
- **Status-Based Lists**: Tasks are organized by status:
  - Not Started
  - In Progress
  - Paused
  - Completed
- **Priority Levels**: Low, Medium, High, Urgent
- **Categories & Tags**: Organize tasks with custom categories and tags
- **Filtering**: Filter tasks by priority, category, or rollover status

### Timer & Time Tracking
- **Start Timer**: Begin timing a task from any status list
- **Pause/Resume**: Pause and resume timers as needed
- **Accumulated Time**: Time accumulates across multiple sessions
- **Active Task Indicator**: Floating timer shows the currently active task
- **Time Logs**: Detailed time logs for each task session

### Time Comparison
- **Estimated vs Actual**: See at-a-glance how actual time compares to estimates
- **Over/Under Indicators**: Visual indicators show if you're over or under estimate
- **Progress Tracking**: Monitor task completion progress

### Time Blocking
- **Daily Planning**: Schedule tasks into time blocks throughout the day
- **Timeline View**: Visualize your day with scheduled tasks
- **Quick Start**: Start tasks directly from the time-blocking view
- **Flexible Scheduling**: Assign tasks to hourly time blocks

### Rollover Management
- **Pending from Yesterday**: Tasks automatically flagged when not completed
- **Visual Indicators**: Orange border highlights rollover tasks
- **Filter by Rollover**: Easily find tasks pending from previous days

## Usage

### Creating a Task

1. Click "**+ New Task**" button in the header
2. Fill in the form:
   - **Title** (required): Short descriptive name
   - **Description**: Detailed information about the task
   - **Estimated Time**: How long you expect the task to take (in minutes)
   - **Priority**: Low, Medium, High, or Urgent
   - **Categories**: Type and press Enter to add categories
   - **Tags**: Type and press Enter to add tags
   - **Scheduled Date**: When you plan to work on this task
   - **Time Block**: Specific time slot for the task
3. Click "**Save Task**"

### Quick Add Task

1. Press **Ctrl+N** (Windows/Linux) or **Cmd+N** (Mac)
2. Type the task title in the quick-add input
3. Press **Enter** or click "**Add Task**"

The task will be created with default settings (medium priority, 30-minute estimate).

### Starting a Task

**From Task Lists:**
1. Find the task in the "Not Started" list
2. Click the "**▶ Start**" button

**From Time Blocking:**
1. Switch to the "Time Blocking" view
2. Click "**▶ Start Now**" on a scheduled task

When you start a task:
- The task moves to "In Progress"
- The timer begins counting
- A floating timer appears in the bottom-right corner

### Pausing a Task

1. Click "**⏸ Pause**" on the task or in the floating timer
2. The task moves to "Paused" status
3. Elapsed time is recorded in the time log
4. The timer stops

### Resuming a Task

1. Find the paused task in the "Paused" list
2. Click "**▶ Resume**"
3. The timer continues from where it left off

### Completing a Task

1. Click "**✓ Complete**" on the task or in the floating timer
2. Confirm the completion
3. The task moves to "Completed" status
4. If a timer is running, it automatically pauses first

### Editing a Task

1. Click anywhere on the task card (except action buttons)
2. The edit modal opens with current values
3. Make your changes
4. Click "**Save Task**"

### Deleting a Task

1. Click "**🗑 Delete**" on the task
2. Confirm the deletion
3. The task is permanently removed

**Note:** You cannot delete a task with an active timer. Pause or complete it first.

### Filtering Tasks

Use the filter bar above the task lists:

- **Priority**: Show only tasks with a specific priority
- **Category**: Show only tasks in a specific category
- **Pending from Yesterday**: Show only rollover tasks

Click "**Clear Filters**" to reset all filters.

### Time Blocking View

1. Click "**📅 Time Blocking**" in the view switcher
2. See your daily schedule with time slots from 8 AM to 7 PM
3. Scheduled tasks appear in their assigned time blocks
4. Click a task to edit it
5. Click "**▶ Start Now**" to begin timing a task

To schedule a task:
1. Create or edit a task
2. Set the "**Scheduled Date**"
3. Choose a "**Time Block**"
4. Save the task

### Floating Timer

When a task is actively being timed:
- A floating timer appears in the bottom-right corner
- Shows the task title and elapsed time
- Provides quick access to:
  - "**⏸ Pause**": Pause the current timer
  - "**✓ Complete**": Mark the task as completed

The timer updates every second and shows time in HH:MM:SS format.

## Keyboard Shortcuts

- **Ctrl/Cmd+N**: Focus the quick-add input
- **Escape**: Close any open modal

## Data Storage

All task data is stored locally in:
- `tasks.json`: Task information
- `task-time-logs.json`: Time tracking logs

These files are in your Electron app's userData directory.

## Tips & Best Practices

1. **Set Realistic Estimates**: Track your actual time to improve future estimates
2. **Use Categories**: Organize tasks by project or area (Work, Personal, etc.)
3. **Prioritize Wisely**: Use "Urgent" sparingly for truly critical tasks
4. **Review Rollovers**: Check "Pending from Yesterday" tasks each morning
5. **Time Block Your Day**: Plan your day in advance using the time-blocking view
6. **Monitor Time Comparison**: Use over/under indicators to improve time estimation
7. **Pause When Interrupted**: Pause timers during breaks to maintain accurate logs
8. **Complete Tasks Promptly**: Move completed tasks to the Completed list to keep organized

## Integration with Other Features

- **Analytics**: Completed tasks feed into the analytics dashboard
- **Daily Stats**: Task completion updates daily statistics
- **Gamification**: Earn XP and achievements for completing tasks
- **Notifications**: Receive notifications for scheduled tasks (via main app)

## Troubleshooting

**Timer not updating:**
- Refresh the page
- Check if another task has an active timer

**Task won't delete:**
- Make sure the task doesn't have an active timer
- Pause or complete the task first

**Categories not showing in filter:**
- Create tasks with categories first
- The filter populates from existing categories

**Time-blocking view is empty:**
- Make sure tasks have both a scheduled date and time block assigned
- Check that you're viewing today's date

## API Reference

For developers integrating with the task system:

```javascript
// Create a task
const result = await window.notificationAPI.taskCreate({
  title: 'My Task',
  description: 'Task description',
  estimatedMinutes: 60,
  priority: 'high',
  categories: ['Work'],
  tags: ['important']
});

// Start timer
await window.notificationAPI.taskStartTimer(taskId);

// Pause timer
await window.notificationAPI.taskPauseTimer();

// Get active task
const activeTask = await window.notificationAPI.taskGetActive();

// Get all tasks
const tasks = await window.notificationAPI.taskGetAll();

// Filter tasks
const filteredTasks = await window.notificationAPI.taskGetFiltered({
  status: 'in_progress',
  priority: 'high'
});
```

## Future Enhancements

Potential improvements for future versions:
- Recurring tasks
- Task dependencies
- Subtasks
- Task templates
- CSV/JSON import/export
- Calendar integration
- Collaboration features
- Custom time blocks
- Work sessions with breaks
- Mobile app support
