const d = new Date();
console.log('Server date:', d.toString());
console.log('Day index:', d.getDay());
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
console.log('Day name:', dayNames[d.getDay()]);
