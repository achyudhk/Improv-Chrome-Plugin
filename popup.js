/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });
}

function getPullReqInfo(url, callback, errorCallback) {

  if (url.indexOf("github.com") == -1 || url.indexOf("/pull/") == -1) {
    errorCallback('This is not a Github Pull Request page!');
    return;
  }
  var endpoint = 'https://api.github.com/repos/' + url.substring(19).replace("/pull/", "/pulls/");
  var x = new XMLHttpRequest();
  x.open('GET', endpoint);
  x.responseType = 'json';
  x.onload = function() {
    var response = x.response;
    // TODO: Add not found response check below
    if (!response || response.message == "Not Found") {
      errorCallback('No response from GitHub API!');
      return;
    }
    var numCommits = response.commits;
    var numFilesChanged = response.changed_files;
    if (isNaN(numCommits) || isNaN(numFilesChanged)) {
      errorCallback('Unexpected response from GitHub API!');
      return;
    }
    callback(numCommits, numFilesChanged);
  };
  x.onerror = function() {
    errorCallback('Network error!');
  };
  x.send();
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

function renderDetails(numCommits, numFilesChanged) {
  document.getElementById('num-commits').textContent = "Commits: " + numCommits;
  document.getElementById('num-file-changes').textContent = "Files changed: " + numFilesChanged;
  var hasIssues = false;
  var imgCommits = document.getElementById('img-commits');
  imgCommits.hidden = false;  
  imgCommits.width = 12;
  imgCommits.height = 12;
  var imgFileChanges = document.getElementById('img-file-changes');
  imgFileChanges.hidden = false;
  imgFileChanges.width = 12;
  imgFileChanges.height = 12;   
  if (numCommits <= 5) {
    imgCommits.src = "res/check.png";
  }
  else {
    imgCommits.src = "res/cross.png";
    hasIssues = true;
  }
  if (numFilesChanged <= 12) {
    imgFileChanges.src = "res/check.png";
  }
  else {
    imgFileChanges.src = "res/cross.png";
    hasIssues = true;
  } 
  if (!hasIssues) {
    renderStatus('No issues found with the pull request.');
  } else {
    renderStatus('Too many changes for one pull request.');     
  }
}

document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl(function(url) {

    renderStatus('Fetching data for ' + url);

    getPullReqInfo(url, function(numCommits, numFilesChanged) {
      renderDetails(numCommits, numFilesChanged);            
    }, function(errorMessage) {
      renderStatus('ERROR: ' + errorMessage);
    });
  });
});
