#!/bin/bash
if [ -z "$NACL_SDK_PATH" ] || [ ! -d "$NACL_SDK_PATH" ] ; then
	echo "Cannot find NACL SDK directory, set enviroment variable NACL_SDK_PATH."
	if [ ! -z "$NACL_SDK_PATH" ]; then
		echo "Currently NACL_SDK_PATH=$NACL_SDK_PATH"
	fi
	SDKPATH="/SDK/nacl_sdk"
	if [ ! -d "$SDKPATH" ]; then
		echo "Default path $SDKPATH not found. Exiting."
		exit
	else
		echo "Assuming $SDKPATH"
	fi
else
	SDKPATH="$NACL_SDK_PATH"
fi
i=$((${#SDKPATH}-1))
if [ "${SDKPATH:$i:1}" != "/" ]; then
	SDKPATH="$SDKPATH""/"
fi
echo "Making with SDK path $SDKPATH"
export NACL_SDK_PATH="$SDKPATH"
echo "$@">__targets.makenacl.cmnd
make