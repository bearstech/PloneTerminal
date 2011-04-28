`jquery.terminal`_ integration for `Plone`_

Buildout configuration
=======================

::

   [buildout]
   eggs =
      ...
      ploneterminal
      ...
   zcml =
      ...
      ploneterminal
      ...

Go to ``http://<plone_site>/terminal``

Customisation
===============

Get the terminal page on GitHub_. Change the banner for your website.

Then add a view for your specific theme in a configure.zcml::


  <browser:page
      name="terminal"
      for="Products.CMFPlone.interfaces.IPloneSiteRoot"
      template="yourtemplate.pt"
      permission="zope.Public"
      layer=".interfaces.IThemeSpecific"
      />

Demo
====

click here_.


.. _jquery.terminal: http://terminal.jcubic.pl/
.. _plone: http://plone.org
.. _github: https://github.com/bearstech/PloneTerminal/blob/master/ploneterminal/index.pt
.. _here: http://bearstech.com/term
