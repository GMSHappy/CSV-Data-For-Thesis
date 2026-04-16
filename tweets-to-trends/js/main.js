// CSV file paths — files must be in the /data folder
// CleanElon5.csv is an exact duplicate of CleanElon4.csv and is intentionally excluded
var FILES = {
  trump:     'data/CleanTrump2.csv',
  elonFiles: [
    'data/CleanElon.csv',
    'data/CleanElon3.csv',
    'data/CleanElon4.csv',
    'data/CleanElon6.csv'
  ],
  events:    'data/World_Events_200.csv'
};
// Global data arrays — filled when CSVs load
var trumpData    = [];
var elonData     = [];
var eventsData   = [];   // falls back to worldEvents
var dataReady    = false;
var _loadPromise = null; // prevents double-fetching if called twice

// World events list — used for globe markers and side panel
var worldEvents = [
  { date:'2010-01-12', year:2010, event:'Haiti Earthquake',                      category:'Social',     link:'https://en.wikipedia.org/wiki/2010_Haiti_earthquake' },
  { date:'2010-09-01', year:2010, event:'Trump on Celebrity Apprentice Season 10',category:'Political',  link:'https://en.wikipedia.org/wiki/The_Apprentice_(American_TV_series)' },
  { date:'2011-05-02', year:2011, event:'Osama bin Laden killed',                 category:'Political',  link:'https://en.wikipedia.org/wiki/Death_of_Osama_bin_Laden' },
  { date:'2011-12-08', year:2011, event:'SpaceX Dragon first orbital flight',     category:'Technology', link:'https://en.wikipedia.org/wiki/SpaceX_Dragon' },
  { date:'2012-11-06', year:2012, event:'Obama Re-elected President',             category:'Political',  link:'https://en.wikipedia.org/wiki/2012_United_States_presidential_election' },
  { date:'2013-06-05', year:2013, event:'NSA Surveillance Leaks (Snowden)',       category:'Technology', link:'https://en.wikipedia.org/wiki/Edward_Snowden' },
  { date:'2014-03-18', year:2014, event:'Russia Annexes Crimea',                  category:'Political',  link:'https://en.wikipedia.org/wiki/Annexation_of_Crimea_by_Russia' },
  { date:'2015-06-16', year:2015, event:'Trump Announces Presidential Campaign',  category:'Political',  link:'https://en.wikipedia.org/wiki/Donald_Trump_2016_presidential_campaign' },
  { date:'2015-06-26', year:2015, event:'Same-sex marriage legalised in the US',  category:'Social',     link:'https://en.wikipedia.org/wiki/Obergefell_v._Hodges' },
  { date:'2016-07-06', year:2016, event:'Tesla Model 3 Unveiled',                 category:'Technology', link:'https://en.wikipedia.org/wiki/Tesla_Model_3' },
  { date:'2016-11-08', year:2016, event:'Trump Elected President',                category:'Political',  link:'https://en.wikipedia.org/wiki/2016_United_States_presidential_election' },
  { date:'2017-01-20', year:2017, event:'Trump Inauguration',                    category:'Political',  link:'https://en.wikipedia.org/wiki/First_inauguration_of_Donald_Trump' },
  { date:'2018-08-07', year:2018, event:'Musk "Taking Tesla Private" Tweet',      category:'Economic',   link:'https://en.wikipedia.org/wiki/Elon_Musk_SEC_fraud_case' },
  { date:'2019-04-10', year:2019, event:'First Black Hole Image Released',        category:'Technology', link:'https://en.wikipedia.org/wiki/Event_Horizon_Telescope' },
  { date:'2020-01-20', year:2020, event:'COVID-19 First US Case Confirmed',       category:'Social',     link:'https://en.wikipedia.org/wiki/COVID-19_pandemic_in_the_United_States' },
  { date:'2020-11-03', year:2020, event:'Biden Wins US Presidential Election',    category:'Political',  link:'https://en.wikipedia.org/wiki/2020_United_States_presidential_election' },
  { date:'2021-01-06', year:2021, event:'US Capitol Attack',                      category:'Political',  link:'https://en.wikipedia.org/wiki/January_6_United_States_Capitol_attack' },
  { date:'2021-01-08', year:2021, event:'Trump Permanently Banned from Twitter',  category:'Technology', link:'https://en.wikipedia.org/wiki/Censorship_of_Donald_Trump' },
  { date:'2021-05-13', year:2021, event:'Musk Bitcoin Tweet Triggers Price Crash',category:'Economic',   link:'https://en.wikipedia.org/wiki/Cryptocurrency_and_crime' },
  { date:'2022-02-24', year:2022, event:'Russia Invades Ukraine',                 category:'Political',  link:'https://en.wikipedia.org/wiki/Russian_invasion_of_Ukraine' },
  { date:'2022-04-14', year:2022, event:'Musk Offers to Buy Twitter',             category:'Technology', link:'https://en.wikipedia.org/wiki/Acquisition_of_Twitter_by_Elon_Musk' },
  { date:'2022-10-27', year:2022, event:'Musk Completes Twitter Acquisition',     category:'Technology', link:'https://en.wikipedia.org/wiki/Acquisition_of_Twitter_by_Elon_Musk' },
  { date:'2023-03-29', year:2023, event:'Trump First Criminal Indictment',        category:'Political',  link:'https://en.wikipedia.org/wiki/Donald_Trump_criminal_indictments' },
  { date:'2023-07-23', year:2023, event:'Twitter Officially Rebranded to X',     category:'Technology', link:'https://en.wikipedia.org/wiki/Twitter,_Inc.' },
  { date:'2024-07-13', year:2024, event:'Trump Assassination Attempt',            category:'Political',  link:'https://en.wikipedia.org/wiki/Attempted_assassination_of_Donald_Trump_(July_2024)' },
  { date:'2024-11-05', year:2024, event:'Trump Wins 2024 Presidential Election',  category:'Political',  link:'https://en.wikipedia.org/wiki/2024_United_States_presidential_election' },
  { date:'2025-01-20', year:2025, event:'Trump Second Inauguration',              category:'Political',  link:'https://en.wikipedia.org/wiki/Second_inauguration_of_Donald_Trump' },
  { date:'2025-01-21', year:2025, event:'Musk Leads DOGE Government Initiative',  category:'Political',  link:'https://en.wikipedia.org/wiki/Department_of_Government_Efficiency' }
];

