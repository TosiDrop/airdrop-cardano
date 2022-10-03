from config import DB_NAME
import sqlite3


conn = sqlite3.connect(DB_NAME)
cur = conn.cursor()
cur.execute('''CREATE TABLE IF NOT EXISTS airdrops (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            hash CHAR(64) NOT NULL,
            tokens_name CHAR(96),
            type CHAR(64),
            description TEXT,
            source_addresses TEXT,
            status TEXT,
            date timestamp
            )''')
conn.commit()
cur.execute('''CREATE INDEX IF NOT EXISTS airdrops_hash on airdrops(hash)''')
conn.commit()

cur.execute('''CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            airdrop_id INTEGER NOT NULL,
            hash CHAR(64) NOT NULL,
            name CHAR(64),
            description TEXT,
            status TEXT,
            date timestamp
            )''')
conn.commit()
cur.execute('''CREATE INDEX IF NOT EXISTS transactions_airdrop_id on transactions(airdrop_id)''')
cur.execute('''CREATE INDEX IF NOT EXISTS transactions_hash on transactions(hash)''')
conn.commit()

cur.execute('''CREATE TABLE IF NOT EXISTS transaction_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            transaction_id INTEGER NOT NULL,
            src_addresses TEXT,
            inputs TEXT,
            outputs TEXT,
            change_address CHAR(128) NOT NULL,
            amount_lovelace INTEGER,
            amount_tokens INTEGER,
            date timestamp
            )''')
conn.commit()
cur.execute('''CREATE INDEX IF NOT EXISTS transaction_details_transaction_id on transaction_details(transaction_id)''')
conn.commit()
