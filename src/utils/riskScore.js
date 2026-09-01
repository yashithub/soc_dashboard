import { SEVERITY, THREAT_TYPE } from '../constants/threatModel.js'

/**
 * Calculates a determinisic risk score from 0-100 for a network flow.
 * Note: This is a dashboard-derived demo metric. In a real system, the ML model
 * would output the risk score directly.
 * 
 * Factors:
 * - Severity base points
 * - ML Confidence multiplier
 * - Threat Type weight
 * - Traffic volume modifier
 */
export function calculateRiskScore(severity, confidence, threatType, bytes) {
  let baseScore = 0;
  
  switch (severity) {
    case SEVERITY.CRITICAL:
      baseScore = 80;
      break;
    case SEVERITY.HIGH:
      baseScore = 60;
      break;
    case SEVERITY.MEDIUM:
      baseScore = 40;
      break;
    case SEVERITY.LOW:
      baseScore = 20;
      break;
    default:
      baseScore = 10;
  }

  // Factor in ML Confidence (scale base score by confidence percentage)
  let score = baseScore * (confidence / 100);

  // Add threat-specific modifiers
  if (threatType === THREAT_TYPE.DATA_EXFILTRATION) {
      score += 10;
  } else if (threatType === THREAT_TYPE.DDOS) {
      score += 5;
  } else if (threatType === THREAT_TYPE.C2_BEACONING) {
      score += 5;
  }

  // Volume modifier (very high traffic bumps score slightly)
  if (bytes > 100000000) { // > 100MB
    score += 5;
  }

  // Clamp between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return Math.round(score);
}
