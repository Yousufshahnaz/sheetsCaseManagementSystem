// @OnlyCurrentDoc
function onOpen(){
  SpreadsheetApp.getUi()
    .createMenu("Phoenix Database")
    .addItem("Activate Database", "searchForm")
    .addToUi();
}

function addForm() {
  var addTemplate = HtmlService.createTemplateFromFile("entryUI");

  var addHtml = addTemplate.evaluate();
  addHtml.setHeight(500).setWidth(800);//

  SpreadsheetApp.getUi().showModalDialog(addHtml,"Add Phoenix Shelter Friends");
  //showSidebar(html);

}

function searchForm() {

  var searchTemplate = HtmlService.createTemplateFromFile("searchUI");

  var searchHtml = searchTemplate.evaluate();
  searchHtml.setHeight(500).setWidth(800);//
  SpreadsheetApp.getUi().showModalDialog(searchHtml,"Search Phoenix Shelter Friends");
  //showSidebar(html);

}

function editForm(eventItem) {
  var cache = CacheService.getScriptCache();
  cache.put('selectedIndex', eventItem);

  var editTemplate = HtmlService.createTemplateFromFile("editUI");

  var editHtml = editTemplate.evaluate();
  editHtml.setHeight(500).setWidth(800);//
  SpreadsheetApp.getUi().showModalDialog(editHtml,"Add Phoenix Shelter Friends");
}

function appendData(data){
  var ws = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var dataID= ws.getLastRow() + 1;
  ws.appendRow([dataID,data.nameF,data.nameL,data.dob,data.workerNotes]);
}

// normalizeValues alters the values and types of data in certain cells such that it is compatible with Google's App Script asynchronous callbacks.
// For example, when the Date type is present in a Range returned from a function, the function call will succeed but will yield null to a callback instead of the returned value.
// https://developers.google.com/apps-script/guides/html/reference/run#myFunction(...)
function normalizeValues(range) {
  if (!range) {
    return dataValues;
  }

  for (var row = 0; range && row < range.length; row++) {
    if (!range[row]) {
      continue;
    }

    for (var col = 0; range[row] && col < range[row].length; col++) {
      if (typeof range[row][col].toLocaleDateString === 'function') {
        range[row][col] = range[row][col].toLocaleDateString();
      }
    }
  }
  return range;
}

function getData(){
  var datasheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rowBound = datasheet.getLastRow();
  var columnBound = 5;//datasheet.getLastColumn();
  var dataValues = datasheet.getRange(1,1,rowBound,columnBound).getValues();
  normalizeValues(dataValues);
  return dataValues;
}

function selectedData(){
  var ws = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var cache = CacheService.getScriptCache();
  var selectedRange = cache.get('selectedIndex');
  var selection = ws.getRange(selectedRange).getValues();
  normalizeValues(selection);
  return selection;

}

function selectedNotation(){
  var ws = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var cache = CacheService.getScriptCache();
  var selectedRange = cache.get('selectedIndex');
  normalizeValues(selectedRange);
  return selectedRange;
}
function editData (data,arange){
  var ws = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = ws.getRange(arange);
  selection.setValues([data]);
}

function deleteCells(arange) {
 var ws = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
 var lastRow = ws.getLastRow();
  var rangeSplit = arange.split(":");
  var rangeNum = rangeSplit[0].split("A");
  var newARange = "B" + rangeNum[1] + ":" + rangeSplit[1];
  ws.getRange(newARange).deleteCells(SpreadsheetApp.Dimension.ROWS);
  ws.deleteRow(lastRow);

}

function showAlert(arange) {
  var ui = SpreadsheetApp.getUi(); // Same variations.

  var result = ui.alert(
     'Please confirm',
     'Are you sure you want to delete this entry?',
      ui.ButtonSet.YES_NO);

  // Process the user's response.
  if (result == ui.Button.YES) {
    // User clicked "Yes".
    ui.alert('Entry Deleted');
    deleteCells(arange);
    searchForm();
  } else {
    // User clicked "No" or X in the title bar.
    ui.alert('Deletion Canceled');
    editForm(arange);
  }
}

/* References:
https://www.youtube.com/watch?v=4Hz36tiqEPE
https://www.youtube.com/watch?v=Q9aYU1Ufkpk
*/

// Encodes an array of 32-bit unsigned integers to a Base-62 string.
// The 62 possible characters are the numbers (0-9) and the alphabet's
// lowercase (a-z) and uppercase (A-Z) characters.
// The returned string will be at least 27 characters and may be padded on the
// left with "0".
// Assumes an array of 32-bit, unsigned integers.
function base62Encode(x) {
  // We cannot easily divide a 20-byte integer since it does not fit in CPU
  // registers. So we will do division 5 4-byte words.
  const base62Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const uint32Base = 4294967296; // This is 1 + largest 32-bit integer.
  var result = new Uint8Array(27);
  var rIdx = result.length - 1;

  var words = x;

  // Divide each 4-byte word by the new base, starting with the most
  // significant. Each iteration through this loop will result in one byte of
  // output. The remainder of the division on the last word is that value.
  // Values are added to the result from right to left as we build the result
  // from least to most significant base62 value.
  while (words.length > 0) {
    var quotientWords = []; // keep the results of each division
    var rem = 0; // The remainder of the last division.

    // Iterate through all of the remaining words, divide each one by our new
    // base, and carry the remainder to the next word. If we were already on
    // the last word, then that remainder is our value in the result.
    for (var i = 0; i < words.length; i++) {
      // The value in the numerator is the value of this word plus any
      // remainder from the previous division. The remainder must be multiplied
      // by the input's base so that the bases match for the addition.
      var value = words[i] + rem * uint32Base;
      var digit = Math.floor(value/62);
      rem = value % 62;

      if (digit != 0 || quotientWords.length != 0) {
        // When we have a non-zero digit as a result of the division, save it
        // for the next round.
        // If we already have a quotient word, then add a word here even if it
        // is zero.
        quotientWords.push(digit);
      }
    }

    result[rIdx--] = rem;
    words = quotientWords;
  }

  // Now that we have divided the full 20-byte number by 62, convert the resut
  // of that to a string.
  var resultString = "";
  for (var i=0; i<result.length; i++) {
    resultString = resultString+base62Chars[result[i]];
  }

  // When we have fewer than the full 27 characters, left-pad with "0".
  var paddingLength = 27 - resultString.length;
  if (resultString.length < 27) {
    resultString = "0".repeat(27-resultString.length) + resultString;
  }
  return resultString;
}

/*
 * Returns a string ID that is guaranteed to be unique.
 */
function makeID() {
  // This implementation generates a KSUID as described here: https://github.com/segmentio/ksuid
  // 4 bytes of timestamp followed by 16 bytes of random: 5 32-bit elements
  var resultArray = new Uint32Array(5);

  // Add a round number so that our IDs are valid farther into the future.
  const ksuidEpochDelta = 14e8;
  // Put the timestamp in the 1st of 5 bytes.
  resultArray[0] = Math.floor(Date.now() / 1000) + ksuidEpochDelta;

  // Put random numbers into the remaining bytes.
  window.crypto.getRandomValues(resultArray.subarray(1));

  // Convert the value into a printable string.
  return base62Encode(resultArray);
}
