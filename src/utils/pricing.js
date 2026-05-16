'use strict';

function calculateMinimumSellPrice(costPrice, marginPercentage) {
  return Math.round(costPrice * (1 + marginPercentage / 100) * 100) / 100;
}

module.exports = { calculateMinimumSellPrice };
