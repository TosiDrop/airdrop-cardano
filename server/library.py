import subprocess
import json
import datetime
import sqlite3
from math import ceil
from config import *
from time import sleep


def parse_airdrop_data(data):
    """
    parse the airdrop data
    """
    airdrops_list = []
    out = ''
    err = ''
    token_name = ''
    try:
        json_data = json.loads(data)
        source_addresses = json_data['source_addresses']
        token_name = json_data['token_name']
        if 'change_address' in json_data:
            change_address = json_data['change_address']
        else:
            change_address = source_addresses[0]
        for item in json_data['addresses']:
            address = list(item.keys())[0]
            amount = list(item.values())[0]
            aird = {}
            aird['address'] = address
            aird['tokens_amount'] = amount
            airdrops_list.append(aird)
        out = 'json parsed'
    except Exception as e:
        err = 'exception parsing data: %s' % str(e)
        return [], [], airdrops_list, [], [], token_name, [], out, err


    """
    DST_ADDRESSES = list of destination wallet addresses for the airdrop
    AMOUNTS = dictionary of wallet addresses and amounts to airdrop for each wallet address
    """
    dst_addresses = []
    amounts = {}
    total_lovelace = 0
    total_tokens = 0
    min_lovelace = calculate_min_ada(token_name)
    for item in airdrops_list:
        # read the values from the airdrops_list
        address = item['address']
        t_amount = int(item['tokens_amount'])
        # create the dictionary with the final airdrops list
        amount = []
        lovelace_amount = {}
        tokens_amount = {}
        lovelace_amount['token'] = 'lovelace'
        lovelace_amount['amount'] = min_lovelace
        tokens_amount['token'] = token_name
        tokens_amount['amount'] = t_amount
        amount.append(lovelace_amount)
        amount.append(tokens_amount)
        total_lovelace += min_lovelace
        total_tokens += int(t_amount)
        amounts[address] = amount
        dst_addresses.append(address)

    spend_amounts = {}
    spend_amounts['lovelace'] = total_lovelace
    spend_amounts[token_name] = total_tokens
    return source_addresses, change_address, airdrops_list, spend_amounts, dst_addresses, token_name, amounts, out, err


def calculate_min_ada(token_name):
    """
    Calculate the minimum lovelace required to be send with a token
    :param token_name:
    :return:
    """
    try:
        with open(PROTOCOL_FILE, 'r') as f:
            pp = json.loads(f.read())
            cost_per_word = pp['utxoCostPerWord']
    except Exception as e:
        return 1448244
    min_lovelace = 1310316
    size_bytes = int(len(token_name.split('.')[1]) / 2)
    return min_lovelace + ceil(size_bytes / 8) * cost_per_word


def generate_protocol_file():
    """
    generate the protocol file
    """
    if len(MAGIC_NUMBER) == 0:
        cmd = ["cardano-cli", "query", "protocol-parameters", CARDANO_NET, "--out-file", PROTOCOL_FILE]
    else:
        cmd = ["cardano-cli", "query", "protocol-parameters", CARDANO_NET, str(MAGIC_NUMBER),
            "--out-file", PROTOCOL_FILE]
    out, err = cardano_cli_cmd(cmd)
    return out, err


def get_tip():
    """
    query tip
    """
    if len(MAGIC_NUMBER) == 0:
        cmd = ["cardano-cli", "query", "tip", CARDANO_NET]
    else:
        cmd = ["cardano-cli", "query", "tip", CARDANO_NET, str(MAGIC_NUMBER)]
    out, err = cardano_cli_cmd(cmd)
    return out, err


def get_available_amounts(src_addresses):
    """
    Get the amount of available ADA and tokens at the src_addresses
    """
    # source UTxOs grouped by source address
    source_transactions = {}
    # get the list of transactions from all source addresses
    src_transactions = []
    src_token_transactions = []
    tokens_amounts = []
    for src_addr in src_addresses:
        src_trans, src_token_trans, tok_amounts, out, err = get_transactions(src_addr)
        if err:
            msg = {}
            msg['error'] = err
            return [], [], [], [], msg
        else:
            utxos = {}
            utxos['src_transactions'] = src_trans
            utxos['src_token_transactions'] = src_token_trans
            source_transactions[src_addr] = utxos
            src_transactions += src_trans
            src_token_transactions += src_token_trans
            tokens_amounts.append(tok_amounts)
    #
    total_available = {}
    for t in tokens_amounts:
        for k in t.keys():
            if k in total_available:
                total_available[k] += t[k]
            else:
                total_available[k] = t[k]
    tokens_amounts = total_available
    return source_transactions, src_transactions, src_token_transactions, tokens_amounts, ''


