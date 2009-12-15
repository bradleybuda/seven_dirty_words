// ==UserScript==
// @name           seven_dirty_words
// @namespace      http://bradleybuda.com
// @description    Scan song lyrics for words that you can't say on the radio
// @include        http://www.lyrics.com/*
// @resource       jQuery http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.js
// @resource       underscore http://documentcloud.github.com/underscore/underscore-min.js
// ==/UserScript==

// Inject jQuery and underscore into page (HACK)
// From http://stackoverflow.com/questions/564342/jquery-ui-dialog-throw-errors-when-invoked-from-greasemonkey
(function() {
  var head = document.getElementsByTagName('head')[0];

  var jQueryScript = document.createElement('script');
  jQueryScript.type = 'text/javascript';
  var jQuery = GM_getResourceText('jQuery');
  jQueryScript.innerHTML = jQuery;
  head.appendChild(jQueryScript);
  $ = unsafeWindow.$;

  var underscoreScript = document.createElement('script');
  underscoreScript.type = 'text/javascript';
  var underscore = GM_getResourceText('underscore');
  underscoreScript.innerHTML = underscore;
  head.appendChild(underscoreScript);
  _ = unsafeWindow._;
})();

console.log("Seven Dirty Words script initialized");
