# -*- coding: utf-8 -*-
from plone.app.vocabularies.types import ReallyUserFriendlyTypesVocabularyFactory
from plone.app.content.browser.foldercontents import FolderContentsTable
from zope.component import getMultiAdapter
from Products.Five import BrowserView
from fnmatch import fnmatch
import subprocess
import logging
import os

try:
    import json
except ImportError:
    import simplejson as json

log = logging.getLogger(__name__)

COMMANDS = {}
for cmd in ('fortune', 'moo'):
    try:
        binary = subprocess.Popen(['which', cmd], stdout=subprocess.PIPE).stdout.read().strip()
        if os.path.exists(binary):
            COMMANDS[cmd] = binary
            log.info('%s binary found at: %s', cmd, binary)
        else:
            log.error('No %s binary found in $PATH', cmd)
    except Exception, e:
        log.exception(e)


class Shell(BrowserView):

    def __init__(self, context, request):
        self.context = context
        self.request = request
        self.portal = self.context.portal_url.getPortalObject()
        self.portal_url = self.portal.absolute_url()
        self.path = '/'.join(self.context.getPhysicalPath())
        self.request.response.setHeader('Content-Type', 'application/json')

    def get_ctypes(self, context=None):
        if context is None:
            context = self.context
        vocab = ReallyUserFriendlyTypesVocabularyFactory(context)
        ctypes = [o.value for o in vocab]
        ctypes.extend([o.title for o in vocab])
        return list(set(ctypes))

    def brain_dict(self, b):
        url=b.getURL()
        path = url[len(self.portal_url):]
        data = dict(
            id=b.getId,
            title_or_id=b.Title or b.getId,
            description=b.Description,
            url=url,
            path=path,
            splitted_path=path.split('/'),
            folderish=b.is_folderish,
            modified=b.modified.strftime('%d %m %H:%M'),
            obj_type=b.Type,
            size=b.getObjSize,
            owner=b.Creator,
        )
        data.update(
            sep='='*len(data['title_or_id']),
          )
        return data

    def server_info(self):
        for k in ('HTTP_HOST', 'SERVER_NAME',):
            host = self.request.environ.get(k)
            if host:
                break
        host = host.split(':')[0]
        mtool = self.context.portal_membership
        if mtool.isAnonymousUser():
            member = 'guest'
        else:
            member = str(mtool.getAuthenticatedMember())
        ctypes = self.get_ctypes()
        data = dict(
            user=member,
            host=host,
            prompt='%s@%s:/$' % (member, host),
            prompt_mask='%s@%s:$cwd$' % (member, host),
            create_vocabulary=ctypes,
          )
        return json.dumps(data)

    def simple_cmd(self):
        cmd = self.request.form.get('cmd', '')
        if cmd in COMMANDS:
            data = subprocess.Popen([COMMANDS[cmd]], stdout=subprocess.PIPE).stdout.read().strip()
            data = data.replace('\t', '    ')
            data = data.split('\n')
        else:
            data = ['No %s found in $PATH' % cmd]
        return json.dumps(dict(result=data))


    def info(self):
        portal_url = self.context.portal_url.getPortalObject().absolute_url()
        brains = self.context.portal_catalog.searchResults(path=self.path)
        for b in brains:
            if b.getPath() == self.path:
                data = self.brain_dict(b)
                break
        context = self.context
        meth = getattr(self.context, 'getText', None)
        if meth is not None:
            data['text_body'] = meth(mimetype='text/plain')
        else:
            data['text_body'] = ''

        data['ctypes'] = self.get_ctypes()

        #log.warn(data)
        return json.dumps(data)


    def ls(self):
        ctypes = self.get_ctypes()

        brains = self.context.portal_catalog.searchResults(
                        path=dict(query=self.path, depth=1),
                        Type=ctypes)

        results = {}
        for b in brains:
            if b.getPath() == self.path:
                continue
            data = self.brain_dict(b)
            path = data['path']
            results[path] = data
        #log.warn(results)
        return json.dumps(results)

    def grep(self):
        portal_url = self.context.portal_url.getPortalObject().absolute_url()
        results = {}
        if 's' in self.request.form:
            ctypes = self.get_ctypes(self.portal)
            brains = self.context.portal_catalog.searchResults(
                        SearchableText=self.request.form.get('s'),
                        path=dict(query=self.path, depth=10),
                        Type=ctypes, limit=1000)
            for b in brains:
                if b.getPath() == self.path:
                    continue
                data = self.brain_dict(b)
                path = data['path']
                results[path] = data
            #log.warn(results)
        return json.dumps(results)

    def find(self):
        portal_url = self.context.portal_url.getPortalObject().absolute_url()
        results = {}
        if 's' in self.request.form:
            s = self.request.form['s'].lower()
            ctypes = self.get_ctypes(self.portal)
            brains = self.context.portal_catalog.searchResults(
                        path=dict(query=self.path, depth=10),
                        Type=ctypes, limit=1000)
            for b in brains:
                if fnmatch(b.getId.lower(), s):
                    if b.getPath() == self.path:
                        continue
                    data = self.brain_dict(b)
                    path = data['path']
                    results[path] = data
            #log.warn(results)
        return json.dumps(results)

