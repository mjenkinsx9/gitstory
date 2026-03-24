export function generateCast(): string {
  return `
    <section id="cast" class="section fade-in">
      <div class="section-inner">
        <h2 class="section-title">The Cast</h2>
        <p class="section-description">Every contributor who left their mark on this project, shown as a timeline of their involvement.</p>
        <div id="cast-chart" class="chart-container"></div>
      </div>
    </section>
  `;
}

export function getCastScript(): string {
  return `
    (function() {
      const contributors = STORY_DATA.contributors;
      if (!contributors || contributors.length === 0) return;

      const container = d3.select('#cast-chart');
      const containerNode = container.node();
      if (!containerNode) return;

      const fullWidth = containerNode.getBoundingClientRect().width || 800;
      const margin = { top: 30, right: 40, bottom: 50, left: 160 };
      const barHeight = 32;
      const height = margin.top + margin.bottom + contributors.length * barHeight;
      const width = fullWidth;
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', '0 0 ' + width + ' ' + height);

      const g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      const palette = [
        '#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa',
        '#fb923c', '#2dd4bf', '#e879f9', '#4ade80', '#f87171',
        '#38bdf8', '#c084fc', '#facc15', '#22d3ee', '#fb7185'
      ];

      // Parse dates
      const parsed = contributors.map(function(c, i) {
        return {
          name: c.name,
          commitCount: c.commitCount,
          additions: c.additions,
          deletions: c.deletions,
          firstCommit: new Date(c.firstCommit),
          lastCommit: new Date(c.lastCommit),
          color: palette[i % palette.length]
        };
      });

      // Sort by first commit date
      parsed.sort(function(a, b) { return a.firstCommit - b.firstCommit; });

      const names = parsed.map(function(d) { return d.name; });

      const allDates = parsed.reduce(function(acc, d) {
        acc.push(d.firstCommit, d.lastCommit);
        return acc;
      }, []);
      const minDate = d3.min(allDates);
      const maxDate = d3.max(allDates);

      const y = d3.scaleBand()
        .domain(names)
        .range([0, innerHeight])
        .padding(0.3);

      const x = d3.scaleTime()
        .domain([minDate, maxDate])
        .range([0, innerWidth]);

      // X axis
      g.append('g')
        .attr('transform', 'translate(0,' + innerHeight + ')')
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %Y')))
        .selectAll('text')
          .style('fill', '#94a3b8')
          .style('font-size', '11px');

      g.selectAll('.domain, .tick line').style('stroke', '#334155');

      // Y axis labels
      g.append('g')
        .call(d3.axisLeft(y).tickSize(0))
        .select('.domain').remove();

      g.selectAll('.tick text')
        .style('fill', '#e2e8f0')
        .style('font-size', '12px');

      // Tooltip
      var tooltip = d3.select('body').append('div')
        .attr('class', 'cast-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(15, 23, 42, 0.95)')
        .style('border', '1px solid #334155')
        .style('border-radius', '8px')
        .style('padding', '12px 16px')
        .style('color', '#e2e8f0')
        .style('font-size', '13px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000)
        .style('backdrop-filter', 'blur(8px)');

      function formatDate(d) {
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
      }

      // Bars
      g.selectAll('.cast-bar')
        .data(parsed)
        .enter()
        .append('rect')
          .attr('class', 'cast-bar')
          .attr('x', function(d) { return x(d.firstCommit); })
          .attr('y', function(d) { return y(d.name); })
          .attr('width', function(d) {
            var w = x(d.lastCommit) - x(d.firstCommit);
            return Math.max(w, 4);
          })
          .attr('height', y.bandwidth())
          .attr('rx', 4)
          .attr('fill', function(d) { return d.color; })
          .attr('opacity', 0.8)
          .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1).attr('stroke', '#fff').attr('stroke-width', 1);
            tooltip
              .style('opacity', 1)
              .html(
                '<strong>' + d.name + '</strong><br/>' +
                '<span style="color:#94a3b8">' + d.commitCount + ' commits</span><br/>' +
                '<span style="color:#94a3b8">' + formatDate(d.firstCommit) + ' — ' + formatDate(d.lastCommit) + '</span><br/>' +
                '<span style="color:#4ade80">+' + d.additions.toLocaleString() + '</span> ' +
                '<span style="color:#f87171">-' + d.deletions.toLocaleString() + '</span>'
              );
          })
          .on('mousemove', function(event) {
            tooltip
              .style('left', (event.pageX + 12) + 'px')
              .style('top', (event.pageY - 12) + 'px');
          })
          .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.8).attr('stroke', 'none');
            tooltip.style('opacity', 0);
          });
    })();
  `;
}
