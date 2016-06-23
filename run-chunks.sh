#/bin/bash

mkdir -p mapped/

for f in `ls chunk/`
do
    echo $f
	node mapper.js < chunk/$f | node reducer.js > mapped/${f} &
done

wait
