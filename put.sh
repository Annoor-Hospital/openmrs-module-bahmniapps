#!/bin/bash

# To use for dev: ./put.sh
# To use for prod: remoteip=10.10.10.134 ./put.sh dist
remoteip="${remoteip:-10.10.10.245}"

# Check if route exists to remote host
if ! nc -w 3 -z $remoteip 22 2>/dev/null; then
	echo "No route to $remoteip or ssh port not open"
	exit 1
else
	echo "Will put to $remoteip"
fi

# Verify command argument
if [ $# -eq 1 ] ; then
	tgt="${1}"
else
	tgt="app"
fi
if ! [[ "$tgt" =~ ^(dist|app|node_modules)$ ]]; then
	echo "Argument must be dist, app or node_modules"
	exit 1
fi

# Remove existing compressed file
if [ -f "${tgt}.tar.gz" ]; then
	rm "${tgt}.tar.gz"
fi

# Build bahmniapps
cd "ui"
if [ "$tgt" = "app" ]; then
	yarn compass useminPrepare
elif [ "$tgt" = "dist" ]; then
	yarn default
fi
if [ $? -ne 0 ]; then
    cd ..
    exit 1
fi

# Compress and send to remote host
tar -cvzf "../${tgt}.tar.gz" $tgt
cd ..
sftp "root@${remoteip}" <<< $'put '"$tgt"'.tar.gz'

# Log in to remote host and extract the compressed file into /opt/bahmni-web/etc
ssh root@${remoteip} 'bash -s' << EOF
mv ${tgt}.tar.gz /opt/bahmni-web/etc/
cd /opt/bahmni-web/etc/
tar -xvzf ${tgt}.tar.gz
chown -R bahmni:bahmni $tgt
rm ${tgt}.tar.gz
EOF
