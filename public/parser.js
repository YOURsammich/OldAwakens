//10:00am

var parser = {
    linkreg : /(http|https|ftp)\x3A\x2F\x2F(?:[\da-z](?:[\x2D\da-z]*[\da-z])?\.)+[\da-z](?:[\x2D\da-z]*[\da-z])?[a-z0-9\_\-\%\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\`\.]*/gi,
    clinkreg : /([a-z]+:\/\/(([0-9a-z\-\.]+\.[a-z]+\/[a-z0-9\_\-\~\:\/\?\#\[\]\@\!\$\&\'\%\(\)\*\+\,\;\=\`\.]+)|([0-9a-z\-\.]+\.[a-z]+\/)|([0-9a-z\-\.]+\.[a-z]+)))\[\{([\W\w]+)\}\]/gi,
    coloreg : 'yellowgreen|yellow|whitesmoke|white|wheat|violet|turquoise|tomato|thistle|teal|tan|steelblue|springgreen|snow|slategray|slateblue|skyblue|silver|sienna|seashell|seagreen|sandybrown|salmon|saddlebrown|royalblue|rosybrown|red|rebeccapurple|purple|powderblue|plum|pink|peru|peachpuff|papayawhip|palevioletred|paleturquoise|palegreen|palegoldenrod|orchid|orangered|orange|olivedrab|olive|oldlace|navy|navajowhite|moccasin|mistyrose|mintcream|midnightblue|mediumvioletred|mediumturquoise|mediumspringgreen|mediumslateblue|mediumseagreen|mediumpurple|mediumorchid|mediumblue|mediumaquamarine|maroon|magenta|linen|limegreen|lime|lightyellow|lightsteelblue|lightslategray|lightskyblue|lightseagreen|lightsalmon|lightpink|lightgreen|lightgray|lightgoldenrodyellow|lightcyan|lightcoral|lightblue|lemonchiffon|lawngreen|lavenderblush|lavender|khaki|ivory|indigo|indianred|hotpink|honeydew|greenyellow|green|gray|goldenrod|gold|ghostwhite|gainsboro|fuchsia|forestgreen|floralwhite|firebrick|dodgerblue|dimgray|deepskyblue|deeppink|darkviolet|darkturquoise|darkslategray|darkslateblue|darkseagreen|darksalmon|darkred|darkorchid|darkorange|darkolivegreen|darkmagenta|darkkhaki|darkgreen|darkgray|darkgoldenrod|darkcyan|darkblue|cyan|crimson|cornsilk|cornflowerblue|coral|chocolate|chartreuse|cadetblue|transparent|burlywood|brown|blueviolet|blue|blanchedalmond|black|bisque|beige|azure|aquamarine|aqua|antiquewhite|aliceblue',
    customFontRegex : /(\£|(£))([\w \-\,Ã‚Â®]*)\|(.*)$/,
    fontRegex : /(\$|(&#36;))([\w \-\,Ã‚Â®]*)\|(.*)$/,
    repslsh : 'ÃƒÂ¸ÃƒÂº!#@&5nÃƒÂ¥ÃƒÂ¶EESCHEInoheÃƒÂ.ÃƒÂ¤',
    replink : 'ÃƒÂ;ÃƒÂ¤!#@&5nÃƒÂ¸ÃƒÂºENONHEInoheÃƒÂ¥ÃƒÂ¶',
    repclink : 'ÃƒÂ;ÃƒÂ¤!#@&5cÃƒÂ¸ÃƒÂºENONHEInoheÃƒÂ¥ÃƒÂ¶',
    repnmliz : 'ÃƒÂ;ÃƒÂ¤!#@&5nÃƒÂ¸ÃƒÂ¶EESCHEInoheÃƒÂ_ÃƒÂ¤',
    matches : 6,
    multiple : function (str, mtch, rep, limit) {
        var ct = 0;
        limit = limit || 3000;
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
    addCustomFont : function (family) {
        if (!this.loadedFonts[family]) {
            this.loadedFonts[family] = true;
            var stylesheet = document.createElement('link');
            stylesheet.rel = 'stylesheet';
            stylesheet.href = '/fonts/' + encodeURIComponent(family) + ".css";
            document.head.appendChild(stylesheet);
        }
    },
    getAllFonts : function (str) {
        var match;
        while (match = this.fontRegex.exec(str)) {
            str = str.replace(this.fontRegex, "$2");
            this.addFont(match[3]);
        }
        while (match = this.customFontRegex.exec(str)) {
            str = str.replace(this.customFontRegex, "$2");
            this.addCustomFont(match[3]);
        }
    },
    highlight : function (messageNumber) {
        var message = document.getElementsByClassName('msg-' + messageNumber)[0];
        message.scrollIntoView();
    },
    showQuote : function (messageNumber) {
        var messageContainer = document.getElementsByClassName('msg-' + messageNumber)[0];
        if (messageContainer) {
            var quoteHolder = document.createElement('div');
            quoteHolder.id = 'qoute';
            quoteHolder.classList = 'message';
            quoteHolder.style.position = 'absolute';
            quoteHolder.style.pointerEvents = 'none';
            quoteHolder.innerHTML = messageContainer.innerHTML;

            document.body.appendChild(quoteHolder);
            //follow cursor
            document.body.addEventListener('mousemove', function(e){
                quoteHolder.style.left = e.clientX + 'px';
                quoteHolder.style.top = e.clientY + 'px';
            });
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
        
        str = str.replace(/(<br>)(.+)/g, '<div style="display:block;padding-left:3.5em;">$2</div>');
        return str;
    },
    wordReplace : function (str) {
        str = str.replace(/(roody poo)+?/gi, '<div>&#35;ff0000r&#35;ff001fo&#35;ff003eo&#35;ff005ed&#35;ff007dy&#35;ff009c&#35;ff00bcp&#35;ff00dbo&#35;ff00fao</div>');
        str = str.replace(/(nigger)+?/gi, '<div>&#35;ff0000r&#35;ff001fo&#35;ff003eo&#35;ff005ed&#35;ff007dy&#35;ff009c&#35;ff00bcp&#35;ff00dbo&#35;ff00fao</div>');
        str = str.replace(/(faggot)+?/gi, '<div>&#35;e300ffc&#35;c400ffa&#35;a500ffn&#35;8500ffd&#35;6600ffy&#35;4700ff&#35;2700ffa&#35;0800ffs&#35;0016ffs</div>');
        str = str.replace(/(candy ass)+?/gi, '<div>&#35;e300ffc&#35;c400ffa&#35;a500ffn&#35;8500ffd&#35;6600ffy&#35;4700ff&#35;2700ffa&#35;0800ffs&#35;0016ffs</div>');
        str = str.replace(/(moot)+?/gi, '<div>&#35;ff00bcm&#35;ff00dbi&#35;ff00fas&#35;e300ffs&#35;c400ffi&#35;a500ffn&#35;8500ffg&#35;6600ffn&#35;4700ffo</div>');
        str = str.replace(/(missingno)+?/gi, '<div>&#35;ff00bcm&#35;ff00dbi&#35;ff00fas&#35;e300ffs&#35;c400ffi&#35;a500ffn&#35;8500ffg&#35;6600ffn&#35;4700ffo</div>');
        str = str.replace(/(PENIS)+?/gi, '<div>&#35;2700ffP&#35;0800ffE&#35;0016ffN&#35;0036ffI&#35;0055ffS</div>');
        str = str.replace(/(mods)+?/gi, '<div>&#35;0075fft&#35;0094ffh&#35;00b3ffe&#35;00d3ff&#35;00f2ffp&#35;00ffece&#35;00ffcco&#35;00ffadp&#35;00ff8el&#35;00ff6ee&#35;00ff4f&&#35;39;&#35;00ff30s&#35;00ff10&#35;0eff00c&#35;2dff00h&#35;4dff00a&#35;6cff00m&#35;8cff00p&#35;abff00i&#35;caff00o&#35;eaff00n&#35;fff400s</div>');
        str = str.replace(/(brony)+?/gi, '<div>&#35;ffd500j&#35;ffb500a&#35;ff9600b&#35;ff7700r&#35;ff5700o&#35;ff3800n&#35;ff1900i&#35;ff0006s</div>');
        str = str.replace(/(bronies)+?/gi, '<div>&#35;ffd500j&#35;ffb500a&#35;ff9600b&#35;ff7700r&#35;ff5700o&#35;ff3800n&#35;ff1900i&#35;ff0006s</div>');
        str = str.replace(/(VAGINA)+?/gi, '<div>&#35;ff0083V&#35;ff00a3A&#35;ff00c2G&#35;ff00e1I&#35;fc00ffN&#35;dd00ffA</div>');
        str = str.replace(/(pony)+?/gi, '<div>&#35;00ffc6n&#35;00ffa7e&#35;00ff87w&#35;00ff68t&#35;00ff49&#35;00ff29g&#35;00ff0ai&#35;14ff00n&#35;34ff00g&#35;53ff00r&#35;72ff00i&#35;92ff00c&#35;b1ff00h</div>');
        str = str.replace(/(ponies)+?/gi, '<div>&#35;d1ff00s&#35;f0ff00t&#35;ffee00e&#35;ffce00v&#35;ffaf00e&#35;ff9000&#35;ff7000j&#35;ff5100o&#35;ff3200b&#35;ff1200s</div>');
        str = str.replace(/(4chan )+?/gi, '<div>&#35;8500ff9&#35;6600ffg&#35;4700ffa&#35;2700ffg</div>');
        str = str.replace(/( 4chan)+?/gi, '<div>&#35;8500ff9&#35;6600ffg&#35;4700ffa&#35;2700ffg</div>');
        str = str.replace(/(9gag)+?/gi, '<div>&#35;0800ffr&#35;0016ffe&#35;0036ffd&#35;0055ffd&#35;0075ffi&#35;0094fft</div>');
        str = str.replace(/(reddit)+?/gi, '<div>&#35;ff00db4&#35;ff00fac&#35;e300ffh&#35;c400ffa&#35;a500ffn</div>');
        str = str.replace(/(twitter)+?/gi, '<div>&#35;00b3fff&#35;00d3ffa&#35;00f2ffc&#35;00ffece&#35;00ffccb&#35;00ffado&#35;00ff8eo&#35;00ff6ek</div>');
        str = str.replace(/(facebook)+?/gi, '<div>&#35;00ff4fm&#35;00ff30y&#35;00ff10s&#35;0eff00p&#35;2dff00a&#35;4dff00c&#35;6cff00e</div>');
        str = str.replace(/(myspace)+?/gi, '<div>&#35;8cff00t&#35;abff00w&#35;caff00i&#35;eaff00t&#35;fff400t&#35;ffd500e&#35;ffb500r</div>');
        str = str.replace(/(newfag)+?/gi, '<div>&#35;ff000co&#35;ff002bl&#35;ff004bd&#35;ff006af&#35;ff0089a&#35;ff00a9g</div>');
        str = str.replace(/(wikipedia)+?/gi, '<div>&#35;e300ffe&#35;c400ffn&#35;a500ffc&#35;8500ffy&#35;6600ffc&#35;4700ffl&#35;2700ffo&#35;0800ffp&#35;0016ffe&#35;0036ffd&#35;0055ffi&#35;0075ffa&#35;0094ff&#35;00b3ffd&#35;00d3ffr&#35;00f2ffa&#35;00ffecm&#35;00ffcca&#35;00ffadt&#35;00ff8ei&#35;00ff6ec&#35;00ff4fa</div>');
        str = str.replace(/(encyclopedia dramatica)+?/gi, '<div>&#35;00ff30u&#35;00ff10n&#35;0eff00c&#35;2dff00y&#35;4dff00c&#35;6cff00l&#35;8cff00o&#35;abff00p&#35;caff00e&#35;eaff00d&#35;fff400i&#35;ffd500a</div>');
        str = str.replace(/(uncyclopedia)+?/gi, '<div>&#35;ff0000w&#35;ff001fi&#35;ff003ek&#35;ff005ei&#35;ff007dp&#35;ff009ce&#35;ff00bcd&#35;ff00dbi&#35;ff00faa</div>');
        str = str.replace(/(google)+?/gi, '<div>&#35;ff0006b&#35;ff0025i&#35;ff0044n&#35;ff0064g</div>');
        str = str.replace(/( bing)+?/gi, '<div>&#35;ff0083y&#35;ff00a3a&#35;ff00c2h&#35;ff00e1o&#35;fc00ffo</div>');
        str = str.replace(/(yahoo)+?/gi, '<div>&#35;ffb500g&#35;ff9600o&#35;ff7700o&#35;ff5700g&#35;ff3800l&#35;ff1900e</div>');
        str = str.replace(/( NSA)+?/gi, '<div>&#35;7f00ffI&#35;6000ffl&#35;4000ffl&#35;2100ffu&#35;0200ffm&#35;001dffi&#35;003cffn&#35;005bffa&#35;007bfft&#35;009affi</div>');
        str = str.replace(/(Illuminati)+?/gi, '<div>&#35;dd00ffN&#35;be00ffS&#35;9e00ffA</div>');
        str = str.replace(/(tumblr)+?/gi, '<div>&#35;555555cancer</div>');
        str = str.replace(/(gay)+?/gi, '<div>&#35;ff0000k&#35;ff001fa&#35;ff003ew&#35;ff005ea&#35;ff007di&#35;ff009ci</div>');
        str = str.replace(/(fag )+?/gi, '<div>&#35;ddff00c&#35;fcff00i&#35;ffe100s&#35;ffc200&#35;ffa300s&#35;ff8300c&#35;ff6400u&#35;ff4400m </div>');
        str = str.replace(/(rape)+?/gi, '<div>&#35;ff0000t&#35;ff001fi&#35;ff003ec&#35;ff005ek&#35;ff007dl&#35;ff009ce</div>');
        str = str.replace(/(piss)+?/gi, '<div>&#35;00ff04l&#35;1bff00e&#35;3aff00m&#35;59ff00o&#35;79ff00n&#35;98ff00a&#35;b7ff00d&#35;d7ff00e</div>');
        str = str.replace(/(loli )+?/gi, '<div>&#35;ff0c00S&#35;ff0012E&#35;ff0032M&#35;ff0051E&#35;ff0070N&#35;ff0090&#35;ff00afD&#35;ff00ceE&#35;ff00eeM&#35;f000ffO&#35;d100ffN&#35;b100ff!</div>');
        str = str.replace(/(semen)+?/gi,'&#35;27ff00m&#35;47ff00a&#35;66ff00y&#35;85ff00o&#35;a5ff00n&#35;c4ff00a&#35;e3ff00i&#35;fffa00s&#35;ffdb00e</div>');
        str = str.replace(/(edgy)+?/gi, '<div>&#35;cb0b0be&#35;971717d&#35;632323g&#35;2f2f2fy</div>');
        str = str.replace(/(sex)+?/gi, '<div>&#35;00ff00c&#35;00aa55a&#35;0055aat&#35;0000ffs</div>');
        str = str.replace(/(fuck)+?/gi, '<div>&#35;ff00ffd&#35;aa55ffu&#35;55aaffc&#35;00ffffk</div>');

        return str;
    },
    stylize : function(str) {
        // Replace styles
        str = this.multiple(str, /\/\^([^\|]+)\|?/g, '<big>$1</big>', this.matches);
        str = this.multiple(str, /\/\*([^\|]+)\|?/g, '<b>$1</b>', this.matches);
        str = this.multiple(str, /\/\%([^\|]+)\|?/g, '<span class="style italic">$1</span>', this.matches);
        str = this.multiple(str, /\/\_([^\|]+)\|?/g, '<u>$1</u>', this.matches);
        str = this.multiple(str, /\/\-([^\|]+)\|?/g, '<strike>$1</strike>', this.matches);
        str = this.multiple(str, /\/\&#126;([^\|]+)\|?/g, '<small>$1</small>', this.matches);
        str = this.multiple(str, /\/\&#35;([^\|]+)\|?/g, '<span class="spoilerImg spoil">$1</span>', this.matches);
        str = this.multiple(str, /\/\+([^\|]+)\|?/g, '<div class="style spin">$1</div>', this.matches);
        str = this.multiple(str, /\/\!([^\|]+)\|?/g, '<span class="style rainbow">$1</span>', this.matches);
        str = this.multiple(str, /\/\&#36;([^\|]+)\|?/g, '<span class="style shake">$1</span>', this.matches);
        str = this.multiple(str, /\/\@([^\|]+)\|?/g, '<span style="text-shadow: 0 0 2px white;color: transparent;">$1</span>', this.matches);
        return str;
    },
    color : function(str) {
        // Replace colors
        str = this.multiple(str, /&#35;&#35;&#35;([\da-f]{6}|[\da-f]{3})(.+)$/i, '<span style="text-shadow: 0px 0px 20px #$1,0px 0px 20px #$1,0px 0px 20px #$1,0px 0px 20px #$1;">$2</span>');
        str = this.multiple(str, /&#35;&#35;([\da-f]{6}|[\da-f]{3})(.+)$/i, '<span style="background-color: #$1;">$2</span>');
        str = this.multiple(str, /&#35;([\da-f]{6}|[\da-f]{3})(.+)$/i, '<span style="color: #$1;">$2</span>');
        str = this.multiple(str, RegExp('&#35;&#35;&#35;(' + this.coloreg + ')(.+)$', 'i'), '<span style="text-shadow: 0px 0px 20px $1,0px 0px 20px $1,0px 0px 20px $1,0px 0px 20px $1;">$2</span>');
        str = this.multiple(str, RegExp('&#35;&#35;(' + this.coloreg + ')(.+)$', 'i'), '<span style="background-color: $1;">$2</span>');
        str = this.multiple(str, RegExp('&#35;(' + this.coloreg + ')(.+)$', 'i'), '<span style="color: $1;">$2</span>');
        return str;
    },
    parse : function (str, wordReplace) {
        // Convert chars to html codes
        str = this.escape(str);

        //match user escaping
        var escs = str.match(/\\./g);
        str = str.replace(/\\./g, this.repslsh);

        //normalize text
        var normalize = /\/\`[^]/.test(str) ? str.match(/\/\`([^]+)$/)[1] : null;
        str = str.replace(/\/\`[^]+$/, this.repnmliz);

        //match quotes
        str = str.replace(/&gt;&gt;/g,'>&gt;');
        var check = str.match(/>&gt;\d+/g);

        //match clinks
        var clinks = str.match(this.clinkreg);
        str = str.replace(this.clinkreg, this.repclink);

        //match links
        var linkesc = str.match(this.linkreg);
        str = str.replace(this.linkreg, this.replink);
        
        //replace emoji shortcode
        str = emojione.toImage(str);

        //green text
        str = this.multiple(str, /(^|^[&#36;A-z\s|]+\s|^&#35;[A-z0-9]+\s|^[&#36;A-z\s|]+&#35;[A-z]+\s|<br>)\s?&gt;(.*?)(<br>|$)/g, '$1<span style="color:#789922;">>$2</span><br>');

        //styles
        str = this.stylize(str);

        if (wordReplace) {
            str = this.wordReplace(str);
        }
        
        str = this.color(str);

        //replace fonts
        str = this.multiple(str, this.fontRegex, '<span style="font-family:\'$3\'">$4</span>');
        str = this.multiple(str, this.customFontRegex, '<span style="font-family:\'$3\'">$4</span>');
        //replace user escaping
        for (var i in escs)
            str = str.replace(this.repslsh, escs[i][1]);

        //replace clinks
        for (var i in clinks){
            var link = clinks[i].replace(this.clinkreg, function(match, p1, p2, p3, p4, p5, p6){
                var name = p6;
                name = parser.stylize(name);
                name = parser.color(name);
                return '<a target="_blank" class="nlink" href="'+p1+'">'+name+'</a>';
            });
            str = str.replace(this.repclink, link);
        }

        //replace links
        for (var i in linkesc){
            var link = linkesc[i];
            str = str.replace(this.replink, '<a target="_blank" href="' + link + '">' + link + '</a>');
        }

        //replace qoutes
        if (check && check.length) {
            for(var i in check){
                var number = check[i].replace('>&gt;', '');
                var found = document.getElementsByClassName('msg-' + number);
                if (found.length) {
                    str = str.replace(check[i], '<a onmouseenter="parser.showQuote(' + number + ');" onmouseout="document.body.removeChild(document.getElementById(\'qoute\'));" onclick="parser.highlight(' + number + ')">&gt;&gt;' + number + '</a>');
                } else {
                    str = str.replace(check[i], '<a style=\'color:#AD0000;\'>' + check[i] + '</a>');
                }
            }
        }

        //video embeds
        str = str.replace(/<a [^>]*href="[^"]*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?"]*)[^"]*">([^<]*)<\/a>/, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'youtube\', \'$1\')" class="show-video">[video]</a>');
        str = str.replace(/<a [^>]*href="[^"]*vimeo.com\/(\d+)">([^<]*)<\/a>/, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'vimeo\', \'$1\')" class="show-video">[video]</a>');
        str = str.replace(/<a [^>]*href="[^"]*(?:soundcloud.com\/[\w-]+\/[\w-]+)">([^<]*)<\/a>/, '<a target="_blank" href="$1">$1</a> <a href="javascript:void(0)" onclick="soundCloud(\'$1\')" class="show-video">[audio]</a>');
        str = str.replace(/<a [^>]*href="[^"]*liveleak.com\/ll_embed\?f=(\w+)">([^<]*)<\/a>/, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'liveleak\', \'$1\')" class="show-video">[video]</a>');
        str = str.replace(/<a [^>]*href="([^'"]*\.webm)">([^<]*)<\/a>/i, '<a target="_blank" href="$1">$1</a> <a href="javascript:void(0)" onclick="embed(\'html5\', \'$1\')" class="show-video">[video]</a>');
        str = str.replace(/<a [^>]*href="([^'"]*\.mp4)">([^<]*)<\/a>/i, '<a target="_blank" href="$1">$1</a> <a href="javascript:void(0)" onclick="embed(\'html5\', \'$1\')" class="show-video">[video]</a>');
        str = str.replace(/<a [^>]*href="([^'"]*\.swf)">([^<]*)<\/a>/i, '<a target="_blank" href="$1">$1</a> <a href="javascript:void(0)" onclick="embed(\'swf\', \'$1\')" class="show-video">[video]</a>');
        str = str.replace(/<a [^>]*href="([^'"]*\.mp3)">([^<]*)<\/a>/i, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'audio\', \'$1\')" class="show-video">[audio]</a>');
        str = str.replace(/<a [^>]*href="([^'"]*\.wav)">([^<]*)<\/a>/i, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'audio\', \'$1\')" class="show-video">[audio]</a>');
        str = str.replace(/<a [^>]*href="[^"]*ustream.tv\/embed\/(\d+)\?v=3&amp;wmode=direct">([^<]*)<\/a>/, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'ustream\', \'$1\')" class="show-video">[video]</a>');

        var img = /(<a target="_blank" href="[^"]+?">)([^<]+?\.(?:agif|apng|gif|jpg|jpeg|png|bmp|svg))<\/a>/gi.exec(str);
        if (img && Attributes.get('toggle-images')) {
            str = this.multiple(str, img[0], img[1] + '<img src="' + img[2] + '" onload="messageBuilder.scrollToBottom(\'messages\');"/></a>', 3);
        }

        //replace normalied text
        if (normalize) {
            str = str.replace(this.repnmliz, '<textarea style="overflow:hidden;">' + normalize.replace(/<br>/g, '&#13;') + '</textarea>');
        }
        
        //.replace(/(<br>)(.+)/, '<div>$2</div>')
        return str;
    },
    parseImage : function(bin, type){
        var b64 = window.btoa(bin);
        var str = '<a target="_blank" href="data:'+type+";base64," + b64 + '">';
        if (Attributes.get('toggle-images')) {
            str += '<img src="data:'+type+";base64," + b64 + '">';
        } else {
            str += '[Image]';
        }
        str += '</a>';
        return str;
    },
    changeInput : function(type, value) {
        /*if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
            if (type == 'font') {
                $$$.query(':-moz-read-write').style['font-family'] = value;
            } else {
                $$$.query(':-moz-read-write').style['color'] = value;
            }
        } else {
            if (type == 'font'){
                $$$.query(':read-write').style['font-family'] = value;
            } else {
                $$$.query(':read-write').style['color'] = value;
            }
            
            
        }*/
    }
};
