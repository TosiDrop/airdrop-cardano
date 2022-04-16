#!/usr/bin/env bash

export CARDANO_NETWORK=${CARDANO_NETWORK:-testnet}
export CARDANO_NODE_SOCKET_PATH=${CARDANO_NODE_SOCKET_PATH:-/run/cardano-node-${CARDANO_NETWORK:-testnet}.socket}
python3 api.py
