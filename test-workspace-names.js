// Test workspace name detection
console.log('Testing workspace name detection:\n');

const names = [
  'Builders & Contractors',
  'My Builder Workspace',
  'Construction Contractor',
  'General Workspace',
  'builder project',
  'CONTRACTOR JOBS',
  'Home Builder',
  'Contractor Management'
];

names.forEach(name => {
  const isBuilder = name.toLowerCase().includes('builder') || name.toLowerCase().includes('contractor');
  console.log(`  '${name}' -> ${isBuilder ? '✓ Shows Invoice & Whiteboard tabs' : '✗ No special tabs'}`);
});

console.log('\n✓ = Will show Invoice and Whiteboard tabs');
console.log('✗ = Only shows standard tabs (Kanban, List, Calendar, Timeline)');
