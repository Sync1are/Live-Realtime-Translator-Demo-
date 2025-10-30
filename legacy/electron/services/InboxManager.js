const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const EventEmitter = require('events');

/**
 * InboxManager - Manages in-app notification inbox for viewing past summaries
 */
class InboxManager extends EventEmitter {
  constructor() {
    super();
    this.inbox = [];
    this.inboxPath = null;
    this.maxInboxItems = 100;
  }

  /**
   * Initialize inbox manager
   */
  async initialize() {
    try {
      const userDataPath = app.getPath('userData');
      this.inboxPath = path.join(userDataPath, 'notification-inbox.json');

      await this.load();

      console.log('Inbox manager initialized');
      console.log('Inbox path:', this.inboxPath);
    } catch (error) {
      console.error('Failed to initialize inbox manager:', error);
      throw error;
    }
  }

  /**
   * Load inbox from disk
   */
  async load() {
    try {
      if (fs.existsSync(this.inboxPath)) {
        const data = fs.readFileSync(this.inboxPath, 'utf8');
        this.inbox = JSON.parse(data);
        console.log(`Loaded ${this.inbox.length} inbox items`);
      } else {
        this.inbox = [];
        await this.save();
      }
    } catch (error) {
      console.error('Failed to load inbox:', error);
      this.inbox = [];
    }
  }

  /**
   * Save inbox to disk
   */
  async save() {
    try {
      const data = JSON.stringify(this.inbox, null, 2);
      fs.writeFileSync(this.inboxPath, data, 'utf8');
    } catch (error) {
      console.error('Failed to save inbox:', error);
      throw error;
    }
  }

  /**
   * Add an item to the inbox
   */
  async addItem(item) {
    const inboxItem = {
      id: item.id || `inbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: item.type,
      timestamp: item.timestamp || Date.now(),
      data: item.data,
      read: false,
      ...item
    };

    this.inbox.unshift(inboxItem);

    // Trim inbox if it exceeds max size
    if (this.inbox.length > this.maxInboxItems) {
      this.inbox = this.inbox.slice(0, this.maxInboxItems);
    }

    await this.save();
    this.emit('itemAdded', inboxItem);

    return inboxItem;
  }

  /**
   * Get all inbox items
   */
  getAllItems() {
    return [...this.inbox];
  }

  /**
   * Get unread items count
   */
  getUnreadCount() {
    return this.inbox.filter(item => !item.read).length;
  }

  /**
   * Get an item by ID
   */
  getItem(itemId) {
    return this.inbox.find(item => item.id === itemId);
  }

  /**
   * Mark an item as read
   */
  async markAsRead(itemId) {
    const item = this.inbox.find(item => item.id === itemId);
    if (item) {
      item.read = true;
      await this.save();
      this.emit('itemMarkedRead', itemId);
    }
  }

  /**
   * Mark all items as read
   */
  async markAllAsRead() {
    this.inbox.forEach(item => {
      item.read = true;
    });
    await this.save();
    this.emit('allMarkedRead');
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId) {
    const index = this.inbox.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.inbox.splice(index, 1);
      await this.save();
      this.emit('itemDeleted', itemId);
    }
  }

  /**
   * Clear all items
   */
  async clearAll() {
    this.inbox = [];
    await this.save();
    this.emit('inboxCleared');
  }

  /**
   * Filter items by type
   */
  filterByType(type) {
    return this.inbox.filter(item => item.type === type);
  }

  /**
   * Filter items by date range
   */
  filterByDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this.inbox.filter(item => {
      return item.timestamp >= start && item.timestamp <= end;
    });
  }

  /**
   * Get items from last N days
   */
  getRecentItems(days = 7) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return this.inbox.filter(item => item.timestamp >= cutoff);
  }

  /**
   * Search items
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    
    return this.inbox.filter(item => {
      const dataStr = JSON.stringify(item.data).toLowerCase();
      return dataStr.includes(lowerQuery);
    });
  }
}

module.exports = InboxManager;
