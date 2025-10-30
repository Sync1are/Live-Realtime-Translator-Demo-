// Task Manager UI Logic
let currentEditingTaskId = null;
let currentFilters = {};
let activeTaskTimerInterval = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  await loadTasks();
  await loadCategories();
  setupKeyboardShortcuts();
  setupEventListeners();
  startActiveTaskTimer();
  
  // Check for rollovers on load
  await window.notificationAPI.taskMarkRollovers();
});

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd+N for quick add
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      document.getElementById('quick-add-input').focus();
    }

    // Escape to close modal
    if (e.key === 'Escape') {
      closeTaskModal();
    }
  });
}

// Setup event listeners for task events
function setupEventListeners() {
  window.notificationAPI.onTaskCompleted((task) => {
    console.log('Task completed:', task);
    loadTasks();
  });

  window.notificationAPI.onTaskTimerStarted((data) => {
    console.log('Timer started:', data);
    loadTasks();
    updateFloatingTimer();
  });

  window.notificationAPI.onTaskTimerPaused((data) => {
    console.log('Timer paused:', data);
    loadTasks();
    updateFloatingTimer();
  });

  window.notificationAPI.onTaskTimerResumed((data) => {
    console.log('Timer resumed:', data);
    loadTasks();
    updateFloatingTimer();
  });
}

// Load all tasks and render
async function loadTasks() {
  try {
    let tasks = await window.notificationAPI.taskGetAll();
    
    // Apply filters
    if (Object.keys(currentFilters).length > 0) {
      tasks = await window.notificationAPI.taskGetFiltered(currentFilters);
    }

    renderTasks(tasks);
  } catch (error) {
    console.error('Failed to load tasks:', error);
  }
}

