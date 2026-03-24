export function generateRhythm(): string {
  return `
  <section id="rhythm" class="fade-in">
    <h2 class="section-title gradient-text">The Rhythm</h2>
    <p class="section-description">A GitHub-style heatmap showing the daily pulse of development activity across the project's lifetime.</p>
    <div id="rhythm-chart"></div>
  </section>`;
}

export function getRhythmScript(): string {
  return `
(function() {
  const activity = STORY_DATA.dailyActivity;
  if (!activity || activity.length === 0) return;

  const container = document.getElementById('rhythm-chart');
  if (!container) return;

  // Build a map of date -> count
  const dateMap = new Map();
  let maxCount = 0;
  activity.forEach(function(d) {
    dateMap.set(d.date, d.count);
    if (d.count > maxCount) maxCount = d.count;
  });

  // Determine date range
  const dates = activity.map(function(d) { return new Date(d.date + 'T00:00:00Z'); });
  const minDate = d3.min(dates);
  const maxDate = d3.max(dates);
  if (!minDate || !maxDate) return;

  // Cell dimensions
  const cellSize = 14;
  const cellPad = 2;
  const step = cellSize + cellPad;
  const dayLabelWidth = 30;
  const monthLabelHeight = 20;

  // Color scale
  const colorScale = d3.scaleSequential()
    .domain([0, Math.max(maxCount, 1)])
    .interpolator(function(t) {
      return d3.interpolateRgb('#0a0a1a', '#00ffcc')(t);
    });

  // Process each year separately
  const startYear = minDate.getUTCFullYear();
  const endYear = maxDate.getUTCFullYear();

  for (let year = startYear; year <= endYear; year++) {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));

    // Generate all days in this year
    const days = d3.utcDays(yearStart, new Date(Date.UTC(year + 1, 0, 1)));

    // Calculate weeks
    const totalWeeks = d3.utcSunday.count(yearStart, yearEnd) + 1;
    const width = dayLabelWidth + totalWeeks * step + step;
    const height = monthLabelHeight + 7 * step + 10;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .style('max-width', width + 'px')
      .style('display', 'block')
      .style('margin', '0 auto 20px auto');

    const g = svg.append('g')
      .attr('transform', 'translate(' + dayLabelWidth + ',' + monthLabelHeight + ')');

    // Day-of-week labels (Mon, Wed, Fri)
    var dayLabels = d3.scaleBand()
      .domain(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])
      .range([0, 7 * step]);

    ['Mon', 'Wed', 'Fri'].forEach(function(day) {
      var idx = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(day);
      g.append('text')
        .attr('x', -5)
        .attr('y', idx * step + cellSize * 0.8)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('fill', '#8892b0')
        .text(day);
    });

    // Month labels on top
    var months = d3.utcMonths(yearStart, new Date(Date.UTC(year + 1, 0, 1)));
    months.forEach(function(m) {
      var weekOffset = d3.utcSunday.count(yearStart, m);
      g.append('text')
        .attr('x', weekOffset * step)
        .attr('y', -5)
        .attr('font-size', '10px')
        .attr('fill', '#8892b0')
        .text(d3.utcFormat('%b')(m));
    });

    // Year label
    svg.append('text')
      .attr('x', 5)
      .attr('y', monthLabelHeight + 3.5 * step)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#ccd6f6')
      .attr('text-anchor', 'start')
      .attr('transform', 'rotate(-90, 5, ' + (monthLabelHeight + 3.5 * step) + ')')
      .text(year);

    // Tooltip
    var tooltip = d3.select(container)
      .append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(10,10,26,0.95)')
      .style('color', '#ccd6f6')
      .style('padding', '6px 10px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('border', '1px solid #00ffcc')
      .style('z-index', 100);

    // Draw cells
    g.selectAll('.day-cell')
      .data(days)
      .enter()
      .append('rect')
      .attr('class', 'day-cell')
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 2)
      .attr('x', function(d) {
        return d3.utcSunday.count(yearStart, d) * step;
      })
      .attr('y', function(d) {
        return d.getUTCDay() * step;
      })
      .attr('fill', function(d) {
        var key = d3.utcFormat('%Y-%m-%d')(d);
        var count = dateMap.get(key) || 0;
        return colorScale(count);
      })
      .on('mouseover', function(event, d) {
        var key = d3.utcFormat('%Y-%m-%d')(d);
        var count = dateMap.get(key) || 0;
        tooltip
          .style('opacity', 1)
          .html('<strong>' + key + '</strong><br/>' + count + ' commit' + (count !== 1 ? 's' : ''));
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        tooltip.style('opacity', 0);
      });
  }

  // Make container position relative for tooltip positioning
  container.style.position = 'relative';
})();
`;
}
