/*
 * LiquidityWatch score widget loader.
 * Usage:  <div data-liquiditywatch></div>
 *         <script async src="https://liquiditywatch.e3d.ai/widget.js"></script>
 * Replaces each [data-liquiditywatch] element with an iframe of the live gauge.
 * The iframe keeps the widget's styles and data fetching off the host page.
 */
(function () {
  'use strict';
  var ORIGIN = 'https://liquiditywatch.e3d.ai';
  var nodes = document.querySelectorAll('[data-liquiditywatch]:not([data-liquiditywatch-ready])');
  Array.prototype.forEach.call(nodes, function (node) {
    var frame = document.createElement('iframe');
    frame.src = ORIGIN + '/embed.html';
    frame.title = 'LiquidityWatch: U.S. Financial Stress Score';
    frame.loading = 'lazy';
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.style.cssText = 'width:100%;max-width:320px;height:340px;border:0;display:block;color-scheme:normal;';
    node.setAttribute('data-liquiditywatch-ready', '1');
    node.appendChild(frame);
  });
})();
