var COMMANDS = {
    
    color : {
        params : ['color'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('color');
            } else {
                Attributes.set('color', params.color);
            }
        }
    },
    flair : {
        params : ['flair'],
        handler : function (params) {
            if (params.color === 'none') {
                Attributes.remove('flair');
            } else {
                Attributes.set('flair', params.flair);
            }
        }
    },
    get : {
        params : ['attribute'],
        handler : function (params) {
            var value = Attributes.get(params.attribute);
            if (value) {
                showMessage({
                    message : params.attribute + ' is is currently set to: ' + value,
                    messageType : 'info'
                });
            } else {
                showMessage({
                    message : params.attribute + ' isn\'t set',
                    messageType : 'info'
                });
            }
        }
    },
    //server side commands
    nick : {
        params : ['nick']
    },
    login : {
        params : ['nick', 'password']
    },
    register : {
        params : ['nick', 'password']
    },
    topic : {
        params : ['topic']
    },
    note : {
        params : ['note']
    },
    background : {
        params : ['background']
    },
    me : {
        params : ['message']
    }
    
};
