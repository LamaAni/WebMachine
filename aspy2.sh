#!/bin/bash
function finish {
  # Your cleanup code here
  echo
  echo "Setting python back to $opver"
  sudo ln -sf /bin/python $opver
}
trap finish EXIT
npver="/bin/python2";
opver="$(readlink /bin/python)"
echo "setting python to $npver"
sudo ln -sf /bin/python $npver
python --version
echo "running.."
$@