function goToGlobe() {
  showScreen('screen-globe');
  if (dataReady) {
    buildGlobe();
  } else {
    loadData().then(function() {
      buildGlobe();
      buildDashboard();
    });
  }
}

function goToDashboard() {
  showScreen('screen-dashboard');
  if (dataReady) buildDashboard();
}

function showScreen(id) {
  var screens = document.querySelectorAll('.screen');
  screens.forEach(function(s) { s.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// Named jumpTo to avoid clashing with the browser's built-in window.scrollTo
function jumpTo(sectionId, btn) {
  var el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  document.querySelectorAll('.nav-lnk').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
}


function parseCSV(raw) {
  var lines = raw.trim().split('\n');
  if (lines.length < 2) return [];

  var headers = splitLine(lines[0]);
  var rows = [];

  for (var i = 1; i < lines.length; i++) {
    var vals = splitLine(lines[i]);
    if (vals.length < 2) continue;
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = (vals[j] || '').trim();
    }
    rows.push(row);
  }
  return rows;
}

function splitLine(line) {
  var result = [];
  var current = '';
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


// Normalise a single elon row so all files share the same field names
function normaliseElonRow(r) {
  // 'retweet' (singular, CleanElon.csv) → 'retweets'
  if (r.retweet !== undefined && r.retweets === undefined) {
    r.retweets = r.retweet;
    delete r.retweet;
  }
  // 'Retweets' (capital, CleanElon3/4/6) → 'retweets'
  if (r['Retweets'] !== undefined) {
    r.retweets = r['Retweets'];
    delete r['Retweets'];
  }
  // 'favorite' (singular, CleanElon3/4/6) → 'favorites'
  if (r.favorite !== undefined && r.favorites === undefined) {
    r.favorites = r.favorite;
    delete r.favorite;
  }
  // Remove commas from numeric strings  e.g. "5,133" → "5133"
  if (r.retweets)  r.retweets  = String(r.retweets).replace(/,/g,  '');
  if (r.favorites) r.favorites = String(r.favorites).replace(/,/g, '');
  // Strip trailing engagement triplet that CleanElon3 appends to tweet text
  // e.g. "Cool tweet 513 2,050 9,966" → "Cool tweet"
  r.text = (r.text || '').replace(/\s+[\d,]+\s+[\d,]+[\s\d,K]+\s*$/, '').trim();
  return r;
}

function loadData() {
  if (_loadPromise) return _loadPromise;   // reuse in-flight request
  // Fetch trump + all four unique elon files in parallel
  var elonFetches = FILES.elonFiles.map(function(path) {
    return fetch(path)
      .then(function(r) { return r.ok ? r.text() : null; })
      .catch(function() { return null; });
  });

  _loadPromise = Promise.all([
    fetch(FILES.trump).then(function(r) { return r.text(); }),
    Promise.all(elonFetches),
    fetch(FILES.events).then(function(r) { return r.ok ? r.text() : null; }).catch(function() { return null; })
  ]).then(function(results) {
    var trumpText  = results[0];
    var elonTexts  = results[1];   // array of 4 nullable strings
    var eventsText = results[2];

    // --- Trump ---
    trumpData = parseCSV(trumpText).filter(function(r) { return r.created_at && r.text && r.text.trim().length > 2; });

    // --- Elon: merge all files, normalise columns, deduplicate ---
    var elonAll = [];
    elonTexts.forEach(function(text) {
      if (!text) return;
      var rows = parseCSV(text).filter(function(r) { return r.created_at && r.text && r.text.trim().length > 2; });
      rows.forEach(normaliseElonRow);
      elonAll = elonAll.concat(rows);
    });

    // Deduplicate on (created_at + first 40 chars of text)
    var seen = Object.create(null);
    elonData = elonAll.filter(function(r) {
      var key = (r.created_at || '').substring(0, 19) + '|' + (r.text || '').substring(0, 40);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });

    // --- Events: load from CSV (has real lat/lon), fall back to hardcoded list ---
    if (eventsText) {
      var parsedEvents = parseCSV(eventsText).filter(function(r) { return r['Date'] && r['Event Description']; });
      parsedEvents.forEach(function(e) {
        e.date     = e['Date']              || '';
        e.year     = parseInt(e['Year'])    || parseInt((e['Date'] || '').substring(0, 4));
        e.event    = e['Event Description'] || '';
        e.category = e['Category']          || 'Other';
        e.lat      = parseFloat(e['lat'])   || 0;
        e.lon      = parseFloat(e['lon'])   || 0;
        e.link     = '';
      });
      eventsData = parsedEvents.filter(function(e) { return e.date && e.event; });
      console.log('Events loaded from CSV:', eventsData.length);
    } else {
      eventsData = worldEvents;
      console.warn('World_Events_200.csv not found — using built-in list');
    }

    // --- Performance sampling ---
    // Target ≤ 12 000 rows per person so charts remain responsive.
    // We first pull out the top-retweeted tweets so the Viral section
    // still shows the real viral content even after sampling.
    var MAX_ROWS = 12000;

    function sampleWithTopTweets(data) {
      if (data.length <= MAX_ROWS) return data;
      // Sort by retweet count desc, grab the top 300 viral tweets
      var sorted  = data.slice().sort(function(a, b) { return (parseFloat(b.retweets) || 0) - (parseFloat(a.retweets) || 0); });
      var topTweets = sorted.slice(0, 300);
      // Even sample from the full dataset for chart coverage
      var step    = Math.ceil(data.length / (MAX_ROWS - 300));
      var sampled = data.filter(function(_, i) { return i % step === 0; });
      // Merge and re-deduplicate
      var merged  = topTweets.concat(sampled);
      var seenKey = Object.create(null);
      return merged.filter(function(r) {
        var k = (r.created_at || '').substring(0, 19) + '|' + (r.text || '').substring(0, 40);
        if (seenKey[k]) return false;
        seenKey[k] = true;
        return true;
      });
    }

    trumpData = sampleWithTopTweets(trumpData);
    elonData  = sampleWithTopTweets(elonData);

    dataReady = true;
    console.log('Loaded — Trump:', trumpData.length, '| Elon:', elonData.length);

    animateCount('ctr-trump', trumpData.length);
    animateCount('ctr-elon',  elonData.length);

  }).catch(function(err) {
    console.error('Failed to load CSV data:', err);
    eventsData = worldEvents;
    dataReady  = true;
  });
  return _loadPromise;
}

// Animate a number counting up
function animateCount(elId, target) {
  var el = document.getElementById(elId);
  if (!el) return;
  var duration = 2000;
  var start = performance.now();
  function step(now) {
    var p = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(p * target).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function fmtNum(n) {
  n = parseFloat(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

// Extract just the year from a created_at string
function getYear(row) {
  return row.created_at ? row.created_at.substring(0, 4) : null;
}

// Extract just the month (YYYY-MM) from a created_at string
function getMonth(row) {
  return row.created_at ? row.created_at.substring(0, 7) : null;
}

// Extract hour of day (0-23)
function getHour(row) {
  if (!row.created_at) return null;
  var str = row.created_at;
  var timePart = str.indexOf('T') !== -1 ? str.split('T')[1] : str.split(' ')[1];
  if (!timePart) return null;
  var h = parseInt(timePart.split(':')[0]);
  return isNaN(h) ? null : h;
}

// Extract day of week
function getDayOfWeek(row) {
  if (!row.created_at) return null;
  var d = new Date(row.created_at.substring(0, 10));
  return isNaN(d.getTime()) ? null : d.getDay();
}

// Group an array 
function groupBy(data, keyFn) {
  var out = {};
  data.forEach(function(row) {
    var key = keyFn(row);
    if (key !== null && key !== undefined) {
      if (!out[key]) out[key] = [];
      out[key].push(row);
    }
  });
  return out;
}

function avgField(rows, field) {
  if (!rows || rows.length === 0) return 0;
  var total = 0;
  var count = 0;
  rows.forEach(function(r) {
    var v = parseFloat(r[field]);
    if (!isNaN(v)) { total += v; count++; }
  });
  return count > 0 ? total / count : 0;
}

// Find the year with the highest tweet count
function peakYear(data) {
  var byYear = groupBy(data, getYear);
  var best = null, max = 0;
  Object.keys(byYear).forEach(function(yr) {
    if (byYear[yr].length > max) { max = byYear[yr].length; best = yr; }
  });
  return best || '—';
}

// Safely set text content of an element
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}


function buildStars() {
  var container = document.getElementById('stars');
  if (!container) return;
  for (var i = 0; i < 200; i++) {
    var s = document.createElement('div');
    s.className = 'star';
    var size = Math.random() * 2.5 + 0.4;
    s.style.cssText =
      'width:'  + size + 'px;' +
      'height:' + size + 'px;' +
      'top:'    + Math.random() * 100 + '%;' +
      'left:'   + Math.random() * 100 + '%;' +
      '--dur:'  + (Math.random() * 3 + 2).toFixed(1) + 's;' +
      'animation-delay:' + (Math.random() * 4).toFixed(1) + 's;';
    container.appendChild(s);
  }
}

// Run star field and kick off data loading as soon as the page loads
buildStars();
loadData();
