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

var nextColorIndex = 0;
var availableColors = ['red', 'yellow', 'green', 'orange', 'blue'];
function pickColor() {
  return availableColors[nextColorIndex++ % availableColors.length];
}

function log(o) {
  if (typeof console != "undefined")
    console.log(o);
}

log("About to scan lyrics");

// Seed dictionary with dirty words if necessary
var initialWords = ['shit', 'piss', 'fuck', 'cunt', 'cocksucker', 'motherfucker', 'tits'];
if (GM_getValue('dictionary', '__EMPTY__') == '__EMPTY__') {
  log("initializing dictionary");
  GM_setValue('dictionary', initialWords.join('|'));
}

// Load dictionary from local storage
var dirtyWords = GM_getValue('dictionary','__EMPTY__').split('|');
log("Dirty word list:");
log(dirtyWords);

// Find data to scan
var lyricsNodes = $('#lyric_space *')
  .contents()
  .filter(function (){
    return this.nodeType == 3;
  });

// scan the text
var dirtyNodes = new Object();
$(lyricsNodes).each(function(){
  var node = this;

  $(dirtyWords).each(function(){
    var dirtyWord = this;
    var pat = dirtyWord.toUpperCase();

    // code below stolen from http://johannburkard.de/resources/Johann/jquery.highlight-3.js
    var pos = node.data.toUpperCase().indexOf(pat);
    if (pos >= 0) {
      var spannode = document.createElement('span');
      var middlebit = node.splitText(pos);
      var endbit = middlebit.splitText(pat.length);
      var middleclone = middlebit.cloneNode(true);
      spannode.appendChild(middleclone);
      middlebit.parentNode.replaceChild(spannode, middlebit);
      if (typeof dirtyNodes[dirtyWord] == 'undefined') {
        dirtyNodes[dirtyWord] = new Object();
        dirtyNodes[dirtyWord].nodes = new Array();
        dirtyNodes[dirtyWord].color = pickColor();
      }
      dirtyNodes[dirtyWord].nodes.push(spannode);
      $(spannode).css('background-color', dirtyNodes[dirtyWord].color);
    }
  });
});

log("done scanning");
log(dirtyNodes);

// show a console with results
var templateHtml = ' \
<div id="sevenDirtyWordsConsole"> \
  <h1>Dirty Words Found</h1> \
  <ul> \
    <% _.each(dirtyNodes, function(dirtyWordInfo, dirtyWord) { %> \
      <li> \
        <span style="background-color: <%= dirtyWordInfo.color %>"><%= dirtyWord %></span> \
        - \
        <span><%= dirtyWordInfo.nodes.length %></span> time(s)</span> \
      </li> \
    <% }); %> \
  </ul> \
  <div id="editDictionaryLink"> \
    <a href="#">Edit Dictionary</a> \
  </div> \
  <div id="editDictionaryBox"> \
    <h2>Dictionary</h2> \
    <ul> \
      <% _.each(dirtyWords, function(dirtyWord) { %> \
        <li><%= dirtyWord %></li> \
      <% }); %> \
      <li id="newDictionaryWord"> \
        <input /> \
      </li> \
    </ul> \
  </div> \
</div>';

$('body').append(_.template(templateHtml, {dirtyNodes: dirtyNodes, dirtyWords: dirtyWords}));

// style the console
$('#sevenDirtyWordsConsole').css({
  'position': 'fixed',
  'right': '5px',
  'top': '5px',
  'padding': '8px',
  'width': '200px',
  'background-color': 'white',
  'border': '1px solid black'
});

$('#sevenDirtyWordsConsole ul').css({
  'min-height': '30px'
});

$('#editDictionaryBox').hide();

$('#editDictionaryLink').css({
  'height': '20px',
  'position': 'absolute',
  'bottom': '5px'
});

$('#editDictionaryLink a').css({
  'align': 'right',
  'color': 'blue'
});

// add behaviors
// expand edit dictionary
$('#editDictionaryLink a').click(function(){
  log("Opening dictionary for edit");

  $('#editDictionaryBox').show();
  $('#sevenDirtyWordsConsole').css('bottom', '5px'); // TODO animate that shiz

  return false;
});

// press enter to add new word
$('#newDictionaryWord input').keypress(function(event){
  // TODO show the "how to use" instructions

  // ignore all keys other than the enter key
  if (event.which != 13) {
    return;
  }

  var newWord = $(this).val();
  console.log("Adding " + newWord + " to dictionary");
  // TODO persist

  // TODO reload everything

  return false;
});