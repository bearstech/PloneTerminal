from setuptools import setup, find_packages
import sys, os

version = '0.1'

setup(name='PloneTerminal',
      version=version,
      description="A Terminal for Plone",
      long_description="""\
""",
      classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
      keywords='plone terminal',
      author='Bearstech',
      author_email='py@bearstech.com',
      url='http://bearstech.com',
      license='GPL',
      packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          # -*- Extra requirements: -*-
      ],
      entry_points="""
      # -*- Entry points: -*-
      """,
      )