// Render tasks by status
function renderTasks(tasks) {
  const statuses = ['not_started', 'in_progress', 'paused', 'completed'];
  
  statuses.forEach(status => {
    const statusTasks = tasks.filter(t => t.status === status);
    const container = document.getElementById(`tasks-${status.replace('_', '-')}`);
    const count = document.getElementById(`count-${status.replace('_', '-')}`);
    
    count.textContent = statusTasks.length;
    
    if (statusTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">No tasks</div>
        </div>
      `;
    } else {
      container.innerHTML = statusTasks.map(task => renderTaskItem(task)).join('');
    }
  });
}

// Render individual task item
function renderTaskItem(task) {
  const timeCompare = getTimeComparison(task);
  const rolloverClass = task.isPendingFromYesterday ? 'pending-rollover' : '';
  
  return `
    <div class="task-item ${rolloverClass}" onclick="openEditTaskModal('${task.id}')">
      <div class="task-item-header">
        <div class="task-item-title">${escapeHtml(task.title)}</div>
        <div class="task-item-priority ${task.priority}">${task.priority}</div>
      </div>
      
      ${task.description ? `<div class="task-item-description">${escapeHtml(task.description)}</div>` : ''}
      
      <div class="task-item-meta">
        <div class="task-item-time">
          ${task.estimatedMinutes > 0 ? `
            <span>Est: ${formatMinutes(task.estimatedMinutes)}</span>
            <span class="time-progress ${timeCompare.class}">
              ${task.actualMinutes > 0 ? `Act: ${formatMinutes(task.actualMinutes)} ${timeCompare.indicator}` : ''}
            </span>
          ` : ''}
        </div>
      </div>
      
      ${(task.categories.length > 0 || task.tags.length > 0) ? `
        <div class="task-item-tags">
          ${task.categories.map(cat => `<span class="task-tag">📁 ${escapeHtml(cat)}</span>`).join('')}
          ${task.tags.map(tag => `<span class="task-tag">#${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
      
      ${task.isPendingFromYesterday ? `<div class="task-tag" style="background: #feebc8; color: #7c2d12; margin-top: 8px;">⏰ Pending from Yesterday</div>` : ''}
      
      <div class="task-item-actions" onclick="event.stopPropagation()">
        ${task.status === 'not_started' ? `
          <button class="btn-success btn-small" onclick="startTask('${task.id}')">▶ Start</button>
        ` : ''}
        ${task.status === 'in_progress' ? `
          <button class="btn-warning btn-small" onclick="pauseTask('${task.id}')">⏸ Pause</button>
        ` : ''}
        ${task.status === 'paused' ? `
          <button class="btn-success btn-small" onclick="resumeTask('${task.id}')">▶ Resume</button>
        ` : ''}
        ${task.status !== 'completed' ? `
          <button class="btn-success btn-small" onclick="completeTask('${task.id}')">✓ Complete</button>
        ` : ''}
        <button class="btn-danger btn-small" onclick="deleteTask('${task.id}')">🗑 Delete</button>
      </div>
    </div>
  `;
}

// Get time comparison between actual and estimated
function getTimeComparison(task) {
  if (!task.estimatedMinutes || task.actualMinutes === 0) {
    return { class: '', indicator: '' };
  }
  
  const diff = task.actualMinutes - task.estimatedMinutes;
  if (diff > 0) {
    return { class: 'over', indicator: `(+${formatMinutes(diff)})` };
  } else if (diff < 0) {
    return { class: 'under', indicator: `(${formatMinutes(diff)})` };
  }
  return { class: '', indicator: '(on time)' };
}

// Format minutes to readable time
function formatMinutes(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Format seconds to HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Quick add task
async function quickAddTask(event) {
  event.preventDefault();
  
  const input = document.getElementById('quick-add-input');
  const title = input.value.trim();
  
  if (!title) return;
  
  try {
    const result = await window.notificationAPI.taskCreate({ title });
    if (result.success) {
      input.value = '';
      await loadTasks();
    } else {
      alert('Failed to create task: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to create task:', error);
    alert('Failed to create task');
  }
}

// Open task modal for new task
function openTaskModal() {
  currentEditingTaskId = null;
  document.getElementById('modal-title').textContent = 'Create Task';
  document.getElementById('task-title').value = '';
  document.getElementById('task-description').value = '';
  document.getElementById('task-estimate').value = '30';
  document.getElementById('task-priority').value = 'medium';
  document.getElementById('task-scheduled-date').value = '';
  document.getElementById('task-time-block').value = '';
  
  // Clear tags
  const categoriesContainer = document.getElementById('task-categories');
  const tagsContainer = document.getElementById('task-tags');
  categoriesContainer.querySelectorAll('.form-tag').forEach(tag => tag.remove());
  tagsContainer.querySelectorAll('.form-tag').forEach(tag => tag.remove());
  
  document.getElementById('task-modal').classList.add('active');
}

// Open task modal for editing
async function openEditTaskModal(taskId) {
  currentEditingTaskId = taskId;
  
  try {
    const task = await window.notificationAPI.taskGetById(taskId);
    if (!task) {
      alert('Task not found');
      return;
    }
    
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-estimate').value = task.estimatedMinutes || 30;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-scheduled-date').value = task.scheduledDate || '';
    
    if (task.scheduledTimeBlock) {
      const blockValue = `${task.scheduledTimeBlock.start}-${task.scheduledTimeBlock.end}`;
      document.getElementById('task-time-block').value = blockValue;
    } else {
      document.getElementById('task-time-block').value = '';
    }
    
    // Populate categories and tags
    const categoriesContainer = document.getElementById('task-categories');
    const tagsContainer = document.getElementById('task-tags');
    
    categoriesContainer.querySelectorAll('.form-tag').forEach(tag => tag.remove());
    tagsContainer.querySelectorAll('.form-tag').forEach(tag => tag.remove());
    
    task.categories.forEach(cat => addFormTag('categories', cat));
    task.tags.forEach(tag => addFormTag('tags', tag));
    
    document.getElementById('task-modal').classList.add('active');
  } catch (error) {
    console.error('Failed to load task:', error);
    alert('Failed to load task');
  }
}

// Close task modal
function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('active');
  currentEditingTaskId = null;
}

// Save task
async function saveTask(event) {
  event.preventDefault();
  
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const estimatedMinutes = parseInt(document.getElementById('task-estimate').value) || 0;
  const priority = document.getElementById('task-priority').value;
  const scheduledDate = document.getElementById('task-scheduled-date').value || null;
  const timeBlockValue = document.getElementById('task-time-block').value;
  
  let scheduledTimeBlock = null;
  if (timeBlockValue) {
    const [start, end] = timeBlockValue.split('-');
    scheduledTimeBlock = { start, end };
  }
  
  const categories = getFormTags('categories');
  const tags = getFormTags('tags');
  
  const taskData = {
    title,
    description,
    estimatedMinutes,
    priority,
    categories,
    tags,
    scheduledDate,
    scheduledTimeBlock
  };
  
  try {
    let result;
    if (currentEditingTaskId) {
      result = await window.notificationAPI.taskUpdate(currentEditingTaskId, taskData);
    } else {
      result = await window.notificationAPI.taskCreate(taskData);
    }
    
    if (result.success) {
      closeTaskModal();
      await loadTasks();
    } else {
      alert('Failed to save task: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to save task:', error);
    alert('Failed to save task');
  }
}

// Handle tag input
function handleTagInput(event, type) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const value = event.target.value.trim();
    if (value) {
      addFormTag(type, value);
      event.target.value = '';
    }
  }
}

// Add form tag
function addFormTag(type, value) {
  const container = document.getElementById(`task-${type}`);
  const input = container.querySelector('.form-tag-input');
  
  const tag = document.createElement('div');
  tag.className = 'form-tag';
  tag.innerHTML = `
    ${escapeHtml(value)}
    <button type="button" class="form-tag-remove" onclick="this.parentElement.remove()">×</button>
  `;
  
  container.insertBefore(tag, input);
}

// Get form tags
function getFormTags(type) {
  const container = document.getElementById(`task-${type}`);
  const tags = container.querySelectorAll('.form-tag');
  return Array.from(tags).map(tag => tag.textContent.trim().replace('×', ''));
}

// Start task
async function startTask(taskId) {
  try {
    const result = await window.notificationAPI.taskStartTimer(taskId);
    if (result.success) {
      await loadTasks();
      updateFloatingTimer();
    } else {
      alert('Failed to start task: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to start task:', error);
    alert('Failed to start task');
  }
}

// Pause task
async function pauseTask(taskId) {
  try {
    const result = await window.notificationAPI.taskPauseTimer();
    if (result.success) {
      await loadTasks();
      updateFloatingTimer();
    } else {
      alert('Failed to pause task: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to pause task:', error);
    alert('Failed to pause task');
  }
}

// Resume task
async function resumeTask(taskId) {
  try {
    const result = await window.notificationAPI.taskResumeTimer(taskId);
    if (result.success) {
      await loadTasks();
      updateFloatingTimer();
    } else {
      alert('Failed to resume task: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to resume task:', error);
    alert('Failed to resume task');
  }
}

// Complete task
async function completeTask(taskId) {
  if (!confirm('Are you sure you want to mark this task as completed?')) {
    return;
  }
  
  try {
    const result = await window.notificationAPI.taskComplete(taskId);
    if (result.success) {
      await loadTasks();
      updateFloatingTimer();
    } else {
      alert('Failed to complete task: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to complete task:', error);
    alert('Failed to complete task');
  }
}

// Delete task
async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
    return;
  }
  
  try {
    const result = await window.notificationAPI.taskDelete(taskId);
    if (result.success) {
      await loadTasks();
    } else {
      alert('Failed to delete task: ' + result.error);
    }
  } catch (error) {
    console.error('Failed to delete task:', error);
    alert('Failed to delete task');
  }
}

// Update floating timer
async function updateFloatingTimer() {
  try {
    const activeTask = await window.notificationAPI.taskGetActive();
    const floatingTimer = document.getElementById('floating-timer');
    
    if (activeTask) {
      floatingTimer.classList.add('active');
      document.getElementById('timer-task-title').textContent = activeTask.title;
    } else {
      floatingTimer.classList.remove('active');
      if (activeTaskTimerInterval) {
        clearInterval(activeTaskTimerInterval);
        activeTaskTimerInterval = null;
      }
    }
  } catch (error) {
    console.error('Failed to update floating timer:', error);
  }
}

// Start active task timer update loop
function startActiveTaskTimer() {
  // Update every second
  activeTaskTimerInterval = setInterval(async () => {
    try {
      const activeTask = await window.notificationAPI.taskGetActive();
      
      if (activeTask) {
        const totalSeconds = activeTask.totalMinutesWithCurrent * 60;
        document.getElementById('timer-elapsed').textContent = formatTime(totalSeconds);
      }
    } catch (error) {
      console.error('Failed to update timer:', error);
    }
  }, 1000);
}

// Pause active timer
async function pauseActiveTimer() {
  try {
    const result = await window.notificationAPI.taskPauseTimer();
    if (result.success) {
      await loadTasks();
      updateFloatingTimer();
    }
  } catch (error) {
    console.error('Failed to pause timer:', error);
  }
}

// Complete active task
async function completeActiveTask() {
  try {
    const activeTask = await window.notificationAPI.taskGetActive();
    if (activeTask) {
      await completeTask(activeTask.id);
    }
  } catch (error) {
    console.error('Failed to complete active task:', error);
  }
}

// Load categories for filter
async function loadCategories() {
  try {
    const categories = await window.notificationAPI.taskGetAllCategories();
    const select = document.getElementById('filter-category');
    
    // Clear existing options except "All"
    while (select.options.length > 1) {
      select.remove(1);
    }
    
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

// Apply filters
async function applyFilters() {
  currentFilters = {};
  
  const priority = document.getElementById('filter-priority').value;
  const category = document.getElementById('filter-category').value;
  const rollover = document.getElementById('filter-rollover').checked;
  
  if (priority) currentFilters.priority = priority;
  if (category) currentFilters.category = category;
  if (rollover) currentFilters.isPendingFromYesterday = true;
  
  await loadTasks();
}

// Clear filters
async function clearFilters() {
  document.getElementById('filter-priority').value = '';
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-rollover').checked = false;
  currentFilters = {};
  await loadTasks();
}

// Switch view
function switchView(view) {
  const listView = document.getElementById('task-lists-view');
  const blockingView = document.getElementById('time-blocking-view');
  const buttons = document.querySelectorAll('.view-btn');
  
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (view === 'lists') {
    listView.style.display = 'grid';
    blockingView.classList.remove('active');
    buttons[0].classList.add('active');
  } else {
    listView.style.display = 'none';
    blockingView.classList.add('active');
    buttons[1].classList.add('active');
    renderTimeBlocking();
  }
}

// Render time blocking view
async function renderTimeBlocking() {
  const grid = document.getElementById('time-blocking-grid');
  const today = new Date().toISOString().split('T')[0];
  
  // Set date header
  document.getElementById('blocking-date').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Get tasks scheduled for today
  const tasks = await window.notificationAPI.taskGetFiltered({ scheduledDate: today });
  
  // Create time slots
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
  grid.innerHTML = '';
  
  hours.forEach(hour => {
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
    const nextHour = `${(hour + 1).toString().padStart(2, '0')}:00`;
    
    // Find task for this time slot
    const slotTask = tasks.find(task => {
      if (!task.scheduledTimeBlock) return false;
      return task.scheduledTimeBlock.start === timeLabel;
    });
    
    grid.innerHTML += `
      <div class="time-slot">
        <div class="time-label">${timeLabel}</div>
        <div class="time-content">
          ${slotTask ? `
            <div class="time-block" onclick="openEditTaskModal('${slotTask.id}')">
              <div class="time-block-title">${escapeHtml(slotTask.title)}</div>
              <div class="time-block-time">
                ${slotTask.scheduledTimeBlock.start} - ${slotTask.scheduledTimeBlock.end}
                ${slotTask.estimatedMinutes ? ` (${formatMinutes(slotTask.estimatedMinutes)})` : ''}
              </div>
              ${slotTask.status !== 'completed' ? `
                <button class="btn-success btn-small" style="margin-top: 8px;" onclick="event.stopPropagation(); startTask('${slotTask.id}')">
                  ▶ Start Now
                </button>
              ` : '<div style="margin-top: 8px; opacity: 0.8;">✓ Completed</div>'}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
}

// Schedule task for block (placeholder)
function scheduleTaskForBlock() {
  alert('To schedule a task, open the task modal (+ New Task or click a task) and set a Scheduled Date and Time Block.');
}
