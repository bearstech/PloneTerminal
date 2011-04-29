from setuptools import setup, find_packages
import sys, os

version = '0.2'

setup(name='PloneTerminal',
      version=version,
      description="A Terminal for Plone",
      long_description=open('README.txt').read(),
      # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
      classifiers=[
          'Framework :: Plone',
          'Intended Audience :: Developers',
          'License :: OSI Approved :: GNU General Public License (GPL)',
          ],
      keywords='plone terminal',
      author='Bearstech',
      author_email='py@bearstech.com',
      url='https://github.com/bearstech/PloneTerminal',
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
