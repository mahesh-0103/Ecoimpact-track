import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  Car, 
  Plane, 
  Zap, 
  Home, 
  Trash2, 
  Leaf,
  TrendingUp,
  Save
} from 'lucide-react';
import { dataService, ActivityData } from '../services/dataService';
import BackNavigation from '../components/BackNavigation';

// Remove local interface since we're importing from dataService

const CalculatorPage = () => {
  const [formData, setFormData] = useState({
    // Travel
    carMiles: '',
    planeMiles: '',
    // Home Energy
    electricity: '',
    gas: '',
    // Other
    waste: '',
  });

  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [totalFootprint, setTotalFootprint] = useState(0);

  // Load activities on component mount
  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = () => {
    const storedActivities = dataService.getActivities();
    setActivities(storedActivities);
    const total = storedActivities.reduce((sum, activity) => sum + activity.co2, 0);
    setTotalFootprint(total);
  };

  // Emission factors (kg CO2e per unit)
  const emissionFactors = {
    car: 0.411, // kg CO2e per mile
    plane: 0.255, // kg CO2e per mile
    electricity: 0.0004, // kg CO2e per kWh
    gas: 0.0053, // kg CO2e per cubic foot
    waste: 0.001, // kg CO2e per kg of waste
  };

  const calculateFootprint = (type: string, value: number): number => {
    const factor = emissionFactors[type as keyof typeof emissionFactors] || 0;
    return value * factor;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogActivity = (type: string, value: number, unit: string) => {
    if (value <= 0) return;

    const co2 = calculateFootprint(type, value);
    
    // Save to data service
    const newActivity = dataService.saveActivity({
      type,
      value,
      unit,
      co2,
    });

    // Update local state
    setActivities(prev => [newActivity, ...prev]);
    setTotalFootprint(prev => prev + co2);
    
    // Reset the corresponding form field
    const fieldMap: { [key: string]: string } = {
      car: 'carMiles',
      plane: 'planeMiles',
      electricity: 'electricity',
      gas: 'gas',
      waste: 'waste',
    };
    
    const fieldToReset = fieldMap[type];
    if (fieldToReset) {
      setFormData(prev => ({ ...prev, [fieldToReset]: '' }));
    }

    console.log('Activity logged:', newActivity);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car className="w-4 h-4" />;
      case 'plane': return <Plane className="w-4 h-4" />;
      case 'electricity': return <Zap className="w-4 h-4" />;
      case 'gas': return <Home className="w-4 h-4" />;
      case 'waste': return <Trash2 className="w-4 h-4" />;
      default: return <Leaf className="w-4 h-4" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'car': return 'Car Travel';
      case 'plane': return 'Flight';
      case 'electricity': return 'Electricity';
      case 'gas': return 'Natural Gas';
      case 'waste': return 'Waste';
      default: return type;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Navigation */}
      <BackNavigation />
      
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-terra-primary mb-4 flex items-center justify-center space-x-3">
          <Calculator className="w-10 h-10 text-terra-accent" />
          <span>Carbon Footprint Calculator</span>
        </h1>
        <p className="text-xl text-terra-secondary max-w-3xl mx-auto">
          Calculate your carbon footprint by logging daily activities. Track your environmental impact and work towards a more sustainable lifestyle.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calculator Forms */}
        <div className="space-y-8">
          {/* Travel Section */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
              <Car className="w-6 h-6 text-terra-accent" />
              <span>Travel</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="car-miles" className="block text-terra-primary font-medium mb-2">
                  Car Travel (miles)
                </label>
                <div className="flex space-x-2">
                  <input
                    id="car-miles"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.carMiles}
                    onChange={(e) => handleInputChange('carMiles', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                    placeholder="Enter miles driven"
                  />
                  <button
                    onClick={() => handleLogActivity('car', parseFloat(formData.carMiles) || 0, 'miles')}
                    disabled={!formData.carMiles || parseFloat(formData.carMiles) <= 0}
                    className="px-6 py-3 bg-terra-accent hover:bg-terra-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-terra-dark font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Log</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="plane-miles" className="block text-terra-primary font-medium mb-2">
                  Flight Distance (miles)
                </label>
                <div className="flex space-x-2">
                  <input
                    id="plane-miles"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.planeMiles}
                    onChange={(e) => handleInputChange('planeMiles', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                    placeholder="Enter flight miles"
                  />
                  <button
                    onClick={() => handleLogActivity('plane', parseFloat(formData.planeMiles) || 0, 'miles')}
                    disabled={!formData.planeMiles || parseFloat(formData.planeMiles) <= 0}
                    className="px-6 py-3 bg-terra-accent hover:bg-terra-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-terra-dark font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Log</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Home Energy Section */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
              <Home className="w-6 h-6 text-terra-accent" />
              <span>Home Energy</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="electricity" className="block text-terra-primary font-medium mb-2">
                  Electricity Usage (kWh)
                </label>
                <div className="flex space-x-2">
                  <input
                    id="electricity"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.electricity}
                    onChange={(e) => handleInputChange('electricity', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                    placeholder="Enter kWh used"
                  />
                  <button
                    onClick={() => handleLogActivity('electricity', parseFloat(formData.electricity) || 0, 'kWh')}
                    disabled={!formData.electricity || parseFloat(formData.electricity) <= 0}
                    className="px-6 py-3 bg-terra-accent hover:bg-terra-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-terra-dark font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Log</span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="gas" className="block text-terra-primary font-medium mb-2">
                  Natural Gas Usage (cubic feet)
                </label>
                <div className="flex space-x-2">
                  <input
                    id="gas"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.gas}
                    onChange={(e) => handleInputChange('gas', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                    placeholder="Enter cubic feet used"
                  />
                  <button
                    onClick={() => handleLogActivity('gas', parseFloat(formData.gas) || 0, 'cubic feet')}
                    disabled={!formData.gas || parseFloat(formData.gas) <= 0}
                    className="px-6 py-3 bg-terra-accent hover:bg-terra-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-terra-dark font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Log</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Waste Section */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
              <Trash2 className="w-6 h-6 text-terra-accent" />
              <span>Waste</span>
            </h3>
            
            <div>
              <label htmlFor="waste" className="block text-terra-primary font-medium mb-2">
                Waste Generated (kg)
              </label>
              <div className="flex space-x-2">
              <input
                id="waste"
                type="number"
                min="0"
                step="0.1"
                value={formData.waste}
                onChange={(e) => handleInputChange('waste', e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-terra-darker/50 border border-terra-panel-light/30 text-terra-primary placeholder-terra-secondary/50 focus:border-terra-accent focus:outline-none transition-colors duration-300"
                placeholder="Enter waste generated"
              />
                <button
                  onClick={() => handleLogActivity('waste', parseFloat(formData.waste) || 0, 'kg')}
                  disabled={!formData.waste || parseFloat(formData.waste) <= 0}
                  className="px-6 py-3 bg-terra-accent hover:bg-terra-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-terra-dark font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Log</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Results and Activity History */}
        <div className="space-y-8">
          {/* Total Footprint */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-terra-primary mb-6 flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-terra-accent" />
              <span>Total Footprint</span>
            </h3>
            
            <div className="text-center">
              <div className="text-5xl font-bold text-terra-accent mb-2">
                {totalFootprint.toFixed(2)}
              </div>
              <div className="text-xl text-terra-secondary mb-4">
                kg CO₂e
              </div>
              <div className="text-sm text-terra-secondary">
                Equivalent to {Math.ceil(totalFootprint / 22)} trees needed to offset
              </div>
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="backdrop-blur-md bg-terra-panel/30 border border-terra-panel-light/50 rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-terra-primary mb-6">
              Recent Activities
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-terra-darker/50 rounded-lg border border-terra-panel-light/30"
                  >
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <div className="text-terra-primary font-medium">
                          {getActivityLabel(activity.type)}
                        </div>
                        <div className="text-sm text-terra-secondary">
                          {activity.value} {activity.unit}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-terra-accent font-semibold">
                        {activity.co2.toFixed(2)} kg CO₂e
                      </div>
                      <div className="text-xs text-terra-secondary">
                        {activity.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-terra-secondary">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No activities logged yet</p>
                  <p className="text-sm">Start logging your activities above</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
