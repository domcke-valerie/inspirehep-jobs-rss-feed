function JSONtoRSS(json) {
    
  try {
    var result = UrlFetchApp.fetch(json, {
    "method": "get"
  });    

    if (result.getResponseCode() === 200) {
      
      // Apparently jsonParse is deprecated.  Should see what it has been replaced by and switch to that.
      var data = Utilities.jsonParse(result.getContentText());
      obj = hits_to_rss_obj(data);
      xml_str = OBJtoXML(obj);
      xml_str = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n' + xml_str + '\n</channel>\n</rss>';
      return xml_str;
 
    }    
  } catch (e) {
    Logger.log(e.toString());
  }  
}

function doGet(e) {

  //var feed = 'https://labs.inspirehep.net/api/jobs?size=10&sort=mostrecent&field_of_interest=hep-ph&field_of_interest=astro-ph&field_of_interest=hep-th&rank=JUNIOR&rank=SENIOR&region=Europe&region=North%20America'
  var q = e.queryString;
  if (!q){q = ''};
  var feed = 'https://labs.inspirehep.net/api/jobs?' + q;
  
  //var id = Utilities.base64Encode(feed);
  id = feed.hashCode();
  
  var rss = JSONtoRSS(feed);

//  //var cache = CacheService.getPublicCache();
//  var cache = CacheService.getScriptCache();
//  var rss   = cache.get(id);
//    
//  if ( ! rss ) {
//    rss = JSONtoRSS ( feed );
//    Logger.log(rss);
//    cache.put(id, rss, 3600);
//  }
  
  return ContentService.createTextOutput(rss)
    .setMimeType(ContentService.MimeType.RSS);
}



function OBJtoXML(obj) {
    var xml = '';
    for (var prop in obj) {
        if (obj[prop] instanceof Array) {
            for (var array in obj[prop]) {
                xml += '<' + prop + '>';
                xml += OBJtoXML(new Object(obj[prop][array]));
                xml += '</' + prop + ">\n";
            }
        } else {
            xml += '<' + prop + '>';
            typeof obj[prop] == 'object' ? xml += OBJtoXML(new Object(obj[prop])) : xml += escapeHTML(obj[prop]);
            xml += '</' + prop + '>\n';
        }
    }
    var xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
    return xml;
}


function job_to_rss_obj(ex) {
  it = {};
  if(ex.metadata.position){
    it.title = ex.metadata.position;
  };
  if(ex.metadata.institutions){
    it.author = '"' + ex.metadata.institutions.map(function(obj) {return obj.value}).join(', ') + '"';
  };
  it.link = 'https://labs.inspirehep.net/jobs/' + ex.metadata.control_number;
  it.description="";
  if(ex.metadata.position){
    it.description += "<b> " + ex.metadata.position + "</b><br><br>\n";
  };
  if(ex.metadata.deadline_date){
    it.description += "<b>Deadline:</b> " + ex.metadata.deadline_date + "<br>\n";
  };
  if(ex.metadata.arxiv_categories){
    it.description += "<b>Categories:</b> " + ex.metadata.arxiv_categories.join(', ') + "<br><br>\n";
  };
  if(ex.metadata.description){
    it.description += "<b>Description:</b> <br><br>\n" + ex.metadata.description;
  };
  return it;
};

function hits_to_rss_obj(data) {
  ch = {};
  ch.item = data.hits.hits.map(job_to_rss_obj);
  ch.title = "Jobs";
  ch.link = 'https://labs.inspirehep.net/jobs?field_of_interest=hep-ph&field_of_interest=astro-ph&field_of_interest=hep-th&page=1&rank=JUNIOR&rank=SENIOR&region=Europe&region=North%20America';
  ch.description = "For Valerie!  ;)";
  return ch;
}

// https://stackoverflow.com/a/7616484/10155767
String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};




// https://stackoverflow.com/a/39243641/10155767
var escapeChars = {
  '<' : 'lt',
  '>' : 'gt',
  '"' : 'quot',
  '&' : 'amp',
  '\'' : '#39'
};

var regexString = '[';
for(var key in escapeChars) {
  regexString += key;
}
regexString += ']';

var regex = new RegExp( regexString, 'g');

function escapeHTML(str) {
  return str.replace(regex, function(m) {
    return '&' + escapeChars[m] + ';';
  });
}; 
