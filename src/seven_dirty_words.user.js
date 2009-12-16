// ==UserScript==
// @name           seven_dirty_words
// @namespace      http://bradleybuda.com
// @description    Scan song lyrics for words that you can't say on the radio
// @include        http://www.lyrics.com/*
// @resource       jQuery http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.js
// @resource       underscore http://documentcloud.github.com/underscore/underscore-min.js
// ==/UserScript==

// INIT
// Inject jQuery and underscore into page (HACK)
// From http://stackoverflow.com/questions/564342/jquery-ui-dialog-throw-errors-when-invoked-from-greasemonkey
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
// END INIT

// begin 'class' here
function SevenDirtyWords() {
  this.colors = new SevenDirtyWords.Colors();
}

// "static" function - is this right?
SevenDirtyWords.log = function(object){
  if (typeof console != "undefined")
    console.log(object);
};

// color functions as a nested class; this is a little crazy
SevenDirtyWords.Colors = function() {
  this.nextColorIndex = 0;
  this.availableColors = ['red', 'yellow', 'green', 'orange', 'blue'];
}

SevenDirtyWords.Colors.prototype.pickColor = function(){
  return this.availableColors[this.nextColorIndex++ % this.availableColors.length];
};

// extract lyrics from document
SevenDirtyWords.prototype.lyricsNodes = function(){
  return $('#lyric_space *')
    .contents()
    .filter(function (){
      return this.nodeType == 3;
    });
};

// global state and scanning
// TODO accessor functions for dirtyNodes
SevenDirtyWords.prototype.dirtyNodes = new Object();
SevenDirtyWords.prototype.scanLyrics = function(){
  SevenDirtyWords.log("About to scan lyrics");
  var lyricsNodes = this.lyricsNodes();
  var wordList = this.wordList();
  var dirtyNodes = this.dirtyNodes;
  var colors = this.colors;

  $(lyricsNodes).each(function(){
    var node = this;

    $(wordList).each(function(){
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
          dirtyNodes[dirtyWord].color = colors.pickColor();
        }
        dirtyNodes[dirtyWord].nodes.push(spannode);
        $(spannode).css('background-color', dirtyNodes[dirtyWord].color);
      }
    });
  });

  SevenDirtyWords.log("done scanning");
  SevenDirtyWords.log(dirtyNodes);
};

// dictionary
// for now, dictionary is never cached; it's always read out of prefs on each read/write
SevenDirtyWords.prototype.wordList = function(){
  // Seed dictionary with dirty words if necessary
  var initialWords = ['shit', 'piss', 'fuck', 'cunt', 'cocksucker', 'motherfucker', 'tits'];
  if (GM_getValue('dictionary', '__EMPTY__') == '__EMPTY__') {
    SevenDirtyWords.log("initializing dictionary");
    GM_setValue('dictionary', initialWords.join('|'));
  }

  // Load dictionary from local storage
  return GM_getValue('dictionary','__EMPTY__').split('|');
};

SevenDirtyWords.prototype.addWord = function(word){
  var existingWords = this.wordList();
  // TODO check duplicates
  existingWords.push(word);
  GM_setValue('dictionary', existingWords.join('|'));
};
  
// setup document
SevenDirtyWords.prototype.templateHtml = ' \
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

SevenDirtyWords.prototype.clearExistingConsole = function(){
  $('#sevenDirtyWordsConsole').remove();
};

SevenDirtyWords.prototype.renderHtml = function(){
  // render template with current state
  $('body').append(_.template(this.templateHtml, {dirtyNodes: this.dirtyNodes, dirtyWords: this.wordList()}));
};

SevenDirtyWords.prototype.applyStyles = function(){
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
};

SevenDirtyWords.prototype.addBehaviors = function(){
  var instance = this;

  // expand edit dictionary
  $('#editDictionaryLink a').click(function(){
    SevenDirtyWords.log("Opening dictionary for edit");
    
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
    SevenDirtyWords.log("Adding " + newWord + " to dictionary");
    
    // need to call down to model using setTimeout to make greasemonkey security happy
    window.setTimeout(function(){
      // TODO make this binding / data driven
      instance.addWord(newWord);
      instance.scanLyrics();
      instance.render();
    });

    return false;
  });
};

SevenDirtyWords.prototype.render = function(){
  this.clearExistingConsole();
  this.renderHtml();
  this.applyStyles();
  this.addBehaviors();
};

// Run it!
SevenDirtyWords.log("about to begin first scan");
var instance = new SevenDirtyWords();
instance.scanLyrics();
instance.render();
SevenDirtyWords.log("completed first scan");
