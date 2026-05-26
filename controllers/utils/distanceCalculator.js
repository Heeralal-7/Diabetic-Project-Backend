// utils/distanceCalculator.js
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Convert coordinates to numbers
  const lat1Num = parseFloat(lat1);
  const lon1Num = parseFloat(lon1);
  const lat2Num = parseFloat(lat2);
  const lon2Num = parseFloat(lon2);

  // Validate coordinates
  if (isNaN(lat1Num) || isNaN(lon1Num) || isNaN(lat2Num) || isNaN(lon2Num)) {
    console.error('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
    return 0; // Return 0 distance for invalid coordinates
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2Num - lat1Num) * Math.PI / 180;
  const dLon = (lon2Num - lon1Num) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Num * Math.PI / 180) * Math.cos(lat2Num * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  console.log('Distance calculated:', {
    from: { lat: lat1Num, lon: lon1Num },
    to: { lat: lat2Num, lon: lon2Num },
    distance: distance.toFixed(2) + ' km'
  });
  
  return distance;
}

function calculateDeliveryCharges(distance, deliverySettings, cartTotal, isRapidDelivery = false) {
  const {
    baseDeliveryCharge = 50,
    freeDeliveryThreshold = 300,
    rapidDeliveryCharge = 100,
    freeDeliveryRadius = 10,
    perKmCharge = 5
  } = deliverySettings;

  let deliveryCharges = 0;
  let baseDelivery = 0;
  let rapidDeliveryFee = 0;
  let extraCharges = 0;
  let extraDistance = 0;
  
  // Calculate distance-based charges regardless of cart total
  if (distance <= freeDeliveryRadius) {
    baseDelivery = baseDeliveryCharge;
    extraCharges = 0;
    extraDistance = 0;
  } else {
    extraDistance = distance - freeDeliveryRadius;
    extraCharges = Math.ceil(extraDistance) * perKmCharge;
    baseDelivery = baseDeliveryCharge + extraCharges;
  }

  // Check if eligible for free delivery based on cart total
  // If free delivery eligible, only charge for extra distance beyond free radius
  if (cartTotal >= freeDeliveryThreshold) {
    // Free delivery applies only to base delivery charge
    // But extra distance charges still apply
    baseDelivery = 0;
    // Keep extraCharges as they are for distance beyond free radius
    deliveryCharges = extraCharges;
  } else {
    // Regular charges apply (base + extra)
    deliveryCharges = baseDelivery;
  }

  // Add rapid delivery charges if applicable (always charged)
  if (isRapidDelivery) {
    rapidDeliveryFee = rapidDeliveryCharge;
  }

  deliveryCharges = deliveryCharges + rapidDeliveryFee;

  console.log('Delivery charges calculation:', {
    distance: distance.toFixed(2),
    freeDeliveryRadius,
    extraDistance: extraDistance.toFixed(2),
    baseDeliveryCharge,
    perKmCharge,
    extraCharges,
    baseDelivery,
    rapidDeliveryFee,
    totalDelivery: deliveryCharges,
    cartTotal,
    freeDeliveryEligible: cartTotal >= freeDeliveryThreshold,
    isRapidDelivery,
    finalBaseDelivery: cartTotal >= freeDeliveryThreshold ? 0 : baseDelivery,
    finalExtraCharges: extraCharges
  });

  return {
    baseDelivery: cartTotal >= freeDeliveryThreshold ? 0 : baseDelivery,
    rapidDeliveryFee: parseFloat(rapidDeliveryFee.toFixed(2)),
    totalDelivery: parseFloat(deliveryCharges.toFixed(2)),
    distance: parseFloat(distance.toFixed(2)),
    freeRadiusUsed: distance <= freeDeliveryRadius,
    extraDistance: parseFloat(extraDistance.toFixed(2)),
    extraCharges: parseFloat(extraCharges.toFixed(2)),
    freeDeliveryEligible: cartTotal >= freeDeliveryThreshold,
    // Add detailed breakdown
    breakdown: {
      baseDeliveryWaived: cartTotal >= freeDeliveryThreshold,
      baseDeliveryOriginal: baseDeliveryCharge,
      extraDistanceCharges: extraCharges,
      rapidDeliveryCharges: rapidDeliveryFee
    }
  };
}

module.exports = {
  calculateDistance,
  calculateDeliveryCharges
};