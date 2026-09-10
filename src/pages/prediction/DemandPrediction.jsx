import React from 'react';
import MedicineDemandPrediction from './MedicineDemandPrediction';

/**
 * Demand Prediction Page.
 * Routes to the medicine demand prediction pipeline:
 * React -> Spring Boot (/api/predictions/medicine-demand) -> FastAPI ML (:8001) -> Random Forest v2
 */
const DemandPrediction = () => {
  return <MedicineDemandPrediction />;
};

export default DemandPrediction;