
var trumpData  = [];
var elonData   = [];
var eventsData = [];
var dataReady  = false;

var FILES = {
  trump:  'data/CleanTrump2.csv',
  elon:   'data/CleanElon.csv',
  events: 'data/World_Events_200.csv'
};

function parseCSV(rawText) {
  var lines   = rawText.trim().split('\n');
  var headers = splitCSVLine(lines[0]);
  var rows    = [];

  for (var i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    var values = splitCSVLine(lines[i]);
    var row    = {};

    for (var j = 0; j < headers.length; j++) {
      var key = headers[j].trim().replace(/"/g, '').toLowerCase();
      row[key] = (values[j] || '').trim().replace(/^"|"$/g, '');
    }

    rows.push(row);
  }

  return rows;
}


// Splits a CSV line properly — handles quoted commas
function splitCSVLine(line) {
  var result   = [];
  var current  = '';
  var inQuotes = false;

  for (var i = 0; i < line.length; i++) {
    var ch = line[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  result.push(current);
  return result;
}


function loadData(callback) {

  var loaded = 0;
  var total  = 3;

  function done() {
    loaded++;
    if (loaded === total) {
      dataReady = true;
      if (callback) callback();
    }
  }

  // Load Trump tweets
  fetchFile(FILES.trump, function(text) {
    if (text) {
      var rows = parseCSV(text);
      trumpData = rows.filter(function(r) {
        return r.created_at && r.text && r.text.length > 2;
      });
      console.log('Trump rows loaded:', trumpData.length);
    } else {
      console.error('Trump CSV not found:', FILES.trump);
    }
    done();
  });

  // Load Elon tweets
  fetchFile(FILES.elon, function(text) {
    if (text) {
      var rows = parseCSV(text);
      elonData = rows.filter(function(r) {
        return r.created_at && r.text && r.text.length > 2;
      });
      console.log('Elon rows loaded:', elonData.length);
    } else {
      console.error('Elon CSV not found:', FILES.elon);
    }
    done();
  });

  // Load world events
  fetchFile(FILES.events, function(text) {
    if (text) {
      var rows = parseCSV(text);
      eventsData = rows.filter(function(r) { return r.date; });
      // Make sure year is a number
      eventsData.forEach(function(e) {
        e.year = parseInt(e.year || e.date.substring(0, 4));
      });
      console.log('Events loaded:', eventsData.length);
    } else {
      console.error('Events CSV not found:', FILES.events);
    }
    done();
  });
}

function fetchFile(path, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', path, true);
  xhr.onload = function() {
    if (xhr.status === 200 || xhr.status === 0) {
      callback(xhr.responseText);
    } else {
      callback(null);
    }
  };
  xhr.onerror = function() { callback(null); };
  xhr.send();
}

function pad(n) { return n < 10 ? '0' + n : String(n); }

// Extract just the year from a created_at string
function getYear(row) {
  if (!row.created_at) return null;
  return row.created_at.substring(0, 4);
}

// Extract year-month e.g. "2022-03"
function getMonth(row) {
  if (!row.created_at) return null;
  return row.created_at.substring(0, 7);
}

// Extract hour of day as a number 0-23
function getHour(row) {
  if (!row.created_at) return null;
  var timePart = row.created_at.split(' ')[1];
  if (!timePart) return null;
  var h = parseInt(timePart.split(':')[0]);
  return isNaN(h) ? null : h;
}

// Get day of week 0=Sunday 6=Saturday
function getDayOfWeek(row) {
  if (!row.created_at) return null;
  var d = new Date(row.created_at);
  var day = d.getDay();
  return isNaN(day) ? null : day;
}

// Group an array by a key function — returns an object
function groupBy(data, keyFn) {
  var result = {};
  for (var i = 0; i < data.length; i++) {
    var key = keyFn(data[i]);
    if (key === null || key === undefined) continue;
    if (!result[key]) result[key] = [];
    result[key].push(data[i]);
  }
  return result;
}

// Average a numeric field across an array of rows
function average(rows, field) {
  if (!rows || rows.length === 0) return 0;
  var total = 0;
  var count = 0;
  for (var i = 0; i < rows.length; i++) {
    var val = parseFloat(rows[i][field]);
    if (!isNaN(val)) {
      total += val;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

// Format a large number nicely — 1500 becomes "1.5K"
function fmtNum(n) {
  n = Math.round(n);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

// Find the year with the most tweets
function peakYear(data) {
  var byYear = groupBy(data, getYear);
  var best   = null;
  var max    = 0;
  Object.keys(byYear).forEach(function(y) {
    if (byYear[y].length > max) {
      max  = byYear[y].length;
      best = y;
    }
  });
  return best || '—';
}
