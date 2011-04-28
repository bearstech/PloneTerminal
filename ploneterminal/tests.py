# -*- coding: utf-8 -*-
import unittest
import doctest
from Products.Five import zcml
from Products.Five import fiveconfigure

from Testing import ZopeTestCase as ztc

from Products.PloneTestCase import PloneTestCase as ptc
from Products.PloneTestCase.layer import onsetup

#
# When ZopeTestCase configures Zope, it will *not* auto-load products in 
# Products/. Instead, we have to use a statement such as:
# 
#   ztc.installProduct('SimpleAttachment')
# 
# This does *not* apply to products in eggs and Python packages (i.e. not in
# the Products.*) namespace. For that, see below.
# 
# All of Plone's products are already set up by PloneTestCase.
# 

@onsetup
def setup_product():
    # Load the ZCML configuration for the example.tests package.
    # This can of course use <include /> to include other packages.
    fiveconfigure.debug_mode = True
    import ploneterminal
    zcml.load_config('configure.zcml', ploneterminal)
    fiveconfigure.debug_mode = False
    ztc.installPackage('ploneterminal')

setup_product()
ptc.setupPloneSite()

class FunctionalTestCase(ptc.FunctionalTestCase):
    pass


def test_suite():
    return unittest.TestSuite([
        ztc.ZopeDocFileSuite(
            'functional.txt', package='ploneterminal',
            test_class=FunctionalTestCase,
            optionflags=doctest.REPORT_ONLY_FIRST_FAILURE |
                        doctest.NORMALIZE_WHITESPACE | doctest.ELLIPSIS),

        ])

