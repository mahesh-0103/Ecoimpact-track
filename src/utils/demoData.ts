import { dataService } from '../services/dataService';

// Populate localStorage with a few demo activities for the dashboard
export function addDemoData() {
  try {
    // clear first
    dataService.clearAllData();

    const entries = [
      { type: 'Electricity', value: 12, unit: 'kWh', co2: 6.6 },
      { type: 'Car Travel', value: 40, unit: 'km', co2: 9.2 },
      { type: 'Waste', value: 3, unit: 'kg', co2: 1.5 },
      { type: 'Flight', value: 800, unit: 'km', co2: 160 }
    ];

    entries.forEach(e => dataService.saveActivity({ type: e.type, value: e.value, unit: e.unit, co2: e.co2 }));

    // Touch localStorage flags used by the UI to trigger refreshes
    localStorage.setItem('calendar-last-updated', Date.now().toString());
    localStorage.setItem('slack-last-updated', Date.now().toString());
  } catch (err) {
    console.error('Failed to add demo data', err);
  }
}

export function clearDemoData() {
  try {
    dataService.clearAllData();
    localStorage.removeItem('calendar-last-updated');
    localStorage.removeItem('slack-last-updated');
  } catch (err) {
    console.error('Failed to clear demo data', err);
  }
}
