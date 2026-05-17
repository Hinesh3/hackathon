/**
 * Scoring utilities for different UoM types
 */

export const computeScore = (uom, target, actual) => {
  if (actual === null || actual === undefined || actual === '') return null;
  const t = parseFloat(target);
  const a = parseFloat(actual);
  if (isNaN(t) || isNaN(a)) return null;

  switch (uom) {
    case 'numeric_min':
    case 'percentage_min':
      // Higher is better: Achievement ÷ Target
      return t > 0 ? Math.min((a / t) * 100, 100) : 0;

    case 'numeric_max':
    case 'percentage_max':
      // Lower is better: Target ÷ Achievement
      return a > 0 ? Math.min((t / a) * 100, 100) : 100;

    case 'zero':
      // Zero = success
      return a === 0 ? 100 : 0;

    case 'timeline':
      // Handled separately with dates
      return null;

    default:
      return null;
  }
};

export const computeTimelineScore = (targetDate, completionDate) => {
  if (!targetDate || !completionDate) return null;
  const target = new Date(targetDate);
  const completion = new Date(completionDate);
  // On time or early = 100%, late = proportional penalty
  if (completion <= target) return 100;
  const delay = (completion - target) / (1000 * 60 * 60 * 24); // days late
  return Math.max(0, 100 - delay * 2); // 2% per day late
};

export const computeWeightedScore = (goals, achievements) => {
  let totalWeightage = 0;
  let weightedSum = 0;

  goals.forEach((goal) => {
    const goalAchievements = achievements.filter((a) => a.goalId === goal.id);
    const latestAchievement = goalAchievements[goalAchievements.length - 1];
    if (!latestAchievement) return;

    let score = 0;
    if (goal.uom === 'timeline') {
      score = computeTimelineScore(goal.target, latestAchievement.actual) ?? 0;
    } else {
      score = computeScore(goal.uom, goal.target, latestAchievement.actual) ?? 0;
    }

    totalWeightage += goal.weightage;
    weightedSum += score * (goal.weightage / 100);
  });

  return totalWeightage > 0 ? Math.round(weightedSum) : 0;
};

export const getScoreColor = (score) => {
  if (score === null) return '#64748b';
  if (score >= 90) return '#10B981';
  if (score >= 70) return '#F5A623';
  if (score >= 50) return '#F59E0B';
  return '#F43F5E';
};

export const getStatusBadgeClass = (status) => {
  const map = {
    draft: 'badge-gray',
    submitted: 'badge-blue',
    approved: 'badge-green',
    returned: 'badge-red',
    not_started: 'badge-gray',
    on_track: 'badge-blue',
    completed: 'badge-green',
  };
  return map[status] || 'badge-gray';
};

export const getStatusLabel = (status) => {
  const map = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    returned: 'Returned',
    not_started: 'Not Started',
    on_track: 'On Track',
    completed: 'Completed',
  };
  return map[status] || status;
};
