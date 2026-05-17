import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'report') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...data.map((row) => String(row[key] ?? '').length)),
  }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToCSV = (data, filename = 'report') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const buildAchievementReport = (goals, achievements, users) => {
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const achievementMap = {};
  achievements.forEach((a) => {
    if (!achievementMap[a.goalId]) achievementMap[a.goalId] = {};
    achievementMap[a.goalId][a.quarter] = a;
  });

  return goals.map((goal) => {
    const emp = userMap[goal.employeeId] || {};
    const achMap = achievementMap[goal.id] || {};
    return {
      'Employee Name': emp.name || '-',
      'Department': emp.department || '-',
      'Thrust Area': goal.thrustArea || '-',
      'Goal Title': goal.title || '-',
      'UoM': goal.uom || '-',
      'Target': goal.target || '-',
      'Weightage (%)': goal.weightage || '-',
      'Goal Status': goal.status || '-',
      'Q1 Achievement': achMap.Q1?.actual ?? '-',
      'Q1 Status': achMap.Q1?.status ?? '-',
      'Q2 Achievement': achMap.Q2?.actual ?? '-',
      'Q2 Status': achMap.Q2?.status ?? '-',
      'Q3 Achievement': achMap.Q3?.actual ?? '-',
      'Q3 Status': achMap.Q3?.status ?? '-',
      'Q4 Achievement': achMap.Q4?.actual ?? '-',
      'Q4 Status': achMap.Q4?.status ?? '-',
    };
  });
};
