var Terminal = {};

(function($){
$.extend(Terminal, {
    _cwd: '/',
    _options: {
                height: '90%',
                greetings:'',
                prompt_mask: '$cwd$',
                prompt: '/$'
             },
    _parse_command: function(line, term) {
        if (!line) return;
        var args = line.split(' ');
        var meth = null;
        try {
            var cmd = args.shift();
            meth = Terminal[cmd];
            if (!meth) throw "CommandError";
            try {
                Terminal[cmd](args, term);
            } catch (e) {term.error(e);};
        } catch (e) {term.error(['No such command ', cmd, e]);};
    },
    _path: function(args) {
        var splited = this._cwd.split('/');
        if (args.length > 0) {
            args = args[0];
            if (args[0] == '/') {
                splited = args.split('/')
            } else {
                $(args.split('/')).each(function() {
                    if (this == '..') {
                        if (splited.length)
                            splited.pop();
                    } else if (this == '.') {
                    } else {
                        splited.push(this);
                    }
                });
            }
        }
        path = splited.join('/');
        path = path.replace('//', '/');
        path = path.replace(/\/$/, '');
        if (!path) path = '/';
        if (path[0]!='/') path = '/'+path;
        return path;
    },
    help: function(args, term) {
        term.echo('Valid commands are:');
        for (k in Terminal) {
            if (!/^_/.exec(k))
                term.echo('- '+k);
        }
    },
    cd: function(args, term) {
        var self = this;
        path = self._path(args);
        if (path == '/') {
            self._cwd = path;
            term.set_prompt(self._options['prompt_mask'].replace('$cwd', self._cwd));
            return;
        }
        $.ajax({
            type:'GET',
            dataType:'json',
            url: $('#portal_url').attr('href')+path+'/@@info.sh',
            success: function(obj) {
                if (!obj.is_folderish) {
                    term.error(path+' is not a directory');
                } else {
                    self._cwd = path;
                    term.set_prompt(self._options['prompt_mask'].replace('$cwd', self._cwd));
                }
            },
            error: function() {
                term.error('No such directory');
            }
        });
    },
    pwd: function(args, term) {
        term.echo(this._cwd);
    },
    ls: function(args, term) {
        var self = this;
        path = self._path(args);
        $.ajax({
            type:'GET',
            dataType:'json',
            url: $('#portal_url').attr('href')+path+'/@@ls.sh',
            success: function(data) {
                for (k in data) {
                    var obj = data[k];
                    if (obj.is_folderish)
                        term.echo('[[b;#fff;transparent]'+obj.id+']/');
                    else
                        term.echo('[[;#fff;transparent]'+obj.id+']');
                }
            },
            error: function() {
                term.error('No such directory');
            }
        });
    },
    _open: function(obj, path, format, term) {
        if (obj.is_folderish) {
            term.error(path+' is a directory');
            return;
        }
        $('.terminal-output').append('<h3 class="title">'+obj.title+'</h3>');
        if (obj.description)
            $('.terminal-output').append('<p class="description">'+obj.description+'</p>');
        if (format == 'text' && obj.text_body) {
            body = obj.text_body;
            while (/\n\n\n/.exec(body))
                body = body.replace('\n\n', '<br />');
            $('.terminal-output').append('<p class="body">'+body+'</p>');
        }
        if (format == 'html' && obj.html_body) {
            $('.terminal-output').append('<p class="body">'+obj.html_body+'</p>');
        }
        term.echo('')
    },
    cat: function(args, term) {
        var self = this;
        path = self._path(args);
        $.ajax({
            type:'GET',
            dataType:'json',
            url: $('#portal_url').attr('href')+path+'/@@info.sh',
            success: function(obj) {
                self._open(obj, path, 'text', term);
            },
            error: function () {
                term.error('No such file or directory');
            }
        });
    },
    open: function(args, term) {
        var self = this;
        path = self._path(args);
        $.ajax({
            type:'GET',
            dataType:'json',
            url: $('#portal_url').attr('href')+path+'/@@info.sh',
            success: function(obj) {
                self._open(obj, path, 'html', term);
            },
            error: function () {
                term.error('No such file or directory');
            }
        });
    },
});

$(document).ready(function() {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: $('#portal_url').attr('href')+'/server_info.sh',
        success: function(data) {
            $.extend(Terminal._options, data);
            $('#term').terminal(Terminal._parse_command, Terminal._options);
            $('.terminal-output').append($('#greetings').show());
        }
    });
});

}(jQuery));


