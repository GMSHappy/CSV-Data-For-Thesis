var globeSpinning   = true;
var spinInterval    = null;
var globeAngle      = -30;  // current longitude rotation
var _ownRelayout    = false; // true while we are the ones calling Plotly.relayout

// Real known base-of-operations per year for Trump and Elon.
// Small per-year offset (index * 0.18) prevents dots piling exactly on top of each other.
var trumpBases = {
  '2010':{lat:40.758,lon:-73.985}, '2011':{lat:40.758,lon:-73.985},
  '2012':{lat:40.758,lon:-73.985}, '2013':{lat:40.758,lon:-73.985},
  '2014':{lat:40.758,lon:-73.985}, '2015':{lat:40.758,lon:-73.985},
  '2016':{lat:40.758,lon:-73.985},                // Trump Tower, NYC (campaign)
  '2017':{lat:38.897,lon:-77.036}, '2018':{lat:38.897,lon:-77.036},
  '2019':{lat:38.897,lon:-77.036}, '2020':{lat:38.897,lon:-77.036}, // White House
  '2021':{lat:26.683,lon:-80.036}, '2022':{lat:26.683,lon:-80.036},
  '2023':{lat:26.683,lon:-80.036}, '2024':{lat:26.683,lon:-80.036}, // Mar-a-Lago, FL
  '2025':{lat:38.897,lon:-77.036}                                    // White House again
};

var elonBases = {
  '2010':{lat:37.386,lon:-122.084}, '2011':{lat:37.386,lon:-122.084},
  '2012':{lat:37.386,lon:-122.084}, '2013':{lat:37.386,lon:-122.084},
  '2014':{lat:37.386,lon:-122.084},                // Palo Alto / Tesla HQ
  '2015':{lat:33.920,lon:-118.328}, '2016':{lat:33.920,lon:-118.328},
  '2017':{lat:33.920,lon:-118.328}, '2018':{lat:33.920,lon:-118.328}, // SpaceX HQ, Hawthorne LA
  '2019':{lat:26.018,lon:-97.158},  '2020':{lat:26.018,lon:-97.158},  // Boca Chica / Starbase TX
  '2021':{lat:30.267,lon:-97.743},  // Austin TX (Tesla relocated)
  '2022':{lat:37.775,lon:-122.419}, // San Francisco (Twitter acquisition)
  '2023':{lat:30.267,lon:-97.743},  // Austin TX
  '2024':{lat:30.267,lon:-97.743},  // Austin TX
  '2025':{lat:38.897,lon:-77.036}   // Washington DC (DOGE)
};

// Escape HTML special characters in CSV-sourced strings to prevent XSS
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Returns the active events list — always prefer the CSV (has 200+ real events with lat/lon)
function getActiveEvents() {
  return (typeof eventsData !== 'undefined' && eventsData.length > 0)
    ? eventsData
    : worldEvents;
}

// Human-readable location label for tooltip
function locationLabel(person, year) {
  if (person === 'trump') {
    var y = parseInt(year);
    if (y <= 2016) return 'Trump Tower, New York City';
    if (y <= 2020) return 'The White House, Washington D.C.';
    if (y <= 2024) return 'Mar-a-Lago, Palm Beach FL';
    return 'The White House, Washington D.C.';
  }
  if (person === 'elon') {
    var y = parseInt(year);
    if (y <= 2014) return 'Tesla HQ, Palo Alto CA';
    if (y <= 2018) return 'SpaceX HQ, Hawthorne CA';
    if (y <= 2020) return 'Starbase, Boca Chica TX';
    if (y === 2021) return 'Austin, Texas';
    if (y === 2022) return 'Twitter/X HQ, San Francisco CA';
    if (y <= 2024) return 'Austin, Texas';
    return 'Washington D.C. (DOGE)';
  }
  return '';
}

