

// Shared Plotly layout applied to all charts
var baseLayout = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor:  'rgba(0,0,0,0)',
  font: { family:'Exo 2, sans-serif', color:'#7ab3d4', size:11 },
  margin: { t:20, r:20, b:55, l:65 },
  legend: { bgcolor:'rgba(6,15,30,0.85)', bordercolor:'rgba(0,212,255,0.2)', borderwidth:1 },
  xaxis: { gridcolor:'rgba(0,212,255,0.07)', linecolor:'rgba(0,212,255,0.2)', tickcolor:'rgba(0,212,255,0.2)', zerolinecolor:'rgba(0,212,255,0.1)' },
  yaxis: { gridcolor:'rgba(0,212,255,0.07)', linecolor:'rgba(0,212,255,0.2)', tickcolor:'rgba(0,212,255,0.2)', zerolinecolor:'rgba(0,212,255,0.1)' }
};

var plotCfg = { responsive:true, displayModeBar:false };



function buildDashboard() {
  buildStats();
  buildTimeline();
  buildEngagement();
  buildEventsChart();
  buildViralTweets();
  buildBehaviour();
}



function buildStats() {
  var elonCount  = elonData.length;
  var trumpCount = trumpData.length;
  var elonRt     = avgField(elonData,  'retweets');
  var trumpRt    = avgField(trumpData, 'retweets');
  var elonFav    = avgField(elonData,  'favorites');
  var trumpFav   = avgField(trumpData, 'favorites');

  setText('s-elon-total',  fmtNum(elonCount));
  setText('s-elon-rt',     fmtNum(elonRt));
  setText('s-elon-fav',    fmtNum(elonFav));
  setText('s-trump-total', fmtNum(trumpCount));
  setText('s-trump-rt',    fmtNum(trumpRt));
  setText('s-trump-fav',   fmtNum(trumpFav));

  var rows = [
    { label:'Total Tweets', musk:fmtNum(elonCount), trump:fmtNum(trumpCount) },
    { label:'Avg Retweets', musk:fmtNum(elonRt),    trump:fmtNum(trumpRt)    },
    { label:'Avg Likes',    musk:fmtNum(elonFav),   trump:fmtNum(trumpFav)   },
    { label:'Peak Year',    musk:peakYear(elonData), trump:peakYear(trumpData) }
  ];

  var muskHtml  = '';
  var trumpHtml = '';

  rows.forEach(function(r) {
    muskHtml  += '<div class="h2h-row"><span class="h2h-val c-blue">' + r.musk  + '</span><span class="h2h-key">' + r.label + '</span></div>';
    trumpHtml += '<div class="h2h-row"><span class="h2h-key">' + r.label + '</span><span class="h2h-val c-red">' + r.trump + '</span></div>';
  });

  document.getElementById('h2h-musk').innerHTML  = muskHtml;
  document.getElementById('h2h-trump').innerHTML = trumpHtml;

  // Update welcome screen counters with real numbers
  animateCount('ctr-trump', trumpCount);
  animateCount('ctr-elon',  elonCount);
}



function buildTimeline() {
  var elonByMonth  = groupBy(elonData,  getMonth);
  var trumpByMonth = groupBy(trumpData, getMonth);

  var months = [];
  var allKeys = Object.keys(elonByMonth).concat(Object.keys(trumpByMonth));
  allKeys.forEach(function(m) { if (months.indexOf(m) === -1) months.push(m); });
  months.sort();

  // Vertical dotted lines for key events
  var shapes = worldEvents.slice(0, 12).map(function(e) {
    return {
      type:'line',
      x0: e.date.substring(0,7), x1: e.date.substring(0,7),
      y0:0, y1:1, yref:'paper',
      line: { color:'rgba(255,215,0,0.22)', width:1, dash:'dot' }
    };
  });

  var traces = [
    {
      x: months,
      y: months.map(function(m) { return (elonByMonth[m]  || []).length; }),
      name: 'Elon Musk',
      type:'scatter', mode:'lines',
      line: { color:'#00d4ff', width:2 },
      fill:'tozeroy', fillcolor:'rgba(0,212,255,0.04)'
    },
    {
      x: months,
      y: months.map(function(m) { return (trumpByMonth[m] || []).length; }),
      name: 'Donald Trump',
      type:'scatter', mode:'lines',
      line: { color:'#ff3d5a', width:2 },
      fill:'tozeroy', fillcolor:'rgba(255,61,90,0.04)'
    }
  ];

  var layout = Object.assign({}, baseLayout, {
    shapes: shapes,
    xaxis: Object.assign({}, baseLayout.xaxis, { title:'Month' }),
    yaxis: Object.assign({}, baseLayout.yaxis, { title:'Tweet Count' })
  });

  Plotly.newPlot('chart-timeline', traces, layout, plotCfg);
}


