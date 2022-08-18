window.cookies = {
  "get": function (cname) {
    if ( !cname ) {
      var i = 0, rtn = {}, cookies = document.cookie.split(" ");
      for (i; i < cookies.length; i++) rtn[cookies[i].split("=")[0]] = cookies[i].split("=")[1];
      return rtn;
    }
    var i = 0, cookies = document.cookie.split(" ");
    for (i; i < cookies.length; i++) if (cookies[i].split("=")[0] == cname) return cookies[i].split("=")[1];
    return false;
  },
  "set": function (cname, cvalue, exdays) {
    exdays = exdays || (1/24);
    var d = new Date(); d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    document.cookie = cname +'='+ cvalue +'; expires='+ d.toUTCString(); return true;
  },
  "del": function (cname) {
    document.cookie = cname +'=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  },
}