function buildGlobe() {
  var elonByYear  = groupBy(elonData,  getYear);
  var trumpByYear = groupBy(trumpData, getYear);

  var years = [];
  var allKeys = Object.keys(elonByYear).concat(Object.keys(trumpByYear));
  allKeys.forEach(function(y) {
    if (years.indexOf(y) === -1) years.push(y);
  });
  years.sort();

  // -- Elon Musk: one dot per year at his real known base of operations --
  var eLats  = years.map(function(y, i) {
    var base = elonBases[y] || {lat:30.267, lon:-97.743};
    return base.lat + (i % 3 - 1) * 0.22; // tiny offset so dots don't stack
  });
  var eLons  = years.map(function(y, i) {
    var base = elonBases[y] || {lat:30.267, lon:-97.743};
    return base.lon + (i % 3 - 1) * 0.22;
  });
  var eSizes = years.map(function(y) {
    var n = (elonByYear[y] || []).length;
    return Math.min(35, Math.max(6, n / 40));
  });
  var eText  = years.map(function(y) {
    var n   = (elonByYear[y]  || []).length;
    var rt  = avgField(elonByYear[y]  || [], 'retweets');
    var base = elonBases[y];
    var loc  = base ? locationLabel('elon', y) : 'Unknown';
    return '<b>Elon Musk \u2014 ' + y + '</b><br>Base: ' + loc + '<br>Tweets: ' + n.toLocaleString() + '<br>Avg Retweets: ' + fmtNum(rt);
  });

  // -- Trump: one dot per year at his real known base of operations --
  var tLats  = years.map(function(y, i) {
    var base = trumpBases[y] || {lat:38.897, lon:-77.036};
    return base.lat - (i % 3 - 1) * 0.22;
  });
  var tLons  = years.map(function(y, i) {
    var base = trumpBases[y] || {lat:38.897, lon:-77.036};
    return base.lon - (i % 3 - 1) * 0.22;
  });
  var tSizes = years.map(function(y) {
    var n = (trumpByYear[y] || []).length;
    return Math.min(35, Math.max(6, n / 40));
  });
  var tText  = years.map(function(y) {
    var n   = (trumpByYear[y] || []).length;
    var rt  = avgField(trumpByYear[y] || [], 'retweets');
    var loc = locationLabel('trump', y);
    return '<b>Donald Trump \u2014 ' + y + '</b><br>Base: ' + loc + '<br>Tweets: ' + n.toLocaleString() + '<br>Avg Retweets: ' + fmtNum(rt);
  });

  // -- World events: real lat/lon from CSV (all 200+) --
  var activeEvents = getActiveEvents();

  var evLats  = activeEvents.map(function(e) { return e.lat  || 0; });
  var evLons  = activeEvents.map(function(e) { return e.lon  || 0; });
  var evText  = activeEvents.map(function(e) {
    return '<b>' + escHtml(e.event) + '</b><br>' + escHtml(e.date) +
           '<br>Category: ' + escHtml(e.category) +
           '<br><i>Click to open event panel</i>';
  });
  var evYears = activeEvents.map(function(e) { return e.year; });

  var traces = [
    {
      type: 'scattergeo',
      mode: 'markers',
      name: 'Elon Musk',
      lat:  eLats,
      lon:  eLons,
      text: eText,
      hovertemplate: '%{text}<extra></extra>',
      marker: { size:eSizes, color:'#00d4ff', opacity:0.85, line:{ color:'rgba(0,212,255,0.35)', width:1 } }
    },
    {
      type: 'scattergeo',
      mode: 'markers',
      name: 'Donald Trump',
      lat:  tLats,
      lon:  tLons,
      text: tText,
      hovertemplate: '%{text}<extra></extra>',
      marker: { size:tSizes, color:'#ff3d5a', opacity:0.85, line:{ color:'rgba(255,61,90,0.35)', width:1 } }
    },
    {
      type: 'scattergeo',
      mode: 'markers',
      name: 'World Event',
      lat:        evLats,
      lon:        evLons,
      text:       evText,
      customdata: evYears,
      hovertemplate: '%{text}<extra></extra>',
      marker: { size:12, color:'#ffd700', symbol:'star', opacity:0.95, line:{ color:'rgba(255,215,0,0.55)', width:1 } }
    }
  ];

  var layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    margin: { t:0, r:0, b:0, l:0 },
    showlegend: false,
    geo: {
      showframe:      false,
      showcoastlines: true,
      coastlinecolor: 'rgba(0,212,255,0.35)',
      showland:       true,
      landcolor:      'rgba(6,20,45,0.85)',
      showocean:      true,
      oceancolor:     'rgba(2,8,18,0.9)',
      showcountries:  true,
      countrycolor:   'rgba(0,212,255,0.12)',
      showlakes:      false,
      bgcolor:        'rgba(0,0,0,0)',
      projection: {
        type: 'orthographic',
        rotation: { lon:globeAngle, lat:20, roll:0 }
      }
    }
  };

  Plotly.newPlot('globe-plot', traces, layout, {
    responsive:     true,
    displayModeBar: false,
    scrollZoom:     true
  });

  // Click a gold star -> open side panel for that year
  document.getElementById('globe-plot').on('plotly_click', function(data) {
    var pt = data.points[0];
    if (pt.data.name === 'World Event') {
      openPanel(pt.customdata);
    }
  });

  // When the user drags the globe, pause auto-spin and resume from the new position
  document.getElementById('globe-plot').on('plotly_relayout', function(eventData) {
    // If WE triggered this relayout (spin tick or reset), ignore it completely
    if (_ownRelayout) {
      _ownRelayout = false;
      return;
    }
    // User dragged — read the actual longitude Plotly moved to and sync our tracker
    if (eventData) {
      var lon = eventData['geo.projection.rotation.lon'];
      if (typeof lon === 'number') globeAngle = lon;
    }
    // Pause while dragging; auto-resume only if the spin was running before the drag
    if (globeSpinning) {
      pauseSpin();
      clearTimeout(window._resumeDelay);
      window._resumeDelay = setTimeout(startSpin, 2000);
    }
  });

  startSpin();
}