function buildEngagement() {
  var elonByYear  = groupBy(elonData,  getYear);
  var trumpByYear = groupBy(trumpData, getYear);

  var years = [];
  var allKeys = Object.keys(elonByYear).concat(Object.keys(trumpByYear));
  allKeys.forEach(function(y) { if (years.indexOf(y) === -1) years.push(y); });
  years.sort();

  var eRt  = years.map(function(y) { return avgField(elonByYear[y]  || [], 'retweets'); });
  var tRt  = years.map(function(y) { return avgField(trumpByYear[y] || [], 'retweets'); });
  var eFav = years.map(function(y) { return avgField(elonByYear[y]  || [], 'favorites'); });
  var tFav = years.map(function(y) { return avgField(trumpByYear[y] || [], 'favorites'); });

  var barLayout = Object.assign({}, baseLayout, { barmode:'group' });

  Plotly.newPlot('chart-retweets', [
    { x:years, y:eRt,  name:'Musk',  type:'bar', marker:{ color:'rgba(0,212,255,0.75)' } },
    { x:years, y:tRt,  name:'Trump', type:'bar', marker:{ color:'rgba(255,61,90,0.75)'  } }
  ], Object.assign({}, barLayout, {
    xaxis: Object.assign({}, baseLayout.xaxis, { title:'Year' }),
    yaxis: Object.assign({}, baseLayout.yaxis, { title:'Avg Retweets' })
  }), plotCfg);

  Plotly.newPlot('chart-likes', [
    { x:years, y:eFav, name:'Musk',  type:'bar', marker:{ color:'rgba(0,212,255,0.75)' } },
    { x:years, y:tFav, name:'Trump', type:'bar', marker:{ color:'rgba(255,61,90,0.75)'  } }
  ], Object.assign({}, barLayout, {
    xaxis: Object.assign({}, baseLayout.xaxis, { title:'Year' }),
    yaxis: Object.assign({}, baseLayout.yaxis, { title:'Avg Likes' })
  }), plotCfg);
}


