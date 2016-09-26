var parser = {
    linkreg : /(http|https|ftp)\x3A\x2F\x2F(?:[\da-z](?:[\x2D\da-z]*[\da-z])?\.)+[\da-z](?:[\x2D\da-z]*[\da-z])?[a-z#-9;!=?@_]*/gi,
    coloreg : 'yellowgreen|yellow|whitesmoke|white|wheat|violet|turquoise|tomato|thistle|teal|tan|steelblue|springgreen|snow|slategray|slateblue|skyblue|silver|sienna|seashell|seagreen|sandybrown|salmon|saddlebrown|royalblue|rosybrown|red|rebeccapurple|purple|powderblue|plum|pink|peru|peachpuff|papayawhip|palevioletred|paleturquoise|palegreen|palegoldenrod|orchid|orangered|orange|olivedrab|olive|oldlace|navy|navajowhite|moccasin|mistyrose|mintcream|midnightblue|mediumvioletred|mediumturquoise|mediumspringgreen|mediumslateblue|mediumseagreen|mediumpurple|mediumorchid|mediumblue|mediumaquamarine|maroon|magenta|linen|limegreen|lime|lightyellow|lightsteelblue|lightslategray|lightskyblue|lightseagreen|lightsalmon|lightpink|lightgreen|lightgray|lightgoldenrodyellow|lightcyan|lightcoral|lightblue|lemonchiffon|lawngreen|lavenderblush|lavender|khaki|ivory|indigo|indianred|hotpink|honeydew|greenyellow|green|gray|goldenrod|gold|ghostwhite|gainsboro|fuchsia|forestgreen|floralwhite|firebrick|dodgerblue|dimgray|deepskyblue|deeppink|darkviolet|darkturquoise|darkslategray|darkslateblue|darkseagreen|darksalmon|darkred|darkorchid|darkorange|darkolivegreen|darkmagenta|darkkhaki|darkgreen|darkgray|darkgoldenrod|darkcyan|darkblue|cyan|crimson|cornsilk|cornflowerblue|coral|chocolate|chartreuse|cadetblue|burlywood|brown|blueviolet|blue|blanchedalmond|black|bisque|beige|azure|aquamarine|aqua|antiquewhite|aliceblue',
    fontRegex : /(\$|(&#36;))([\w \-\,Ã‚Â®]*)\|(.*)$/,
    repslsh : 'ÃƒÂ¸ÃƒÂº!#@&5nÃƒÂ¥ÃƒÂ¶EESCHEInoheÃƒÂ©ÃƒÂ¤',
    replink : 'ÃƒÂ©ÃƒÂ¤!#@&5nÃƒÂ¸ÃƒÂºENONHEInoheÃƒÂ¥ÃƒÂ¶',
    repnmliz : 'ÃƒÂ©ÃƒÂ¤!#@&5nÃƒÂ¸ÃƒÂ¶EESCHEInoheÃƒÂ©ÃƒÂ¤',
    multiple : function (str, mtch, rep, limit) {
        var ct = 0;
        limit = limit || 9;
        while (str.match(mtch) !== null && ct++ < limit) {
            str = str.replace(mtch, rep);
        }
        return str;
    },
    removeHTML : function (parsed) {
        var span = document.createElement('span');
        span.innerHTML = parsed;
        return span.textContent;
    },
    loadedFonts : {},
    addFont : function (family) {
        if (!this.loadedFonts[family]) {
            this.loadedFonts[family] = true;
            var stylesheet = document.createElement('link');
            stylesheet.rel = 'stylesheet';
            stylesheet.href = 'https://fonts.googleapis.com/css?family=' + encodeURIComponent(family);
            document.head.appendChild(stylesheet);
        }
    },
    getAllFonts : function (str) {
        var match;
        while (match = this.fontRegex.exec(str)) {
            str = str.replace(this.fontRegex, "$2");
            this.addFont(match[3]);
        }
    },
    escape : function (str) {
        // Convert chars to html codes
        str = str.replace(/\n/g, '\\n');
        str = str.replace(/&/gi, '&amp;');
        str = str.replace(/>/gi, '&gt;');
        str = str.replace(/</gi, '&lt;');
        str = str.replace(/"/gi, '&quot;');
        str = str.replace(/#/gi, '&#35;');
        str = str.replace(/\\n/g, '<br>');
        str = str.replace(/\$/gi, '&#36;');
        str = str.replace(/'/gi, '&#39;');
        str = str.replace(/~/gi, '&#126;');
        
        //convert spaces
        str = str.replace(/\s{2}/gi, ' &nbsp;');
        return str;
    },
    parse : function (str) {
        // Convert chars to html codes
        str = str.replace(/\n/g, '\\n');
        str = str.replace(/&/gi, '&amp;');
        str = str.replace(/>/gi, '&gt;');
        str = str.replace(/</gi, '&lt;');
        str = str.replace(/"/gi, '&quot;');
        str = str.replace(/#/gi, '&#35;');
        str = str.replace(/\\n/g, '<br>');
        str = str.replace(/\$/gi, '&#36;');
        str = str.replace(/'/gi, '&#39;');
        str = str.replace(/~/gi, '&#126;'); 
        
        //match user escaping
        var escs = str.match(/\\./g);
        str = str.replace(/\\./g, this.repslsh);
        
        //normalize text
        var normalize = /\/\`[^]/.test(str) ? str.match(/\/\`([^]+)$/)[1] : null;
        str = str.replace(/\/\`[^]+$/, this.repnmliz);
        
        //match qoutes
        str = str.replace(/&gt;&gt;/g,'>&gt;');
        var check = str.match(/>&gt;\d+/g);
        
        //match links
        var linkesc = str.match(this.linkreg);
        str = str.replace(this.linkreg,this.replink);
        
        //green text
        str = this.multiple(str, /(^|^[&#36;A-z\s|]+\s|^&#35;[A-z0-9]+\s|^[&#36;A-z\s|]+&#35;[A-z]+\s|<br>)\s?&gt;(.*?)(<br>|$)/g, '$1<span style="color:#789922;">>$2</span><br>');
        
        //styles
        str = this.multiple(str, /\/\^([^\|]+)\|?/g, '<big>$1</big>');
        str = this.multiple(str, /\/\*([^\|]+)\|?/g, '<b>$1</b>');
        str = this.multiple(str, /\/\%([^\|]+)\|?/g, '<i>$1</i>');
        str = this.multiple(str, /\/\_([^\|]+)\|?/g, '<u>$1</u>');
        str = this.multiple(str, /\/\-([^\|]+)\|?/g, '<strike>$1</strike>');
        str = this.multiple(str, /\/\&#126;([^\|]+)\|?/g, '<small>$1</small>');
        str = this.multiple(str, /\/\&#35;([^\|]+)\|?/g, '<span class="spoil">$1</span>');
        str = this.multiple(str, /\/\@([^\|]+)\|?/g, '<span style="text-shadow: 0 0 2px white;color: transparent;">$1</span>');
        str = this.multiple(str, /\/\+([^\|]+)\|?/g, '<span class="shake">$1</span>');
        str = this.multiple(str, /\/\!([^\|]+)\|?/g, '<span class="glow">$1</span>');
        /*
        -!Rainbows
        -ColourWrap
        */
        
        // Replace colors
        str = this.multiple(str, /&#35;&#35;&#35;([\da-f]{6}|[\da-f]{3})(.+)$/i, '<span style="text-shadow: 0px 0px 20px #$1,0px 0px 20px #$1,0px 0px 20px #$1,0px 0px 20px #$1;">$2</span>', 1000);
        str = this.multiple(str, /&#35;&#35;([\da-f]{6}|[\da-f]{3})(.+)$/i, '<span style="background-color: #$1;">$2</span>', 1000);
        str = this.multiple(str, /&#35;([\da-f]{6}|[\da-f]{3})(.+)$/i, '<span style="color: #$1;">$2</span>', 1000);
        str = this.multiple(str, RegExp('&#35;&#35;&#35;(' + this.coloreg + ')(.+)$', 'i'), '<span style="text-shadow: 0px 0px 20px $1,0px 0px 20px $1,0px 0px 20px $1,0px 0px 20px $1;">$2</span>', 1000);
        str = this.multiple(str, RegExp('&#35;&#35;(' + this.coloreg + ')(.+)$', 'i'), '<span style="background-color: $1;">$2</span>',1000);
        str = this.multiple(str, RegExp('&#35;(' + this.coloreg + ')(.+)$', 'i'), '<span style="color: $1;">$2</span>', 1000);
        
        //replace fonts
        str = this.multiple(str, this.fontRegex, '<span style="font-family:\'$3\'">$4</span>');
                
        //replace user escaping
        for (var i in escs)
            str = str.replace(this.repslsh, escs[i][1]);
              
        //replace links
        for (var i in linkesc){
            var link = linkesc[i];
            str = str.replace(this.replink, '<a target="_blank" href="' + link + '">' + link + '</a>');
        }
        
        //replace qoutes
        if(check){
            for(var i in check){
                var number = check[i].replace('>&gt;','');
                var found = document.getElementsByClassName('msg-' + number);
                if(found.length){
                    str = str.replace(check[i],'<a onmouseenter="parser.qoute(' + number + ');" onmouseout="document.body.removeChild(document.getElementById(\'qoute\'));" onclick="parser.highlight(' + number + ')">&gt;>' + number + '</a>');
                } else {
                    str = str.replace(check[i],'<a style=\'color:#AD0000;\'>' + check[i] + '</a>');
                }
            }
        }
        
        //video embeds
        str = str.replace(/<a [^>]*href="[^"]*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?"]*)[^"]*">([^<]*)<\/a>/, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'youtube\', \'$1\')" class="show-video">[video]</a>');
        str = str.replace(/<a [^>]*href="[^"]*vimeo.com\/(\d+)">([^<]*)<\/a>/, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'vimeo\', \'$1\')" class="show-video">[video]</a>');
        str = str.replace(/<a [^>]*href="[^"]*(?:soundcloud.com\/[\w-]+\/[\w-]+)">([^<]*)<\/a>/, '<a target="_blank" href="$1">$1</a> <a href="javascript:void(0)" onclick="soundCloud(\'$1\')" class="show-video">[audio]</a>');
        str = str.replace(/<a [^>]*href="[^"]*liveleak.com\/ll_embed\?f=(\w+)">([^<]*)<\/a>/, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'liveleak\', \'$1\')" class="show-video">[video]</a>');
        str = str.replace(/<a [^>]*href="([^'"]*\.webm)">([^<]*)<\/a>/i, '<a target="_blank" href="$1">$1</a> <a href="javascript:void(0)" onclick="embed(\'html5\', \'$1\')" class="show-video">[video]</a>');
        str = str.replace(/<a [^>]*href="([^'"]*\.mp3)">([^<]*)<\/a>/i, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'audio\', \'$1\')" class="show-video">[audio]</a>');
        str = str.replace(/<a [^>]*href="([^'"]*\.wav)">([^<]*)<\/a>/i, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'audio\', \'$1\')" class="show-video">[audio]</a>');
        str = str.replace(/<a [^>]*href="[^"]*ustream.tv\/embed\/(\d+)\?v=3&amp;wmode=direct">([^<]*)<\/a>/, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'ustream\', \'$1\')" class="show-video">[video]</a>');          
        
        var img = /(<a target="_blank" href="[^"]+?">)([^<]+?\.(?:agif|apng|gif|jpg|jpeg|png|bmp|svg))<\/a>/gi.exec(str);
        if (img) {
            str = this.multiple(str,img[0], img[1] + '<img src="' + img[2] + '" onload="awakens.scrollToBottom(\'messages\');"/></a>',3);
        }
        
        //replace normalied text
        if(normalize){
            str = str.replace(this.repnmliz,'<textarea style="overflow:hidden;">' + normalize.replace(/<br>/g,'\n') + '</textarea>');
        }
        
        //convert spaces
        str = str.replace(/\s{2}/gi, '&nbsp;');
        return str;
    }
};