function startSpin() {
  if (spinInterval) clearInterval(spinInterval); // prevent duplicate intervals
  globeSpinning = true;
  var btn = document.getElementById('btn-spin');
  if (btn) btn.textContent = 'PAUSE ROTATION';

  spinInterval = setInterval(function() {
    globeAngle += 0.3;
    _ownRelayout = true; // tell the relayout handler to ignore this update
    Plotly.relayout('globe-plot', {
      'geo.projection.rotation.lon': globeAngle
    });
  }, 100);
}

function pauseSpin() {
  globeSpinning = false;
  clearInterval(spinInterval);
  spinInterval = null;
  var btn = document.getElementById('btn-spin');
  if (btn) btn.textContent = 'START ROTATION';
}

function toggleSpin() {
  if (globeSpinning) pauseSpin(); else startSpin();
}

function resetGlobe() {
  pauseSpin();
  globeAngle   = -30;
  _ownRelayout = true;
  Plotly.relayout('globe-plot', {
    'geo.projection.rotation': { lon:globeAngle, lat:20, roll:0 }
  });
  startSpin();
}

// Returns top N tweets from a dataset for a given year, sorted by retweet count
function topTweetsForYear(data, year, n) {
  return data
    .filter(function(r) { return getYear(r) === String(year); })
    .slice()
    .sort(function(a, b) { return (parseFloat(b.retweets) || 0) - (parseFloat(a.retweets) || 0); })
    .slice(0, n);
}

function openPanel(year) {
  var panel = document.getElementById('side-panel');
  var body  = document.getElementById('side-panel-body');
  panel.classList.add('open');

  var activeEvents = getActiveEvents();
  var matches = activeEvents.filter(function(e) { return e.year === year; });

  var html = '<p style="color:var(--muted);font-size:0.68rem;letter-spacing:0.18em;margin-bottom:1.1rem;">EVENTS IN ' + escHtml(year) + '</p>';

  if (matches.length === 0) {
    html += '<p class="side-hint">No recorded events for ' + escHtml(year) + '.</p>';
  } else {
    matches.forEach(function(ev) {
      var catClass = 'cat-' + escHtml((ev.category || 'other').toLowerCase());
      var linkHtml = ev.link
        ? '<a class="ev-link" href="' + escHtml(ev.link) + '" target="_blank" rel="noopener noreferrer">VIEW ON WIKIPEDIA</a>'
        : '';
      html +=
        '<div class="ev-card">' +
          '<div class="ev-date">'  + escHtml(ev.date)     + '</div>' +
          '<div class="ev-name">'  + escHtml(ev.event)    + '</div>' +
          '<span class="ev-cat '   + catClass + '">'      + escHtml(ev.category) + '</span>' +
          linkHtml +
        '</div>';
    });
  }

  // Top tweets from that year, linked to the same time period as the events
  var elonTop  = topTweetsForYear(elonData,  year, 2);
  var trumpTop = topTweetsForYear(trumpData, year, 2);

  if (elonTop.length > 0 || trumpTop.length > 0) {
    html += '<p style="color:var(--muted);font-size:0.68rem;letter-spacing:0.18em;margin:1.4rem 0 0.8rem;">TOP TWEETS THAT YEAR</p>';

    function tweetCard(t, color, label) {
      var txt  = escHtml((t.text || '').substring(0, 110)) + ((t.text || '').length > 110 ? '\u2026' : '');
      var rt   = fmtNum(parseFloat(t.retweets)  || 0);
      var fav  = fmtNum(parseFloat(t.favorites) || 0);
      var date = escHtml((t.created_at || '').substring(0, 10));
      return '<div style="background:var(--bg3);border:1px solid ' + color + '33;border-radius:3px;padding:0.75rem;margin-bottom:0.6rem;">' +
        '<div style="font-size:0.6rem;color:' + color + ';letter-spacing:0.14em;margin-bottom:0.3rem;">' + label + ' \u00b7 ' + date + '</div>' +
        '<div style="font-size:0.78rem;line-height:1.5;color:var(--text);margin-bottom:0.4rem;">' + txt + '</div>' +
        '<div style="font-size:0.66rem;color:var(--muted);">RT ' + rt + ' &nbsp;\u00b7&nbsp; Likes ' + fav + '</div>' +
      '</div>';
    }

    elonTop.forEach(function(t)  { html += tweetCard(t, '#00d4ff', 'ELON MUSK');    });
    trumpTop.forEach(function(t) { html += tweetCard(t, '#ff3d5a', 'DONALD TRUMP'); });
  }

  body.innerHTML = html;
}

function closePanel() {
  document.getElementById('side-panel').classList.remove('open');
}