function buildEventsChart() {
  var elonByMonth  = groupBy(elonData,  getMonth);
  var trumpByMonth = groupBy(trumpData, getMonth);

  var months = [];
  var allKeys = Object.keys(elonByMonth).concat(Object.keys(trumpByMonth));
  allKeys.forEach(function(m) { if (months.indexOf(m) === -1) months.push(m); });
  months.sort();

  var eY = months.map(function(m) { return (elonByMonth[m]  || []).length; });
  var tY = months.map(function(m) { return (trumpByMonth[m] || []).length; });
  var globalMax = Math.max.apply(null, eY.concat(tY)) || 1;

  // Use ALL curated worldEvents (28 key events) — not just the first 12
  var eventsForChart = worldEvents;

  var evMonths = eventsForChart.map(function(e) { return e.date.substring(0, 7); });
  var evElonY  = evMonths.map(function(m) { return (elonByMonth[m]  || []).length; });
  var evTrumpY = evMonths.map(function(m) { return (trumpByMonth[m] || []).length; });
  // Star sits at the taller of the two traces, with a visible floor so early events aren't buried
  var evPeakY  = evMonths.map(function(m, i) {
    return Math.max(evElonY[i], evTrumpY[i]) || Math.round(globalMax * 0.07);
  });

  // Rank events by combined tweet volume to choose which 10 get arrow annotations
  var scored = eventsForChart.map(function(e, i) {
    return { i: i, score: evElonY[i] + evTrumpY[i] };
  }).sort(function(a, b) { return b.score - a.score; });

  var annotateSet    = {};
  var annotateOffset = {};
  scored.slice(0, 10).forEach(function(s, rank) {
    annotateSet[s.i]    = true;
    // Alternate label heights so nearby events don't stack on top of each other
    annotateOffset[s.i] = rank % 2 === 0 ? -44 : -74;
  });

  // Colour-coded vertical lines: red = political, cyan = tech, gold = everything else
  var shapes = eventsForChart.map(function(e, i) {
    var col = e.category === 'Political'  ? 'rgba(255,80,100,0.30)' :
              e.category === 'Technology' ? 'rgba(0,212,255,0.22)'  :
                                            'rgba(255,215,0,0.22)';
    return {
      type: 'line',
      x0: evMonths[i], x1: evMonths[i],
      y0: 0, y1: 1, yref: 'paper',
      line: { color: col, width: 1, dash: 'dot' }
    };
  });

  // Arrow annotations only for the top-10 most-tweeted-about events
  var annotations = eventsForChart.map(function(e, i) {
    if (!annotateSet[i]) return null;
    var label = e.event.length > 26 ? e.event.substring(0, 26) + '\u2026' : e.event;
    return {
      x: evMonths[i],
      y: evPeakY[i],
      text: label,
      showarrow:   true,
      arrowhead:   2,
      arrowcolor:  '#ffd700',
      arrowsize:   0.7,
      arrowwidth:  1,
      ax: 0,
      ay: annotateOffset[i],
      font: { size: 9, color: '#ffd700', family: 'Exo 2, sans-serif' },
      bgcolor:     'rgba(4,12,28,0.92)',
      bordercolor: 'rgba(255,215,0,0.55)',
      borderwidth: 1,
      borderpad:   4
    };
  }).filter(Boolean);

  // Detailed hover tooltip for each gold star
  var evHoverText = eventsForChart.map(function(e, i) {
    return '<b>' + e.event + '</b>' +
      '<br>' + e.date + ' \u00b7 ' + e.category +
      '<br>Elon tweets that month: <b>' + evElonY[i].toLocaleString() + '</b>' +
      '<br>Trump tweets that month: <b>' + evTrumpY[i].toLocaleString() + '</b>';
  });

  var traces = [
    {
      x: months, y: eY,
      name: 'Elon Musk',
      type: 'scatter', mode: 'lines',
      line: { color: '#00d4ff', width: 2.5 },
      fill: 'tozeroy', fillcolor: 'rgba(0,212,255,0.07)',
      hovertemplate: '<b>Elon Musk</b><br>%{x}: %{y} tweets<extra></extra>'
    },
    {
      x: months, y: tY,
      name: 'Donald Trump',
      type: 'scatter', mode: 'lines',
      line: { color: '#ff3d5a', width: 2.5 },
      fill: 'tozeroy', fillcolor: 'rgba(255,61,90,0.07)',
      hovertemplate: '<b>Donald Trump</b><br>%{x}: %{y} tweets<extra></extra>'
    },
    {
      // Gold stars floating at the peak for each event
      x: evMonths, y: evPeakY,
      text: evHoverText,
      name: 'World Event',
      type: 'scatter', mode: 'markers',
      marker: {
        size: 13,
        color: '#ffd700',
        symbol: 'star',
        opacity: 1,
        line: { color: 'rgba(255,215,0,0.7)', width: 1.5 }
      },
      hovertemplate: '%{text}<extra></extra>'
    }
  ];

  Plotly.newPlot('chart-events', traces, Object.assign({}, baseLayout, {
    shapes:      shapes,
    annotations: annotations,
    margin: { t: 30, r: 20, b: 55, l: 65 },
    legend: { bgcolor:'rgba(6,15,30,0.85)', bordercolor:'rgba(0,212,255,0.2)', borderwidth:1,
              x:0.01, y:0.99, xanchor:'left', yanchor:'top' },
    xaxis: Object.assign({}, baseLayout.xaxis, { title: 'Month' }),
    yaxis: Object.assign({}, baseLayout.yaxis, { title: 'Tweet Count' })
  }), {
    responsive:   true,
    scrollZoom:   true,          // scroll wheel zooms IN and OUT
    displayModeBar: 'hover',     // modebar (inc. reset-axes icon) appears on hover
    displaylogo:  false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'toggleSpikelines',
                             'hoverClosestCartesian', 'hoverCompareCartesian']
  });
}

