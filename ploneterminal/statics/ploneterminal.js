var Terminal = {};

(function($){
$.extend(Terminal, {
    _term: null,
    _cwd: '/',
    _cache: {},
    _options: {
                height: '90%',
                greetings:'',
                prompt_mask: '$cwd$',
                prompt: '/$'
             },
    _error: function() { Terminal._term.error('An error occur') },
    _no_such_directory: function() { Terminal._term.error('No such directory') },
    _no_such_file_or_directory: function() { Terminal._term.error('No such file or directory') },
    _parse_command: function(line, term) {
        if (!line) return;
        if (line[0] == '#') return;
        var args = line.split(' ');
        var meth = null;
        try {
            var cmd = args.shift();
            meth = Terminal[cmd];
            if (!meth) throw "CommandError";
            try {
                Terminal[cmd](args, term);
            } catch (e) {term.error(e);};
        } catch (e) {term.error(e+': No such command '+cmd);};
    },
    _complete_commands: function(cmd) {
        for (k in Terminal) {
            if (!/^_/.exec(k) && new RegExp('^'+cmd).exec(k))
                return k + ' ';
        }
        return cmd;
    },
    _complete_vocabulary: function(value, vocab) {
        var self = this;
        if (!value) {
            $(vocab).each(function(i, e) {self._term.echo(e);});
        } else {
            for (var i = 0; vocab.length; i++) {
                k = vocab[i];
                if (new RegExp('^'+value, 'i').exec(k))
                    return k + ' ';
            }
        }
        return value;
    },
    _complete_path: function(path) {
        var self = this;
        var match = self._path([path]);
        match = match.replace(/\/\//, '/');
        var path_info = match.split('/');
        // self._term.error('path_info: '+path_info+' - match: ^'+match);
        if (!/\/$/.exec(path)) {
            path_info.pop();
            if (path_info[0] != '') { path_info.splice(0, 0, '') }
            if (path_info.length < 2 ) { path_info.splice(0, 0, '') }
        }
        resp = $.ajax({
            type:'GET',
            dataType:'json',
            async: false,
            url: $('#portal_url').attr('href')+path_info.join('/')+'/@@ls.sh'
        });
        if (!/^{/.exec(resp.responseText))
           return path;
        eval('var data = '+resp.responseText);
        var possible = [];
        for (k in data) {
            if (new RegExp('^'+match, 'i').exec(k)) {
                if (data[k].folderish)
                    possible.push(k+'/');
                else
                    possible.push(k);
            }
        }
        if (possible.length > 1 || /\/$/.exec(path)) {
            $(possible).each(function() { self._term.echo(this); });
        } else if (possible.length == 1) {
            return possible[0];
        } else {
            $(possible).each(function() { self._term.echo(this); });
        }
        return path;
    },
    _complete: function(e) {
        var self = Terminal;
        if (e.which == 9 && !(e.ctrlKey || e.altKey)) {
            var args = self._term.get_command();
            args = args.split(' ');
            if (args.length == 1) {
                self._term.set_command(self._complete_commands(args[0]));
            } else {
                var cmd = args[0];
                var vocab = self._options[cmd+'_vocabulary'];
                if (vocab) {
                    cmd = args.shift();
                    var value = args.join(' ');
                    value = self._complete_vocabulary(value, vocab);
                    self._term.set_command(cmd + ' ' + value);
                } else {
                    var arg = self._complete_path(args[args.length-1]);
                    args[args.length-1] = arg;
                    self._term.set_command(args.join(' '));
                }
            }
            return false;
        }
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
    pwd: function(args, term) {
        term.echo(this._cwd);
    },
    quit: function(args, term) {
        window.location.href = $('#portal_url').attr('href');
    },
    echo: function(args, term) {
        args = args.join(' ');
        args = args.replace(/^["\']/, '');
        args = args.replace(/["\']$/, '');
        term.echo(args);
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
            async: false,
            url: $('#portal_url').attr('href')+path+'/@@info.sh',
            success: function(obj) {
                if (!obj.folderish) {
                    term.error(path+' is not a directory');
                } else {
                    self._cwd = path;
                    term.set_prompt(self._options['prompt_mask'].replace('$cwd', self._cwd));
                }
            },
            error: self._no_such_directory
        });
    },
    ls: function(args, term) {
        var self = this;
        path = self._path(args);
        $.ajax({
            type:'GET',
            dataType:'json',
            async: false,
            url: $('#portal_url').attr('href')+path+'/@@ls.sh',
            success: function(data) {
                for (k in data) {
                    var obj = data[k];
                    if (obj.folderish)
                        term.echo(obj.id+'[[b;#fff;transparent]/]');
                    else
                        term.echo(obj.id);
                }
            },
            error: self._no_such_directory
        });
    },
    grep: function(args, term) {
        var self = this;
        if (args.length == 2) {
            var path = self._path([args.pop()]);
            var s = args.pop();
        } else {
            term.echo('Usage: grep <term> <path>')
            return true;
        }
        if (!s) {
            term.echo('Usage: grep <term> <path>')
            return true;
        }
        $.ajax({
            type:'POST',
            dataType:'json',
            data: {'s': s},
            async: false,
            url: $('#portal_url').attr('href')+path+'/@@grep.sh',
            success: function(data) {
                for (k in data) {
                    var obj = data[k];
                    if (obj.folderish)
                        term.echo(obj.path+'[[b;#fff;transparent]/]');
                    else
                        term.echo(obj.path);
                }
            },
            error: self._no_such_directory
        });
    },
    create: function(args, term) {
        var self = this;
        $.ajax({
            type:'GET',
            dataType:'json',
            async: false,
            url: $('#portal_url').attr('href')+self._cwd+'/@@info.sh',
            success: function(obj) {
                if (!obj.folderish) {
                    term.error(path+' is not a directory');
                } else {
                    window.open(obj.url+'/createObject?type_name='+args.join(' '));
                }
            },
            error: self._no_such_directory
        });
    },
    mkdir: function(args, term) {
        self = this;
        var initial_path = self._path(args);
        var add_folder = function(path, id) {
            $.ajax({
                type:'GET',
                dataType:'html',
                async: false,
                url: $('#portal_url').attr('href')+path+'/createObject?type_name=Folder',
                success: function(html) {
                    html = $(html);
                    var form = $('form', $('#content', html));
                    var data = {};
                    $('input', form).each(function(i, e) {
                        e = $(e);
                        var k = e.attr('name');
                        data[k] = e.val();
                    });
                    data['title'] = id;
                    $.ajax({
                        type:'POST',
                        data: data,
                        dataType:'html',
                        async: false,
                        url: form.attr('action'),
                        success: function(resp) {
                            if (/__ac_name/.exec(resp.responseText))
                                term.error('Unauthorized')
                        },
                        error: self._error
                    });
                },
                error: self._error
            });
        }
        path = path.split('/')
        var id = path.pop();
        add_folder(path.join('/'), id);

    },
    rm: function(args, term) {
        self = this;
        if (args.length == 1) {
            path = args.pop();
            options = '-';
        } else {
            path = args.pop();
            options = args.pop();
        }
        path = self._path([path]);
        if (path == '/') {
            term.error('WTF!!!????');
            return true;
        }
        if (options[0] != '-' || !/^\//.exec(path)) {
            term.error('Usage: rm [-Rf] path');
            return true;
        }

        var delete_object = function(obj, html) {
            if (!/f/.exec(options)) {
                if (!confirm('Detete '+obj.path+' ?')) {
                    return true;
                }
            }
            var form = $('form', $('#content', html));
            var data = {};
            $('input', form).each(function(i, e) {
                e = $(e);
                var k = e.attr('name');
                if (k != 'delete_all' && k != 'cancel')
                    data[k] = e.val();
            });
            $.ajax({
                type:'POST',
                data: data,
                dataType:'html',
                async: false,
                url: form.attr('action'),
                success: function(resp) {
                    if (/__ac_name/.exec(resp.responseText))
                        term.error('Unauthorized')
                },
                error: self._error
            });
        }

        $.ajax({
            type:'GET',
            dataType:'json',
            async: false,
            url: $('#portal_url').attr('href')+path+'/@@info.sh',
            success: function(obj) {
                if (obj.folderish) {
                    term.error("You can't delete a directory");
                    return;
                }
                $.ajax({
                    type:'GET',
                    dataType:'html',
                    async: false,
                    url: obj.url+'/delete_confirmation',
                    success: function(html) {
                        delete_object(obj, html);
                    },
                    error: function (resp) {
                        delete_object(obj, $(resp.responseText));
                    }
                });
            },
            error: self._no_such_directory
        });
    },
    file: function(args, term) {
        var self = this;
        path = self._path(args);
        $.ajax({
            type:'GET',
            dataType:'json',
            async:false,
            url: $('#portal_url').attr('href')+path+'/@@info.sh',
            success: function(obj) {
                term.echo(obj.obj_type);
            },
            error: self._no_such_file_or_directory
        });
    },
    cat: function(args, term) {
        var self = this;
        path = self._path(args);
        $.ajax({
            type:'GET',
            dataType:'json',
            async:false,
            url: $('#portal_url').attr('href')+path+'/@@info.sh',
            success: function(obj) {
                if (obj.folderish) {
                    term.error(path+' is a directory');
                    return;
                }
                term.echo(obj.title_or_id);
                term.echo(obj.sep);
                if (obj.description)
                    term.echo(' ');
                    term.echo(obj.description);
                if (obj.text_body) {
                    var body = obj.text_body;
                    body = body.replace(/\n\s*\n/g, '\n');
                    body = body.replace(/\s*$/g, ' ');
                    body = body.replace(/^\s/, '');
                    body = body.replace('\t', '    ');
                    body = body.split('\n');
                    term.echo(' ');
                    term.echo(' ');
                    $(body).each(function(i, e) {
                       if (e) term.echo(e)
                    });
                }
                term.echo('')
                if (obj.obj_type == 'Image') {
                    var img = new Image();
                    $(img).load(function() {
                        var div = $('.terminal-output', self._term).append('<div/>');
                        div.css('width', '100%');
                        div.append(img);
                        term.echo(' ');
                    })
                    img.src = obj.url + '/image_thumb';
                }
            },
            error: self._no_such_file_or_directory
        });
    },
    open: function(args, term) {
        var self = this;
        path = self._path(args);
        window.open($('#portal_url').attr('href')+path);
    },
    edit: function(args, term) {
        var self = this;
        path = self._path(args);
        window.open($('#portal_url').attr('href')+path+'/edit');
    },
    _simple_cmd: function(cmd) {
        var self = this;
        $.ajax({
            type:'POST',
            dataType:'json',
            data: {'cmd': cmd},
            url: $('#portal_url').attr('href')+'/@@simple_cmd.sh',
            success: function(obj) {
                $(obj.result).each(function() { self._term.echo(this); });
            },
            error: self._error
        });
    },
    fortune: function(args, term) {
        this._simple_cmd('fortune');
    },
    moo: function(args, term) {
        this._simple_cmd('moo');
    }
});

$(document).ready(function() {
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: $('#portal_url').attr('href')+'/server_info.sh',
        success: function(data) {
            $.extend(Terminal._options, {'keydown':Terminal._complete});
            $.extend(Terminal._options, data);
            Terminal._term = $('#term').terminal(Terminal._parse_command, Terminal._options);
            $('.terminal-output').append($('#greetings').show());
        }
    });
});

}(jQuery));


