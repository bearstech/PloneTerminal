# -*- coding: utf-8 -*-
from Products.Five import BrowserView
import logging
try:
    import json
except ImportError:
    import simplejson as json

log = logging.getLogger(__name__)

class Shell(BrowserView):

    def ls(self):
        self.request.response.setHeader('Content-Type', 'text/plain')

        mtool = self.context.portal_membership
        if mtool.isAnonymousUser():
            member = member_id = is_admin = None
        else:
            member = self.context.portal_membership.getAuthenticatedMember()
            member_id = str(member)
            is_admin = 'Manager' in member.getRoles()

        portal_url = self.context.portal_url.getPortalObject().absolute_url()
        path = '/'.join(self.context.getPhysicalPath())
        brains = self.context.portal_catalog.searchResults(
                        path=dict(query=path, depth=1),
                        object_provides=['Products.Archetypes.interfaces.base.IBaseContent'],
                    )
        results = {}
        for b in brains:
            url=b.getURL()
            path = url[len(portal_url):]
            results[path] = dict(
                id=b.getId,
                title=b.Title,
                description=b.Description,
                url=url,
                path=path,
                splitted_path=path.split('/'),
                is_folderish=b.is_folderish,
                modified=b.modified.strftime('%d %m %H:%M'),
                size=b.getObjSize,
                owner=b.Creator,
            )
        log.warn(results)
        return json.dumps(results)


    def info(self):
        self.request.response.setHeader('Content-Type', 'text/plain')
        portal_url = self.context.portal_url.getPortalObject().absolute_url()
        path = '/'.join(self.context.getPhysicalPath())
        brains = self.context.portal_catalog.searchResults(
                        path=dict(query=path, depth=0),
                        object_provides=['Products.Archetypes.interfaces.base.IBaseContent'],
                    )
        data = dict()
        for b in brains:
            if b.getPath() == path:
                url=b.getURL()
                path = url[len(portal_url):]
                data = dict(
                    id=b.getId,
                    title=b.Title,
                    description=b.Description,
                    url=url,
                    path=path,
                    splitted_path=path.split('/'),
                    is_folderish=b.is_folderish,
                    modified=b.modified.strftime('%d %m %H:%M'),
                    size=b.getObjSize,
                    owner=b.Creator,
                )
        context = self.context
        meth = getattr(self.context, 'CookedBody', None)
        if meth is not None:
            data['html_body'] = meth(stx_level=3)
        meth = getattr(self.context, 'getText', None)
        if meth is not None:
            if 'html_body' not in data:
                data['html_body'] = meth()
            data['text_body'] = meth(mimetype='text/plain')
        return json.dumps(data)

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
        data = dict(
            member=member,
            host=host,
            prompt='%s@%s:/$' % (member, host),
            prompt_mask='%s@%s:$cwd$' % (member, host),
          )
        return json.dumps(data)
