var parser = {
    linkreg : /(http|https|ftp)\x3A\x2F\x2F(?:[\da-z](?:[\x2D\da-z]*[\da-z])?\.)+[\da-z](?:[\x2D\da-z]*[\da-z])?[a-z0-9\_\-\%\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\`\.]*/gi,
    clinkreg : /([a-z]+:\/\/(([0-9a-z\-\.]+\.[a-z]+\/[a-z0-9\_\-\~\:\/\?\#\[\]\@\!\$\&\'\%\(\)\*\+\,\;\=\`\.]+)|([0-9a-z\-\.]+\.[a-z]+\/)|([0-9a-z\-\.]+\.[a-z]+)))\[\{([\W\w]+)\}\]/gi,
    coloreg : 'yellowgreen|yellow|whitesmoke|white|wheat|violet|turquoise|tomato|thistle|teal|tan|steelblue|springgreen|snow|slategray|slateblue|skyblue|silver|sienna|seashell|seagreen|sandybrown|salmon|saddlebrown|royalblue|rosybrown|red|rebeccapurple|purple|powderblue|plum|pink|peru|peachpuff|papayawhip|palevioletred|paleturquoise|palegreen|palegoldenrod|orchid|orangered|orange|olivedrab|olive|oldlace|navy|navajowhite|moccasin|mistyrose|mintcream|midnightblue|mediumvioletred|mediumturquoise|mediumspringgreen|mediumslateblue|mediumseagreen|mediumpurple|mediumorchid|mediumblue|mediumaquamarine|maroon|magenta|linen|limegreen|lime|lightyellow|lightsteelblue|lightslategray|lightskyblue|lightseagreen|lightsalmon|lightpink|lightgreen|lightgray|lightgoldenrodyellow|lightcyan|lightcoral|lightblue|lemonchiffon|lawngreen|lavenderblush|lavender|khaki|ivory|indigo|indianred|hotpink|honeydew|greenyellow|green|gray|goldenrod|gold|ghostwhite|gainsboro|fuchsia|forestgreen|floralwhite|firebrick|dodgerblue|dimgray|deepskyblue|deeppink|darkviolet|darkturquoise|darkslategray|darkslateblue|darkseagreen|darksalmon|darkred|darkorchid|darkorange|darkolivegreen|darkmagenta|darkkhaki|darkgreen|darkgray|darkgoldenrod|darkcyan|darkblue|cyan|crimson|cornsilk|cornflowerblue|coral|chocolate|chartreuse|cadetblue|transparent|burlywood|brown|blueviolet|blue|blanchedalmond|black|bisque|beige|azure|aquamarine|aqua|antiquewhite|aliceblue',
    customFontRegex : /(\£|(£))([\w \-\,Ã‚Â®]*)\|(.*)$/,
    fontRegex : /(\$|(&#36;))([\w \-\,Ã‚Â®]*)(\:([1-9]00|bold|lighter|bolder))?\|(.*)$/,
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
    findFontName : function (font) {
        var fonts = ["ABeeZee","Abel","Abhaya Libre","Abril Fatface","Aclonica","Acme","Actor","Adamina","Advent Pro","Aguafina Script","Akronim","Aladin","Aldrich","Alef","Alegreya","Alegreya SC","Alegreya Sans","Alegreya Sans SC","Alex Brush","Alfa Slab One","Alice","Alike","Alike Angular","Allan","Allerta","Allerta Stencil","Allura","Almendra","Almendra Display","Almendra SC","Amarante","Amaranth","Amatic SC","Amatica SC","Amethysta","Amiko","Amiri","Amita","Anaheim","Andada","Andika","Angkor","Annie Use Your Telescope","Anonymous Pro","Antic","Antic Didone","Antic Slab","Anton","Arapey","Arbutus","Arbutus Slab","Architects Daughter","Archivo Black","Archivo Narrow","Aref Ruqaa","Arima Madurai","Arimo","Arizonia","Armata","Arsenal","Artifika","Arvo","Arya","Asap","Asar","Asset","Assistant","Astloch","Asul","Athiti","Atma","Atomic Age","Aubrey","Audiowide","Autour One","Average","Average Sans","Averia Gruesa Libre","Averia Libre","Averia Sans Libre","Averia Serif Libre","Bad Script","Bahiana","Baloo","Baloo Bhai","Baloo Bhaina","Baloo Chettan","Baloo Da","Baloo Paaji","Baloo Tamma","Baloo Thambi","Balthazar","Bangers","Barrio","Basic","Battambang","Baumans","Bayon","Belgrano","Bellefair","Belleza","BenchNine","Bentham","Berkshire Swash","Bevan","Bigelow Rules","Bigshot One","Bilbo","Bilbo Swash Caps","BioRhyme","BioRhyme Expanded","Biryani","Bitter","Black Ops One","Bokor","Bonbon","Boogaloo","Bowlby One","Bowlby One SC","Brawler","Bree Serif","Bubblegum Sans","Bubbler One","Buda","Buenard","Bungee","Bungee Hairline","Bungee Inline","Bungee Outline","Bungee Shade","Butcherman","Butterfly Kids","Cabin","Cabin Condensed","Cabin Sketch","Caesar Dressing","Cagliostro","Cairo","Calligraffitti","Cambay","Cambo","Candal","Cantarell","Cantata One","Cantora One","Capriola","Cardo","Carme","Carrois Gothic","Carrois Gothic SC","Carter One","Catamaran","Caudex","Caveat","Caveat Brush","Cedarville Cursive","Ceviche One","Changa","Changa One","Chango","Chathura","Chau Philomene One","Chela One","Chelsea Market","Chenla","Cherry Cream Soda","Cherry Swash","Chewy","Chicle","Chivo","Chonburi","Cinzel","Cinzel Decorative","Clicker Script","Coda","Coda Caption","Codystar","Coiny","Combo","Comfortaa","Coming Soon","Concert One","Condiment","Content","Contrail One","Convergence","Cookie","Copse","Corben","Cormorant","Cormorant Garamond","Cormorant Infant","Cormorant SC","Cormorant Unicase","Cormorant Upright","Courgette","Cousine","Coustard","Covered By Your Grace","Crafty Girls","Creepster","Crete Round","Crimson Text","Croissant One","Crushed","Cuprum","Cutive","Cutive Mono","Damion","Dancing Script","Dangrek","David Libre","Dawning of a New Day","Days One","Dekko","Delius","Delius Swash Caps","Delius Unicase","Della Respira","Denk One","Devonshire","Dhurjati","Didact Gothic","Diplomata","Diplomata SC","Domine","Donegal One","Doppio One","Dorsa","Dosis","Dr Sugiyama","Droid Sans","Droid Sans Mono","Droid Serif","Duru Sans","Dynalight","EB Garamond","Eagle Lake","Eater","Economica","Eczar","Ek Mukta","El Messiri","Electrolize","Elsie","Elsie Swash Caps","Emblema One","Emilys Candy","Engagement","Englebert","Enriqueta","Erica One","Esteban","Euphoria Script","Ewert","Exo","Exo 2","Expletus Sans","Fanwood Text","Farsan","Fascinate","Fascinate Inline","Faster One","Fasthand","Fauna One","Federant","Federo","Felipa","Fenix","Finger Paint","Fira Mono","Fira Sans","Fira Sans Condensed","Fira Sans Extra Condensed","Fjalla One","Fjord One","Flamenco","Flavors","Fondamento","Fontdiner Swanky","Forum","Francois One","Frank Ruhl Libre","Freckle Face","Fredericka the Great","Fredoka One","Freehand","Fresca","Frijole","Fruktur","Fugaz One","GFS Didot","GFS Neohellenic","Gabriela","Gafata","Galada","Galdeano","Galindo","Gentium Basic","Gentium Book Basic","Geo","Geostar","Geostar Fill","Germania One","Gidugu","Gilda Display","Give You Glory","Glass Antiqua","Glegoo","Gloria Hallelujah","Goblin One","Gochi Hand","Gorditas","Goudy Bookletter 1911","Graduate","Grand Hotel","Gravitas One","Great Vibes","Griffy","Gruppo","Gudea","Gurajada","Habibi","Halant","Hammersmith One","Hanalei","Hanalei Fill","Handlee","Hanuman","Happy Monkey","Harmattan","Headland One","Heebo","Henny Penny","Herr Von Muellerhoff","Hind","Hind Guntur","Hind Madurai","Hind Siliguri","Hind Vadodara","Holtwood One SC","Homemade Apple","Homenaje","IM Fell DW Pica","IM Fell DW Pica SC","IM Fell Double Pica","IM Fell Double Pica SC","IM Fell English","IM Fell English SC","IM Fell French Canon","IM Fell French Canon SC","IM Fell Great Primer","IM Fell Great Primer SC","Iceberg","Iceland","Imprima","Inconsolata","Inder","Indie Flower","Inika","Inknut Antiqua","Irish Grover","Istok Web","Italiana","Italianno","Itim","Jacques Francois","Jacques Francois Shadow","Jaldi","Jim Nightshade","Jockey One","Jolly Lodger","Jomhuria","Josefin Sans","Josefin Slab","Joti One","Judson","Julee","Julius Sans One","Junge","Jura","Just Another Hand","Just Me Again Down Here","Kadwa","Kalam","Kameron","Kanit","Kantumruy","Karla","Karma","Katibeh","Kaushan Script","Kavivanar","Kavoon","Kdam Thmor","Keania One","Kelly Slab","Kenia","Khand","Khmer","Khula","Kite One","Knewave","Kotta One","Koulen","Kranky","Kreon","Kristi","Krona One","Kumar One","Kumar One Outline","Kurale","La Belle Aurore","Laila","Lakki Reddy","Lalezar","Lancelot","Lateef","Lato","League Script","Leckerli One","Ledger","Lekton","Lemon","Lemonada","Libre Baskerville","Libre Franklin","Life Savers","Lilita One","Lily Script One","Limelight","Linden Hill","Lobster","Lobster Two","Londrina Outline","Londrina Shadow","Londrina Sketch","Londrina Solid","Lora","Love Ya Like A Sister","Loved by the King","Lovers Quarrel","Luckiest Guy","Lusitana","Lustria","Macondo","Macondo Swash Caps","Mada","Magra","Maiden Orange","Maitree","Mako","Mallanna","Mandali","Marcellus","Marcellus SC","Marck Script","Margarine","Marko One","Marmelad","Martel","Martel Sans","Marvel","Mate","Mate SC","Maven Pro","McLaren","Meddon","MedievalSharp","Medula One","Meera Inimai","Megrim","Meie Script","Merienda","Merienda One","Merriweather","Merriweather Sans","Metal","Metal Mania","Metamorphous","Metrophobic","Michroma","Milonga","Miltonian","Miltonian Tattoo","Miniver","Miriam Libre","Mirza","Miss Fajardose","Mitr","Modak","Modern Antiqua","Mogra","Molengo","Molle","Monda","Monofett","Monoton","Monsieur La Doulaise","Montaga","Montez","Montserrat","Montserrat Alternates","Montserrat Subrayada","Moul","Moulpali","Mountains of Christmas","Mouse Memoirs","Mr Bedfort","Mr Dafoe","Mr De Haviland","Mrs Saint Delafield","Mrs Sheppards","Mukta Vaani","Muli","Mystery Quest","NTR","Neucha","Neuton","New Rocker","News Cycle","Niconne","Nixie One","Nobile","Nokora","Norican","Nosifer","Nothing You Could Do","Noticia Text","Noto Sans","Noto Serif","Nova Cut","Nova Flat","Nova Mono","Nova Oval","Nova Round","Nova Script","Nova Slim","Nova Square","Numans","Nunito","Nunito Sans","Odor Mean Chey","Offside","Old Standard TT","Oldenburg","Oleo Script","Oleo Script Swash Caps","Open Sans","Open Sans Condensed","Oranienbaum","Orbitron","Oregano","Orienta","Original Surfer","Oswald","Over the Rainbow","Overlock","Overlock SC","Overpass","Overpass Mono","Ovo","Oxygen","Oxygen Mono","PT Mono","PT Sans","PT Sans Caption","PT Sans Narrow","PT Serif","PT Serif Caption","Pacifico","Padauk","Palanquin","Palanquin Dark","Pangolin","Paprika","Parisienne","Passero One","Passion One","Pathway Gothic One","Patrick Hand","Patrick Hand SC","Pattaya","Patua One","Pavanam","Paytone One","Peddana","Peralta","Permanent Marker","Petit Formal Script","Petrona","Philosopher","Piedra","Pinyon Script","Pirata One","Plaster","Play","Playball","Playfair Display","Playfair Display SC","Podkova","Poiret One","Poller One","Poly","Pompiere","Pontano Sans","Poppins","Port Lligat Sans","Port Lligat Slab","Pragati Narrow","Prata","Preahvihear","Press Start 2P","Pridi","Princess Sofia","Prociono","Prompt","Prosto One","Proza Libre","Puritan","Purple Purse","Quando","Quantico","Quattrocento","Quattrocento Sans","Questrial","Quicksand","Quintessential","Qwigley","Racing Sans One","Radley","Rajdhani","Rakkas","Raleway","Raleway Dots","Ramabhadra","Ramaraja","Rambla","Rammetto One","Ranchers","Rancho","Ranga","Rasa","Rationale","Ravi Prakash","Redressed","Reem Kufi","Reenie Beanie","Revalia","Rhodium Libre","Ribeye","Ribeye Marrow","Righteous","Risque","Roboto","Roboto Condensed","Roboto Mono","Roboto Slab","Rochester","Rock Salt","Rokkitt","Romanesco","Ropa Sans","Rosario","Rosarivo","Rouge Script","Rozha One","Rubik","Rubik Mono One","Ruda","Rufina","Ruge Boogie","Ruluko","Rum Raisin","Ruslan Display","Russo One","Ruthie","Rye","Sacramento","Sahitya","Sail","Salsa","Sanchez","Sancreek","Sansita","Sarala","Sarina","Sarpanch","Satisfy","Scada","Scheherazade","Schoolbell","Scope One","Seaweed Script","Secular One","Sevillana","Seymour One","Shadows Into Light","Shadows Into Light Two","Shanti","Share","Share Tech","Share Tech Mono","Shojumaru","Short Stack","Shrikhand","Siemreap","Sigmar One","Signika","Signika Negative","Simonetta","Sintony","Sirin Stencil","Six Caps","Skranji","Slabo 13px","Slabo 27px","Slackey","Smokum","Smythe","Sniglet","Snippet","Snowburst One","Sofadi One","Sofia","Sonsie One","Sorts Mill Goudy","Source Code Pro","Source Sans Pro","Source Serif Pro","Space Mono","Special Elite","Spectral","Spicy Rice","Spinnaker","Spirax","Squada One","Sree Krushnadevaraya","Sriracha","Stalemate","Stalinist One","Stardos Stencil","Stint Ultra Condensed","Stint Ultra Expanded","Stoke","Strait","Sue Ellen Francisco","Suez One","Sumana","Sunshiney","Supermercado One","Sura","Suranna","Suravaram","Suwannaphum","Swanky and Moo Moo","Syncopate","Tangerine","Taprom","Tauri","Taviraj","Teko","Telex","Tenali Ramakrishna","Tenor Sans","Text Me One","The Girl Next Door","Tienne","Tillana","Timmana","Tinos","Titan One","Titillium Web","Trade Winds","Trirong","Trocchi","Trochut","Trykker","Tulpen One","Ubuntu","Ubuntu Condensed","Ubuntu Mono","Ultra","Uncial Antiqua","Underdog","Unica One","UnifrakturCook","UnifrakturMaguntia","Unkempt","Unlock","Unna","VT323","Vampiro One","Varela","Varela Round","Vast Shadow","Vesper Libre","Vibur","Vidaloka","Viga","Voces","Volkhov","Vollkorn","Voltaire","Waiting for the Sunrise","Wallpoet","Walter Turncoat","Warnes","Wellfleet","Wendy One","Wire One","Work Sans","Yanone Kaffeesatz","Yantramanav","Yatra One","Yellowtail","Yeseva One","Yesteryear","Yrsa","Zeyada","Zilla Slab"];
        var testfonts = ["abeezee","abel","abhaya libre","abril fatface","aclonica","acme","actor","adamina","advent pro","aguafina script","akronim","aladin","aldrich","alef","alegreya","alegreya sc","alegreya sans","alegreya sans sc","alex brush","alfa slab one","alice","alike","alike angular","allan","allerta","allerta stencil","allura","almendra","almendra display","almendra sc","amarante","amaranth","amatic sc","amatica sc","amethysta","amiko","amiri","amita","anaheim","andada","andika","angkor","annie use your telescope","anonymous pro","antic","antic didone","antic slab","anton","arapey","arbutus","arbutus slab","architects daughter","archivo black","archivo narrow","aref ruqaa","arima madurai","arimo","arizonia","armata","arsenal","artifika","arvo","arya","asap","asar","asset","assistant","astloch","asul","athiti","atma","atomic age","aubrey","audiowide","autour one","average","average sans","averia gruesa libre","averia libre","averia sans libre","averia serif libre","bad script","bahiana","baloo","baloo bhai","baloo bhaina","baloo chettan","baloo da","baloo paaji","baloo tamma","baloo thambi","balthazar","bangers","barrio","basic","battambang","baumans","bayon","belgrano","bellefair","belleza","benchnine","bentham","berkshire swash","bevan","bigelow rules","bigshot one","bilbo","bilbo swash caps","biorhyme","biorhyme expanded","biryani","bitter","black ops one","bokor","bonbon","boogaloo","bowlby one","bowlby one sc","brawler","bree serif","bubblegum sans","bubbler one","buda","buenard","bungee","bungee hairline","bungee inline","bungee outline","bungee shade","butcherman","butterfly kids","cabin","cabin condensed","cabin sketch","caesar dressing","cagliostro","cairo","calligraffitti","cambay","cambo","candal","cantarell","cantata one","cantora one","capriola","cardo","carme","carrois gothic","carrois gothic sc","carter one","catamaran","caudex","caveat","caveat brush","cedarville cursive","ceviche one","changa","changa one","chango","chathura","chau philomene one","chela one","chelsea market","chenla","cherry cream soda","cherry swash","chewy","chicle","chivo","chonburi","cinzel","cinzel decorative","clicker script","coda","coda caption","codystar","coiny","combo","comfortaa","coming soon","concert one","condiment","content","contrail one","convergence","cookie","copse","corben","cormorant","cormorant garamond","cormorant infant","cormorant sc","cormorant unicase","cormorant upright","courgette","cousine","coustard","covered by your grace","crafty girls","creepster","crete round","crimson text","croissant one","crushed","cuprum","cutive","cutive mono","damion","dancing script","dangrek","david libre","dawning of a new day","days one","dekko","delius","delius swash caps","delius unicase","della respira","denk one","devonshire","dhurjati","didact gothic","diplomata","diplomata sc","domine","donegal one","doppio one","dorsa","dosis","dr sugiyama","droid sans","droid sans mono","droid serif","duru sans","dynalight","eb garamond","eagle lake","eater","economica","eczar","ek mukta","el messiri","electrolize","elsie","elsie swash caps","emblema one","emilys candy","engagement","englebert","enriqueta","erica one","esteban","euphoria script","ewert","exo","exo 2","expletus sans","fanwood text","farsan","fascinate","fascinate inline","faster one","fasthand","fauna one","federant","federo","felipa","fenix","finger paint","fira mono","fira sans","fira sans condensed","fira sans extra condensed","fjalla one","fjord one","flamenco","flavors","fondamento","fontdiner swanky","forum","francois one","frank ruhl libre","freckle face","fredericka the great","fredoka one","freehand","fresca","frijole","fruktur","fugaz one","gfs didot","gfs neohellenic","gabriela","gafata","galada","galdeano","galindo","gentium basic","gentium book basic","geo","geostar","geostar fill","germania one","gidugu","gilda display","give you glory","glass antiqua","glegoo","gloria hallelujah","goblin one","gochi hand","gorditas","goudy bookletter 1911","graduate","grand hotel","gravitas one","great vibes","griffy","gruppo","gudea","gurajada","habibi","halant","hammersmith one","hanalei","hanalei fill","handlee","hanuman","happy monkey","harmattan","headland one","heebo","henny penny","herr von muellerhoff","hind","hind guntur","hind madurai","hind siliguri","hind vadodara","holtwood one sc","homemade apple","homenaje","im fell dw pica","im fell dw pica sc","im fell double pica","im fell double pica sc","im fell english","im fell english sc","im fell french canon","im fell french canon sc","im fell great primer","im fell great primer sc","iceberg","iceland","imprima","inconsolata","inder","indie flower","inika","inknut antiqua","irish grover","istok web","italiana","italianno","itim","jacques francois","jacques francois shadow","jaldi","jim nightshade","jockey one","jolly lodger","jomhuria","josefin sans","josefin slab","joti one","judson","julee","julius sans one","junge","jura","just another hand","just me again down here","kadwa","kalam","kameron","kanit","kantumruy","karla","karma","katibeh","kaushan script","kavivanar","kavoon","kdam thmor","keania one","kelly slab","kenia","khand","khmer","khula","kite one","knewave","kotta one","koulen","kranky","kreon","kristi","krona one","kumar one","kumar one outline","kurale","la belle aurore","laila","lakki reddy","lalezar","lancelot","lateef","lato","league script","leckerli one","ledger","lekton","lemon","lemonada","libre baskerville","libre franklin","life savers","lilita one","lily script one","limelight","linden hill","lobster","lobster two","londrina outline","londrina shadow","londrina sketch","londrina solid","lora","love ya like a sister","loved by the king","lovers quarrel","luckiest guy","lusitana","lustria","macondo","macondo swash caps","mada","magra","maiden orange","maitree","mako","mallanna","mandali","marcellus","marcellus sc","marck script","margarine","marko one","marmelad","martel","martel sans","marvel","mate","mate sc","maven pro","mclaren","meddon","medievalsharp","medula one","meera inimai","megrim","meie script","merienda","merienda one","merriweather","merriweather sans","metal","metal mania","metamorphous","metrophobic","michroma","milonga","miltonian","miltonian tattoo","miniver","miriam libre","mirza","miss fajardose","mitr","modak","modern antiqua","mogra","molengo","molle","monda","monofett","monoton","monsieur la doulaise","montaga","montez","montserrat","montserrat alternates","montserrat subrayada","moul","moulpali","mountains of christmas","mouse memoirs","mr bedfort","mr dafoe","mr de haviland","mrs saint delafield","mrs sheppards","mukta vaani","muli","mystery quest","ntr","neucha","neuton","new rocker","news cycle","niconne","nixie one","nobile","nokora","norican","nosifer","nothing you could do","noticia text","noto sans","noto serif","nova cut","nova flat","nova mono","nova oval","nova round","nova script","nova slim","nova square","numans","nunito","nunito sans","odor mean chey","offside","old standard tt","oldenburg","oleo script","oleo script swash caps","open sans","open sans condensed","oranienbaum","orbitron","oregano","orienta","original surfer","oswald","over the rainbow","overlock","overlock sc","overpass","overpass mono","ovo","oxygen","oxygen mono","pt mono","pt sans","pt sans caption","pt sans narrow","pt serif","pt serif caption","pacifico","padauk","palanquin","palanquin dark","pangolin","paprika","parisienne","passero one","passion one","pathway gothic one","patrick hand","patrick hand sc","pattaya","patua one","pavanam","paytone one","peddana","peralta","permanent marker","petit formal script","petrona","philosopher","piedra","pinyon script","pirata one","plaster","play","playball","playfair display","playfair display sc","podkova","poiret one","poller one","poly","pompiere","pontano sans","poppins","port lligat sans","port lligat slab","pragati narrow","prata","preahvihear","press start 2p","pridi","princess sofia","prociono","prompt","prosto one","proza libre","puritan","purple purse","quando","quantico","quattrocento","quattrocento sans","questrial","quicksand","quintessential","qwigley","racing sans one","radley","rajdhani","rakkas","raleway","raleway dots","ramabhadra","ramaraja","rambla","rammetto one","ranchers","rancho","ranga","rasa","rationale","ravi prakash","redressed","reem kufi","reenie beanie","revalia","rhodium libre","ribeye","ribeye marrow","righteous","risque","roboto","roboto condensed","roboto mono","roboto slab","rochester","rock salt","rokkitt","romanesco","ropa sans","rosario","rosarivo","rouge script","rozha one","rubik","rubik mono one","ruda","rufina","ruge boogie","ruluko","rum raisin","ruslan display","russo one","ruthie","rye","sacramento","sahitya","sail","salsa","sanchez","sancreek","sansita","sarala","sarina","sarpanch","satisfy","scada","scheherazade","schoolbell","scope one","seaweed script","secular one","sevillana","seymour one","shadows into light","shadows into light two","shanti","share","share tech","share tech mono","shojumaru","short stack","shrikhand","siemreap","sigmar one","signika","signika negative","simonetta","sintony","sirin stencil","six caps","skranji","slabo 13px","slabo 27px","slackey","smokum","smythe","sniglet","snippet","snowburst one","sofadi one","sofia","sonsie one","sorts mill goudy","source code pro","source sans pro","source serif pro","space mono","special elite","spectral","spicy rice","spinnaker","spirax","squada one","sree krushnadevaraya","sriracha","stalemate","stalinist one","stardos stencil","stint ultra condensed","stint ultra expanded","stoke","strait","sue ellen francisco","suez one","sumana","sunshiney","supermercado one","sura","suranna","suravaram","suwannaphum","swanky and moo moo","syncopate","tangerine","taprom","tauri","taviraj","teko","telex","tenali ramakrishna","tenor sans","text me one","the girl next door","tienne","tillana","timmana","tinos","titan one","titillium web","trade winds","trirong","trocchi","trochut","trykker","tulpen one","ubuntu","ubuntu condensed","ubuntu mono","ultra","uncial antiqua","underdog","unica one","unifrakturcook","unifrakturmaguntia","unkempt","unlock","unna","vt323","vampiro one","varela","varela round","vast shadow","vesper libre","vibur","vidaloka","viga","voces","volkhov","vollkorn","voltaire","waiting for the sunrise","wallpoet","walter turncoat","warnes","wellfleet","wendy one","wire one","work sans","yanone kaffeesatz","yantramanav","yatra one","yellowtail","yeseva one","yesteryear","yrsa","zeyada","zilla slab"];
        if (testfonts.indexOf(font.toLowerCase()) > -1) {
            return fonts[testfonts.indexOf(font.toLowerCase())];
        } else {
            return font;
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
        
        if (message) {
            message.scrollIntoView();   
        }
    },
    showQuote : function (messageNumber) {
        var container = document.getElementById('messages');
        var messageContainer = messageBuilder.storedMessages.main[messageNumber];
        if (messageContainer && messageContainer.el) {
            var quoteHolder = document.createElement('div');
            quoteHolder.id = 'qoute';
            quoteHolder.classList = 'message';
            quoteHolder.style.position = 'absolute';
            quoteHolder.style.pointerEvents = 'none';
            quoteHolder.innerHTML = messageContainer.el.innerHTML;

            document.body.appendChild(quoteHolder);
            //follow cursor
            container.addEventListener('mousemove', function (e) {
                if (e.clientY + messageContainer.el.offsetHeight > container.offsetHeight) {
                    quoteHolder.style.top = container.offsetHeight - messageContainer.el.offsetHeight + 'px'
                } else {
                    quoteHolder.style.top = e.clientY + 'px';
                }

                quoteHolder.style.left = e.clientX + 'px';
            });
        }
    },
    escape : function (str, noFormat) {
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
        
        if (!noFormat) {
            str = str.replace(/(<br>)(.+)/g, '<div style="display:block;padding-left:3.5em;">$2</div>');
        }
        return str;
    },
    wordReplace : function (str) {
        var filters = Attributes.get('filteredWords'),
            keys,
            i;
        if (filters) {
            keys = Object.keys(filters);
            for (i = 0; i < keys.length; i++) {
                str = str.replace(new RegExp('(' + keys[i] + ')', "gi"), '<div>' + parser.escape(filters[keys[i]]) + '</div>');
            }
        }

        return str;
    },
    stylize : function(str) {
        // Replace styles
        //str = this.multiple(str, /\/\%%([^\|]+)\|?/g, '<span class="style wave">$1</span>', this.matches);
        str = this.multiple(str, /\/\%%([^]+)\%%/g, '<div>$1</div>', this.matches);
        str = this.multiple(str, /\/\^([^\|]+)\|?/g, '<big>$1</big>', this.matches);
        str = this.multiple(str, /\/\*([^\|]+)\|?/g, '<b>$1</b>', this.matches);
        str = this.multiple(str, /\/\%([^\|]+)\|?/g, '<span class="style italic">$1</span>', this.matches);
        str = this.multiple(str, /\/\_([^\|]+)\|?/g, '<u>$1</u>', this.matches);
        str = this.multiple(str, /\/\-([^\|]+)\|?/g, '<strike>$1</strike>', this.matches);
        str = this.multiple(str, /\/\&#126;([^\|]+)\|?/g, '<small>$1</small>', this.matches);
        str = this.multiple(str, /\/\&#35;([^\|]+)\|?/g, '<span class="spoilerImg spoil">$1</span>', this.matches);
        str = this.multiple(str, /\/\+([^\|]+)\|?/g, '<span class="style spin">$1</span>', this.matches);
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
    parse : function (str, wordReplace, noFormat) {
        while (str.split(/\n/).length > 15) {
            var index = str.lastIndexOf('\n');
            str = str.slice(0, index) + str.slice(index + 1);
        }
        
        // Convert chars to html codes
        str = this.escape(str, noFormat);
        
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
        str = this.multiple(str, this.fontRegex, function(match, p1, p2, p3, p4, p5, p6){
            var font = parser.findFontName(p3);
            if (typeof p5 === "undefined") {
                parser.addFont(font);
                return '<span style="font-family:\''+font+'\'">'+p6+'</span>';
            } else {
                parser.addFont(font+":"+p5);
                return '<span style="font-family:\''+font+'\';font-weight: '+p5+'">'+p6+'</span>';
            }
        });
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
                var found = messageBuilder.storedMessages.main[number];
                if (found) {
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
        str = str.replace(/<a [^>]*href="([^'"]*\.ogg)">([^<]*)<\/a>/i, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'audio\', \'$1\')" class="show-video">[audio]</a>');
        str = str.replace(/<a [^>]*href="[^"]*ustream.tv\/embed\/(\d+)\?v=3&amp;wmode=direct">([^<]*)<\/a>/, '<a target="_blank" href="$2">$2</a> <a href="javascript:void(0)" onclick="embed(\'ustream\', \'$1\')" class="show-video">[video]</a>');

        var img = /(<a target="_blank" href="[^"]+?">)([^<]+?\.(?:agif|apng|gif|jpg|jpeg|png|bmp|svg))<\/a>/gi.exec(str);
        if (img && Attributes.get('toggle-images')) {
            str = this.multiple(str, img[0], img[1] + '<img src="/img/?url=' + encodeURIComponent(img[2]) + '" onload="messageBuilder.scrollToBottom(\'messages\', this);"/></a>', 3);
        }
        var gifv = /(<a target="_blank" href="[^"]+?">)([^<]+?\.(?:gifv))<\/a>/gi.exec(str);
        if (gifv && Attributes.get('toggle-images')) {
            var mp4 = gifv[2].slice(0, -4);
            str = this.multiple(str, gifv[0], gifv[1] + '<video id="gifv" onload="messageBuilder.scrollToBottom(\'messages\');" preload="auto" autoplay="autoplay" loop="loop" muted="true" style="max-width: 256px; max-height: 256px;"> <source src="' + mp4 + 'mp4" type="video/mp4"></source> </video>', 3);
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
        if (type == 'font'){
            $$$.query('#input-bar textarea').style.fontFamily = value;
        } else {
            if (parser.coloreg.indexOf(value) === -1) {
                $$$.query('#input-bar textarea').style.color = '#' + value;
            } else {
                $$$.query('#input-bar textarea').style.color = value;
            }
        } 
    },
    mix : function (hexColors, text) {
        function hexToRgb(hex) {
            var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });

                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            }

        function rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }

        function blend(start, finish, amount){
            var mix = [];
            amount--;
            for(var i = 0; i <= amount; i++){
                var r = Math.round(start[0] + (finish[0] - start[0]) / (amount / i));
                var g = Math.round(start[1] + (finish[1] - start[1]) / (amount / i));
                var b = Math.round(start[2] + (finish[2] - start[2]) / (amount / i));
                mix.push(rgbToHex(r,g,b));
            }
            return mix;
        }
        
        function shade(start, finish, amount){
            var startRGB = hexToRgb(start);
            var finishRGB = hexToRgb(finish);
            return blend([startRGB.r, startRGB.g, startRGB.b], [finishRGB.r, finishRGB.g, finishRGB.b], amount);
        }

        function mixLetters(start, finish, text) {
            var hexColors = shade(start, finish, text.length),
                splitText = text.split(''),
                newText = '';
            
            for (var i = 0; i < splitText.length; i++) {
                newText += hexColors[i] + splitText[i];
            }
            
            return newText;
        }

        return mixLetters(hexColors[0], hexColors[1], text);
    },
    flair : function (flair, plainNick) {
        var nickHTML = this.parse(flair || ''),
            parsedFlair;

        if (this.removeHTML(nickHTML) === plainNick) {
            this.getAllFonts(flair);
            parsedFlair = nickHTML;
        }
        
        return parsedFlair || plainNick;
    }
};