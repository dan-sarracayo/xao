window.QJAX = {
  "get": function (news) {
    /* Validation. */
    if (!news.url) { console.warn("Missing a request URL."); return false }
    if (!news.callback) { console.warn("Missing a call back function."); return false }
    /* Setup Request instance and build params string. */
    var
    xhttp = new XMLHttpRequest(),
    pstring = function () {
      var string = news.url + "?";
      for (var key in news.params) {
        string += key + "=" + news.params[key] + "&";
      }
      string = string.slice(0,string.length -1);
      return string;
    }
    /* Set up the callback */
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        news.callback(xhttp.responseText);
      }
    }
    xhttp.open("GET", pstring(), true);
    xhttp.send();
    return true;
  },
  "post": function (news) {
    /* Validation. */
    if (!news.url) { console.warn("Missing a request URL."); return false }
    if (!news.callback) { console.warn("Missing a call back function."); return false }
    /* Setup Request instance. */
    var
    xhttp = new XMLHttpRequest();
    // Setup Callback function for response.
    xhttp.onreadystatechange = function () {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        news.callback(xhttp.responseText);
      }
    }
    /* Setup url to post to. */
    xhttp.open("POST", news.url);
    /* Set headers to application. */
    xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    /* Factory for paramenters. */
    var
    pstring = function () {
      var string = '';
      if (!news.params) return '';
      for (var key in news.params) {
        string += key + "=" + news.params[key] +"&";
      }
      string = string.slice(0,string.length -1);
      return string;
    };
    /* Send request, with parameters. */
    xhttp.send(pstring());
    /* Confirmation. */
    return true;
  }
}
