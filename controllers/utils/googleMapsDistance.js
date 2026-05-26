// utils/googleMapsDistance.js
const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAX_BATCH_SIZE = 25; // Google Maps Distance Matrix API maximum batch size

/**
 * Calculate on-road distance using Google Maps Distance Matrix API for single origin-destination
 */
const calculateOnRoadDistance = async (originLat, originLng, destLat, destLng) => {
  // 🔥 DEBUG LOG ADDED HERE
  console.log("\n🔥🔥 CONSOLE FROM FUNCTION: calculateOnRoadDistance HIT! 🔥🔥");
    // console.trace("🕵️ WHO CALLED ME?"); 

  console.log(`   📍 Input Coords: Origin(${originLat}, ${originLng}) -> Dest(${destLat}, ${destLng})`);

  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.log("   ❌ Missing API Key");
      throw new Error('Google Maps API key not configured');
    }

    const origin = `${originLat},${originLng}`;
    const destination = `${destLat},${destLng}`;

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: origin,
        destinations: destination,
        key: GOOGLE_MAPS_API_KEY,
        units: 'metric' // For kilometers
      }
    });

    const data = response.data;

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    const element = data.rows[0]?.elements[0];
    
    if (!element || element.status !== 'OK') {
      throw new Error(`Could not calculate distance: ${element?.status || 'No data'}`);
    }

    console.log("   ✅ Google Maps API Success");
    
    return {
      distance: element.distance.value / 1000, // Convert meters to kilometers
      distanceText: element.distance.text,
      duration: element.duration.value / 60, // Convert seconds to minutes
      durationText: element.duration.text,
      status: 'OK'
    };
  } catch (error) {
    console.error('   ❌ Google Maps Distance Matrix API error:', error.message);
    
    // Fallback to straight-line distance if API fails
    const straightLineDistance = calculateStraightLineDistance(originLat, originLng, destLat, destLng);
    
    return {
      distance: straightLineDistance,
      distanceText: `${straightLineDistance.toFixed(1)} km (approx)`,
      duration: null,
      durationText: null,
      status: 'FALLBACK',
      error: error.message
    };
  }
};

/**
 * Batch calculate on-road distances for multiple destinations from a single origin
 */
const calculateBatchOnRoadDistance = async (origin, destinations) => {
  // 🔥 DEBUG LOG ADDED HERE
  console.log("\n🔥🔥 CONSOLE FROM FUNCTION: calculateBatchOnRoadDistance HIT! 🔥🔥");

  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    if (!origin || !origin.latitude || !origin.longitude) {
      throw new Error('Valid origin coordinates required');
    }

    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      throw new Error('Destinations array required');
    }

    const originStr = `${origin.latitude},${origin.longitude}`;
    
    const batches = [];
    for (let i = 0; i < destinations.length; i += MAX_BATCH_SIZE) {
      batches.push(destinations.slice(i, i + MAX_BATCH_SIZE));
    }

    const allResults = {};
    
    for (const batch of batches) {
      const destinationsStr = batch.map(dest => `${dest.latitude},${dest.longitude}`).join('|');
      
      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: originStr,
          destinations: destinationsStr,
          key: GOOGLE_MAPS_API_KEY,
          units: 'metric'
        }
      });

      const data = response.data;

      if (data.status !== 'OK') {
        console.error('Google Maps Batch API error:', data.status);
        await processBatchFallback(origin, batch, allResults);
        continue;
      }

      const row = data.rows[0];
      if (row && row.elements) {
        row.elements.forEach((element, index) => {
          const dest = batch[index];
          if (!dest || !dest.id) return;

          if (element.status === 'OK') {
            allResults[dest.id] = {
              distance: element.distance.value / 1000,
              distanceText: element.distance.text,
              duration: element.duration.value / 60,
              durationText: element.duration.text,
              status: 'OK'
            };
          } else {
            const straightLineDistance = calculateStraightLineDistance(
              origin.latitude, origin.longitude,
              dest.latitude, dest.longitude
            );
            
            allResults[dest.id] = {
              distance: straightLineDistance,
              distanceText: `${straightLineDistance.toFixed(1)} km (approx)`,
              duration: null,
              durationText: null,
              status: 'FALLBACK',
              error: `API status: ${element.status}`
            };
          }
        });
      }
    }

    return allResults;
  } catch (error) {
    console.error('Google Maps Batch Distance Matrix API error:', error.message);
    return await processAllFallback(origin, destinations);
  }
};

/**
 * Fallback processing for a batch when batch API fails
 */
const processBatchFallback = async (origin, batch, resultsMap) => {
  for (const dest of batch) {
    try {
      const distanceData = await calculateOnRoadDistance(
        origin.latitude, origin.longitude,
        dest.latitude, dest.longitude
      );
      
      resultsMap[dest.id] = distanceData;
    } catch (error) {
      console.error(`Fallback failed for destination ${dest.id}:`, error.message);
      const straightLineDistance = calculateStraightLineDistance(
        origin.latitude, origin.longitude,
        dest.latitude, dest.longitude
      );
      
      resultsMap[dest.id] = {
        distance: straightLineDistance,
        distanceText: `${straightLineDistance.toFixed(1)} km (approx)`,
        duration: null,
        durationText: null,
        status: 'FALLBACK',
        error: error.message
      };
    }
  }
};

/**
 * Fallback processing for all destinations
 */
const processAllFallback = async (origin, destinations) => {
  const results = {};
  
  for (const dest of destinations) {
    const straightLineDistance = calculateStraightLineDistance(
      origin.latitude, origin.longitude,
      dest.latitude, dest.longitude
    );
    
    results[dest.id] = {
      distance: straightLineDistance,
      distanceText: `${straightLineDistance.toFixed(1)} km (approx)`,
      duration: null,
      durationText: null,
      status: 'FALLBACK',
      error: 'Batch API failed, using straight-line distance'
    };
  }
  
  return results;
};

/**
 * Fallback straight-line distance calculation (Haversine formula)
 */
const calculateStraightLineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = {
  calculateOnRoadDistance,
  calculateBatchOnRoadDistance,
  calculateStraightLineDistance
};