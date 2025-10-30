import { db } from './Database';
import { AppSettings, defaultSettings } from '../models/Settings';

export class SettingsRepository {
  async get(): Promise<AppSettings> {
    const settings = await db.settings.get('main');
    if (settings) return settings;

    const newSettings: AppSettings = {
      id: 'main',
      ...defaultSettings,
      updatedAt: new Date().toISOString(),
    };

    await db.settings.add(newSettings);
    return newSettings;
  }

  async update(updates: Partial<Omit<AppSettings, 'id'>>): Promise<AppSettings> {
    const settings = await this.get();
    const updated: AppSettings = {
      ...settings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.settings.put(updated);
    return updated;
  }

  async reset(): Promise<AppSettings> {
    const newSettings: AppSettings = {
      id: 'main',
      ...defaultSettings,
      updatedAt: new Date().toISOString(),
    };

    await db.settings.put(newSettings);
    return newSettings;
  }
}

export const settingsRepository = new SettingsRepository();
