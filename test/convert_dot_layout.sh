#!/usr/bin/sh
#
# Script to convert the dot-Layout files to SVG
cd pl_dot/dot_layout
rm ../../pl_svg/dot_layout/*.svg
for f in `ls *.dot`
do
    fname=`echo $f|cut -d. -f1`
    dot -Tsvg -o ../../pl_svg/dot_layout/${fname}.svg $f
done
cd ../..
