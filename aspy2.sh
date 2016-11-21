#!/bin/bash
function finish {
  # Your cleanup code here
  echo
  echo "Setting python back to $opver"
  sudo ln -sf $opver /bin/python 
}
trap finish EXIT
npver="/bin/python2";
opver="$(readlink /bin/python)"
echo "setting python to $npver"
sudo ln -sf $npver /bin/python 
python --version
echo "running.."
$@