// Called by the RESET ZOOM button next to the chart
function resetEventsZoom() {
  Plotly.relayout('chart-events', { 'xaxis.autorange': true, 'yaxis.autorange': true });
}


function buildViralTweets() {
  var topMusk  = elonData.slice().sort(function(a,b) {
    return (parseFloat(b.retweets)||0) - (parseFloat(a.retweets)||0);
  }).slice(0,5);

  var topTrump = trumpData.slice().sort(function(a,b) {
    return (parseFloat(b.retweets)||0) - (parseFloat(a.retweets)||0);
  }).slice(0,5);

  document.getElementById('viral-musk').innerHTML  = renderTweets(topMusk,  false);
  document.getElementById('viral-trump').innerHTML = renderTweets(topTrump, true);
}

function renderTweets(tweets, isTrump) {
  if (!tweets || tweets.length === 0) {
    return '<p style="color:var(--muted);padding:1rem;font-size:0.8rem;">No data available.</p>';
  }

  var html = '';
  tweets.forEach(function(t, i) {
    var txt  = (t.text || '').substring(0, 130) + (t.text && t.text.length > 130 ? '...' : '');
    var rt   = fmtNum(parseFloat(t.retweets)  || 0);
    var fav  = fmtNum(parseFloat(t.favorites) || 0);
    var date = (t.created_at || '').substring(0, 10);
    var rankColor = isTrump ? 'color:var(--red)' : 'color:var(--blue)';
    var cls = isTrump ? 'tw-item trump-tw' : 'tw-item';

    html +=
      '<div class="' + cls + '">' +
        '<div class="tw-rank" style="' + rankColor + '">#' + (i+1) + '</div>' +
        '<div class="tw-text">' + txt + '</div>' +
        '<div class="tw-meta">' +
          '<div class="tw-rt">RT ' + rt + '</div>' +
          '<div class="tw-fav">Likes ' + fav + '</div>' +
          '<div class="tw-date">' + date + '</div>' +
        '</div>' +
      '</div>';
  });
  return html;
}


function buildBehaviour() {
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  var eHours  = new Array(24).fill(0);
  var tHours  = new Array(24).fill(0);
  var eDays   = new Array(7).fill(0);
  var tDays   = new Array(7).fill(0);

  elonData.forEach(function(row) {
    var h = getHour(row);
    var d = getDayOfWeek(row);
    if (h !== null && h >= 0 && h < 24) eHours[h]++;
    if (d !== null && d >= 0 && d < 7)  eDays[d]++;
  });

  trumpData.forEach(function(row) {
    var h = getHour(row);
    var d = getDayOfWeek(row);
    if (h !== null && h >= 0 && h < 24) tHours[h]++;
    if (d !== null && d >= 0 && d < 7)  tDays[d]++;
  });

  var hourLabels = [];
  for (var h = 0; h < 24; h++) hourLabels.push(h + ':00');

  var barBase = Object.assign({}, baseLayout, { barmode:'group' });

  Plotly.newPlot('chart-hours', [
    { x:hourLabels, y:eHours, name:'Musk',  type:'bar', marker:{ color:'rgba(0,212,255,0.75)' } },
    { x:hourLabels, y:tHours, name:'Trump', type:'bar', marker:{ color:'rgba(255,61,90,0.75)'  } }
  ], Object.assign({}, barBase, {
    xaxis: Object.assign({}, baseLayout.xaxis, { title:'Hour of Day (UTC)' }),
    yaxis: Object.assign({}, baseLayout.yaxis, { title:'Tweet Count' })
  }), plotCfg);

  Plotly.newPlot('chart-days', [
    { x:days, y:eDays, name:'Musk',  type:'bar', marker:{ color:'rgba(0,212,255,0.75)' } },
    { x:days, y:tDays, name:'Trump', type:'bar', marker:{ color:'rgba(255,61,90,0.75)'  } }
  ], Object.assign({}, barBase, {
    xaxis: Object.assign({}, baseLayout.xaxis, { title:'Day of Week' }),
    yaxis: Object.assign({}, baseLayout.yaxis, { title:'Tweet Count' })
  }), plotCfg);
}
