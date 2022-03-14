from params import *


"""
network: switch between mainnet and testnet
"""
# CARDANO_NET = os.getenv('CARDANO_NET', '--mainnet')
# MAGIC_NUMBER = os.getenv('MAGIC_NUMBER', '')
CARDANO_NET = os.getenv('CARDANO_NET', '--testnet-magic')
MAGIC_NUMBER = os.getenv('MAGIC_NUMBER', '1097911063')

# addresses and spending keys
SRC_KEYS = [KEYS_PATH + '/dev_wallet-1.skey']

"""
airdrop settings
"""
ADDRESSES_PER_TRANSACTION = 120
EXTRA_LOVELACE = 2000000
SUBMITAPI_URL = 'http://<host_or_ip>:8090/api/submit/tx'

"""
sqlite3 database settings
"""
DB_NAME = 'db/airdrops.db'