def get_utxo_list(address):
    """
    Get the list of UTxOs from the given addresses.
    :param address: Cardano Blockchain address to search for UTXOs
    :return: utxo_list: list of UTxOs
    """
    if len(MAGIC_NUMBER) == 0:
        cmd = ["cardano-cli", "query", "utxo", "--address", address, CARDANO_NET]
    else:
        cmd = ["cardano-cli", "query", "utxo", "--address", address, CARDANO_NET, str(MAGIC_NUMBER)]
    out, err = cardano_cli_cmd(cmd)
    utxo_list = []
    if not err:
        for line in out.splitlines():
            if 'lovelace' in line:
                trans = line.split()
                utxo_list.append(trans[0])
    return utxo_list


def get_transactions(address, max_utxos=MAX_IN_UTXOS):
    """
    Get the list of transactions from the given addresses. They will be used as input UTxOs.
    :param address: Cardano Blockchain address to search for UTXOs
    :param max_utxos: Maximum number of UTxOs to read from the address. if the number is too big,
        the transaction size will be over the maximum transaction size allowed by Cardano.
    :return: ada_transactions, token_transactions
            ada_transactions: list of transactions with lovelace only
            token_transactions: list of transactions including custom tokens
    """
    if len(MAGIC_NUMBER) == 0:
        cmd = ["cardano-cli", "query", "utxo", "--address", address, CARDANO_NET]
    else:
        cmd = ["cardano-cli", "query", "utxo", "--address", address, CARDANO_NET, str(MAGIC_NUMBER)]
    out, err = cardano_cli_cmd(cmd)
    tokens_amounts = {}
    ada_transactions = []
    token_transactions = []
    nr_utxos = 0
    if not err:
        for line in out.splitlines():
            nr_utxos += 1
            # exit loop if the max number of UTxOs has been reached
            if nr_utxos > max_utxos:
                break
            if 'lovelace' in line:
                transaction = {}
                trans = line.split()
                # if this is an UTxO with only lovelace in it
                if len(trans) == 6:
                    transaction['hash'] = trans[0]
                    transaction['id'] = trans[1]
                    transaction['amount'] = trans[2]
                    ada_transactions.append(transaction)
                    # add the lovelace to total amounts to spend
                    if 'lovelace' in tokens_amounts:
                        tokens_amounts['lovelace'] += int(transaction['amount'])
                    else:
                        tokens_amounts['lovelace'] = int(transaction['amount'])
                # if there are also other tokens
                else:
                    transaction['hash'] = trans[0]
                    transaction['id'] = trans[1]
                    transaction['amounts'] = []
                    tr_amount = {}
                    tr_amount['token'] = trans[3]
                    tr_amount['amount'] = trans[2]
                    transaction['amounts'].append(tr_amount)
                    # for each token
                    for i in range(0, int((len(trans) - 4) / 3)):
                        tr_amount = {}
                        tr_amount['token'] = trans[3 + i * 3 + 3]
                        tr_amount['amount'] = trans[3 + i * 3 + 2]
                        transaction['amounts'].append(tr_amount)
                    token_transactions.append(transaction)
                    # add the tokens to total amounts to spend
                    for t in transaction['amounts']:
                        if t['token'] in tokens_amounts:
                            tokens_amounts[t['token']] += int(t['amount'])
                        else:
                            tokens_amounts[t['token']] = int(t['amount'])
    return ada_transactions, token_transactions, tokens_amounts, out, err


def get_airdrop_details(cur, airdrop_id):
    """
    Return all the details about an airdrop from the database
    :param airdrop_id:
    :return: a disctionary with all the airdrop details
    """
    airdrop_details = {}
    airdrop_transactions = []
    cur.execute("SELECT hash, status, date, id FROM airdrops WHERE id = ?", (airdrop_id, ))
    airdrop = cur.fetchone()
    airdrop_details['airdrop_hash'] = airdrop[0]
    airdrop_details['status'] = airdrop[1]
    airdrop_details['date'] = airdrop[2]
    cur.execute("SELECT hash, name, status, date FROM transactions WHERE airdrop_id = ?", (airdrop[3], ))
    transactions = cur.fetchall()
    for trans in transactions:
        airdrop_transaction = {}
        airdrop_transaction['transaction_hash'] = trans[0]
        airdrop_transaction['transaction_name'] = trans[1]
        airdrop_transaction['transaction_status'] = trans[2]
        airdrop_transaction['transaction_data'] = trans[3]
        airdrop_transactions.append(airdrop_transaction)
    airdrop_details['transactions'] = airdrop_transactions
    return airdrop_details


