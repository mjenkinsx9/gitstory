/**
 * The Pulse — mirrored area chart showing additions/deletions over time.
 * Generates the HTML container and the D3 script that renders at runtime.
 */

export function generatePulse(): string {
  return `
    <section id="pulse" class="section fade-in">
      <div class="section-inner">
        <h2 class="section-title">The Pulse</h2>
        <p class="section-description">
          A living heartbeat of creation and destruction — additions rise above the horizon while deletions sink below,
          painting the rhythm of change across time.
        </p>
        <div id="pulse-chart"></div>
      </div>
    </section>`;
}

export function getPulseScript(): string {
  return `
(function() {
  var data = STORY_DATA.dailyActivity;
  if (!data || data.length === 0) return;

  var container = document.getElementById('pulse-chart');
  if (!container) return;

  var containerWidth = container.clientWidth || 800;
  var margin = { top: 40, right: 30, bottom: 50, left: 60 };
  var width = containerWidth - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom;

  var svg = d3.select('#pulse-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var defs = svg.append('defs');

  // Glow filter
  var glow = defs.append('filter')
    .attr('id', 'pulse-glow')
    .attr('x', '-50%').attr('y', '-50%')
    .attr('width', '200%').attr('height', '200%');
  glow.append('feGaussianBlur')
    .attr('stdDeviation', 4)
    .attr('result', 'blur');
  var feMerge = glow.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'blur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  // Gradient for additions (cyan/teal, going up)
  var addGradient = defs.append('linearGradient')
    .attr('id', 'pulse-add-gradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%');
  addGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#06b6d4')
    .attr('stop-opacity', 0.8);
  addGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#14b8a6')
    .attr('stop-opacity', 0.1);

  // Gradient for deletions (rose/pink, going down)
  var delGradient = defs.append('linearGradient')
    .attr('id', 'pulse-del-gradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%');
  delGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#fb7185')
    .attr('stop-opacity', 0.1);
  delGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#e11d48')
    .attr('stop-opacity', 0.8);

  // Parse dates and compute scales
  var parsed = data.map(function(d) {
    return {
      date: new Date(d.date),
      additions: d.additions,
      deletions: d.deletions
    };
  });

  var xScale = d3.scaleTime()
    .domain(d3.extent(parsed, function(d) { return d.date; }))
    .range([0, width]);

  var maxVal = d3.max(parsed, function(d) {
    return Math.max(d.additions, d.deletions);
  }) || 1;

  var yScale = d3.scaleLinear()
    .domain([-maxVal, maxVal])
    .range([height, 0]);

  var midY = yScale(0);

  // Area generator for additions (above center)
  var additionArea = d3.area()
    .x(function(d) { return xScale(d.date); })
    .y0(midY)
    .y1(function(d) { return yScale(d.additions); })
    .curve(d3.curveMonotoneX);

  // Area generator for deletions (below center)
  var deletionArea = d3.area()
    .x(function(d) { return xScale(d.date); })
    .y0(midY)
    .y1(function(d) { return yScale(-d.deletions); })
    .curve(d3.curveMonotoneX);

  // Draw addition area
  svg.append('path')
    .datum(parsed)
    .attr('d', additionArea)
    .attr('fill', 'url(#pulse-add-gradient)')
    .attr('stroke', '#06b6d4')
    .attr('stroke-width', 1.5)
    .attr('filter', 'url(#pulse-glow)')
    .attr('opacity', 0.85);

  // Draw deletion area
  svg.append('path')
    .datum(parsed)
    .attr('d', deletionArea)
    .attr('fill', 'url(#pulse-del-gradient)')
    .attr('stroke', '#fb7185')
    .attr('stroke-width', 1.5)
    .attr('filter', 'url(#pulse-glow)')
    .attr('opacity', 0.85);

  // Center line
  svg.append('line')
    .attr('x1', 0).attr('x2', width)
    .attr('y1', midY).attr('y2', midY)
    .attr('stroke', 'rgba(255,255,255,0.15)')
    .attr('stroke-width', 1);

  // X axis
  svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%b %Y')))
    .selectAll('text')
    .attr('fill', 'rgba(255,255,255,0.6)')
    .style('font-size', '11px');

  svg.selectAll('.domain, .tick line').attr('stroke', 'rgba(255,255,255,0.1)');

  // Y axis
  svg.append('g')
    .call(d3.axisLeft(yScale).ticks(6).tickFormat(function(d) { return Math.abs(d); }))
    .selectAll('text')
    .attr('fill', 'rgba(255,255,255,0.6)')
    .style('font-size', '11px');

  // Tooltip
  var tooltip = d3.select('#pulse-chart')
    .append('div')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('background', 'rgba(6,6,14,0.9)')
    .style('border', '1px solid rgba(255,255,255,0.15)')
    .style('border-radius', '6px')
    .style('padding', '8px 12px')
    .style('font-size', '12px')
    .style('color', '#e2e8f0')
    .style('opacity', 0)
    .style('transition', 'opacity 0.2s');

  // Invisible overlay for mouse tracking
  var bisect = d3.bisector(function(d) { return d.date; }).left;

  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mouseover', function() { tooltip.style('opacity', 1); })
    .on('mouseout', function() { tooltip.style('opacity', 0); })
    .on('mousemove', function(event) {
      var coords = d3.pointer(event);
      var x0 = xScale.invert(coords[0]);
      var i = bisect(parsed, x0, 1);
      var d0 = parsed[i - 1];
      var d1 = parsed[i];
      if (!d0 || !d1) return;
      var d = (x0 - d0.date > d1.date - x0) ? d1 : d0;
      var dateStr = d3.timeFormat('%b %d, %Y')(d.date);
      tooltip.html(
        '<strong>' + dateStr + '</strong><br/>' +
        '<span style="color:#06b6d4">+' + d.additions + ' additions</span><br/>' +
        '<span style="color:#fb7185">−' + d.deletions + ' deletions</span>'
      );
      tooltip.style('left', (coords[0] + margin.left + 10) + 'px')
        .style('top', (coords[1] + margin.top - 10) + 'px');
    });
})();
`;
}
