// Data service for managing user activities and calculations
export interface ActivityData {
  id: string;
  type: string;
  value: number;
  unit: string;
  co2: number;
  timestamp: Date;
  date: string; // YYYY-MM-DD format for grouping
}

export interface WeeklyData {
  day: string;
  co2: number;
  date: string;
}

export interface MonthlySummary {
  totalCo2: number;
  activityCount: number;
  averageDaily: number;
  treesNeeded: number;
}

class DataService {
  private readonly ACTIVITIES_KEY = 'terra_activities';
  private readonly SETTINGS_KEY = 'terra_settings';

  // Get all activities
  getActivities(): ActivityData[] {
    try {
      const stored = localStorage.getItem(this.ACTIVITIES_KEY);
      if (!stored) return [];
      
      const activities = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return activities.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }));
    } catch (error) {
      console.error('Error loading activities:', error);
      return [];
    }
  }

  // Save a new activity
  saveActivity(activity: Omit<ActivityData, 'id' | 'timestamp' | 'date'>): ActivityData {
    const newActivity: ActivityData = {
      ...activity,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      timestamp: new Date(),
      date: new Date().toISOString().split('T')[0]
    };

    const activities = this.getActivities();
    activities.unshift(newActivity); // Add to beginning
    
    // Keep only last 100 activities to prevent localStorage bloat
    const limitedActivities = activities.slice(0, 100);
    
    localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(limitedActivities));
    return newActivity;
  }

  // Get activities for a specific date range
  getActivitiesByDateRange(startDate: Date, endDate: Date): ActivityData[] {
    const activities = this.getActivities();
    return activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= startDate && activityDate <= endDate;
    });
  }

  // Get activities for the last N days
  getRecentActivities(days: number = 7): ActivityData[] {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.getActivitiesByDateRange(startDate, endDate);
  }

  // Get weekly data for the last 7 days
  getWeeklyData(): WeeklyData[] {
    const activities = this.getRecentActivities(7);
    const weeklyData: { [key: string]: { co2: number; date: string } } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      weeklyData[dateStr] = {
        co2: 0,
        date: dayName
      };
    }
    
    // Sum up activities by date
    activities.forEach(activity => {
      if (weeklyData[activity.date]) {
        weeklyData[activity.date].co2 += activity.co2;
      }
    });
    
    return Object.values(weeklyData);
  }

  // Get monthly summary
  getMonthlySummary(): MonthlySummary {
    const activities = this.getRecentActivities(30);
    const totalCo2 = activities.reduce((sum, activity) => sum + activity.co2, 0);
    const activityCount = activities.length;
    const averageDaily = totalCo2 / 30;
    const treesNeeded = Math.ceil(totalCo2 / 22); // 22 kg CO2 per tree per year
    
    return {
      totalCo2,
      activityCount,
      averageDaily,
      treesNeeded
    };
  }

  // Get this week's total
  getWeeklyTotal(): number {
    const weeklyData = this.getWeeklyData();
    return weeklyData.reduce((sum, day) => sum + day.co2, 0);
  }

  // Clear all data
  clearAllData(): void {
    localStorage.removeItem(this.ACTIVITIES_KEY);
    localStorage.removeItem(this.SETTINGS_KEY);
  }

  // Export data (for future backup feature)
  exportData(): string {
    const activities = this.getActivities();
    return JSON.stringify({
      activities,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  // Import data (for future restore feature)
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.activities && Array.isArray(data.activities)) {
        localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(data.activities));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export const dataService = new DataService();