def wait_for_transaction(txid, address, airdrop_id, trans_id, name, applog):
    """
    Wait for the transaction to be adopted and update the database
    :param txid: transaction hash
    :param address: address to monitor
    :param airdrop_id: airdrop id in the database
    :param trans_id: transaction id in the database
    :param name: name of the transaction, to use it to update the database
    :param applog: logger
    """
    found = False
    count = 0
    while not found:
        count += 1
        applog.info('waiting for transaction %s to be adopted...' % txid)
        sleep(SLEEP_TIMEOUT)
        src_trans, src_token_trans, tok_amounts, out, err = get_transactions(address)
        if err:
            applog.error(err)
            msg = {}
            msg['error'] = 'Server error: %s' % err
            return msg, 503
        else:
            for t in src_trans:
                if t['hash'] == txid:
                    found = True
                    break
            for t in src_token_trans:
                if t['hash'] == txid:
                    found = True
                    break
        if count > TRANSACTION_EXPIRE / SLEEP_TIMEOUT:
            # transaction not found and the transaction has expired
            applog.info('Transaction %s expired, updating the database' % txid)
            """
            Update the transaction status - adopted
            """
            conn = sqlite3.connect(DB_NAME)
            cur = conn.cursor()
            now = datetime.datetime.now()
            status = name.replace('_', ' ') + ' expired'
            cur.execute("UPDATE airdrops SET status = ?, date = ? WHERE id = ?",
                        (status, now, airdrop_id))
            cur.execute("UPDATE transactions SET status = 'transaction expired', date = ? WHERE id = ?",
                        (now, trans_id))
            conn.commit()
            conn.close()
            return

    # the expected transaction was found
    applog.info('Transaction %s adopted, updating the database' % txid)
    """
    Update the transaction status - adopted
    """
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    now = datetime.datetime.now()
    status = name.replace('_', ' ') + ' adopted'
    cur.execute("UPDATE airdrops SET status = ?, date = ? WHERE id = ?",
                (status, now, airdrop_id))
    cur.execute("UPDATE transactions SET status = 'transaction adopted', date = ? WHERE id = ?",
                (now, trans_id))
    conn.commit()
    conn.close()
    return


def validate_transaction(spend_amounts, tokens_amounts):
    """
    A transaction is considered valid here if the amounts of tokens
    in the source UTXOs  are greater than or equal to the amounts to spend.
    :param spend_amounts: amounts to spend
    :param tokens_amounts: existing amounts to spend from
    :return: True if transaction is valid, otherwise False
    """
    for am in spend_amounts:
        if am not in tokens_amounts or spend_amounts[am] > tokens_amounts[am]:
            return False
    return True


def sign_transaction(payment_skeys, infile, outfile):
    """
    Sign a raw transaction file.
    :param payment_skeys: payment signing keys
    :param infile: transaction raw file
    :param outfile: transaction signed file
    :return:
    """
    cmd = ["cardano-cli", "transaction", "sign", "--tx-body-file", infile]
    for pkey in payment_skeys:
        cmd += ["--signing-key-file", pkey]
    if len(MAGIC_NUMBER) == 0:
        cmd += [CARDANO_NET, "--out-file", outfile]
    else:
        cmd += [CARDANO_NET, str(MAGIC_NUMBER), "--out-file", outfile]
    out, err = cardano_cli_cmd(cmd)
    return out, err


def cardano_cli_cmd(cmd):
    """
    Execute a cardano-cli command.
    :param cmd: command to execute
    :return: output of the command and error message, if any
    """
    out, err = subprocess.Popen(
        cmd, env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE).communicate()
    out = out.decode('utf-8')
    err = err.decode('utf-8')
    """
    if err and 'Warning' not in err and 'Ok.' not in err:
        print(cmd)
        print(err)
        sys.exit(1)
    """
    return out, err

