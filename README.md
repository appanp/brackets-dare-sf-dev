## Demandware Store-front Development Extension

This [Brackets editor](http://brackets.io) [extension](https://github.com/adobe/brackets/wiki/How-to-Write-Extensions) provides the 
following functionality for developing e-commerce store-front code for
the [demandware platform]():

1. Viewing pipeline XML files as a graph using Graphviz dot layout
1. Editing pipeline XML files as a Graphviz dot file
1. Syntax coloring of ISML templates
1. Code coversge of ds scripts unit-tested using [Rapunzel](https://bitbucket.org/demandware/dw-rapunzel) library

Not all the above features are currently available but the goal is to 
provide these functionalities.

### Dependent Libraries

This module is dependent on these following modules:

1. [xml-stream](https://github.com/assistunion/xml-stream)
1. [node-graphviz](https://github.com/glejeune/node-graphviz)

### Installation

Dependencies are specified in package.json, hence `npm install` in root should install the dependencies.

On Windows, installing xml-stream might give some errors. This is because
it tries to install native modules using node-gyp. This can be avoided by
the following the steps:

1. Open the 'Developercommand prompt for VS2013'
1. Make sure that C compiler CL.exe is available in path: `CL.exe`
1. Set MSVS version using: `set GYP_MSVS_VERSION=2013`

A few links which mentions this problem are:

1. [node-gyp: windows users not happy](https://github.com/nodejs/node-gyp/issues/629#issuecomment-138276692)
1. [Best node module for XML parsing](http://stackoverflow.com/questions/14890655/the-best-node-module-for-xml-parsing)
1. [node-expat: install error with npm on Win7](https://github.com/node-xmpp/node-expat/issues/57) - This did not work for me !!
1. [Windows10: The build tools for v120](https://github.com/nodejs/node-gyp/issues/679) - This is the one that worked !!


