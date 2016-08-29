var COMMANDS = {
    
    color : {
        params : ['color'],
        handler : function (params) {
            if (params.color == 'none') {
                Attributes.remove('color');
            } else {
                Attributes.set('color', params.color);
            }
        }
    },
    flair : {
        params : ['flair'],
        handler : function (params) {
            if (params.color == 'none') {
                Attributes.remove('flair');
            } else {
                Attributes.set('flair', params.flair);
            }
        }
    },
    //server side commands
    nick : {
        params : ['nick']
    }
    
}