import sys
import threading
from flask import Flask, request, make_response
from flask_restx import Api, Resource, reqparse
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.datastructures import FileStorage
import hashlib
from library import *
import sqlite3
import logging.handlers
import datetime
from math import ceil


"""
create some required folders to store log and transaction file
"""
try:
    if not os.path.exists(FILES_PATH):
        os.mkdir(FILES_PATH)
    if not os.path.exists(TRANSACTIONS_PATH):
        os.mkdir(TRANSACTIONS_PATH)
    if not os.path.exists(os.path.dirname(DB_NAME)):
        os.mkdir(os.path.dirname(DB_NAME))
except Exception as e:
    print('Error creating the required folders: %s' % e)
    sys.exit(1)

"""
Set up logging
"""
handler = logging.handlers.WatchedFileHandler(LOG_FILE)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

applog = logging.getLogger('airdrops')
applog.addHandler(handler)
applog.setLevel(logging.DEBUG)


"""
Create the Flask application
"""
app = Flask(__name__)
app.config['DEBUG'] = True
app.config['UPLOAD_FOLDER'] = FILES_PATH
app.wsgi_app = ProxyFix(app.wsgi_app)

api = Api(app, version=APP_VERSION_MINOR, title=APP_NAME, description=APP_DESCRIPTION,)
ns = api.namespace('api/' + APP_VERSION_MAJOR, description=APP_NAME + ' ' + APP_VERSION_MINOR)

airdrop_parser = reqparse.RequestParser()
airdrop_parser.add_argument('airdrop_file', type=FileStorage, location=FILES_PATH, required=True)

transaction_parser = reqparse.RequestParser()
transaction_parser.add_argument('transaction_file', type=FileStorage, location=FILES_PATH, required=True)


@ns.route('/')
class Home(Resource):
    def get(self):
        return '<h1>TosiDrop API ' + APP_VERSION_MINOR + '</h1>'


@ns.route('/airdrop_status/<string:airdrop_hash>')
@api.response(200, "OK")
@api.response(406, "Not Acceptable client error")
@api.response(503, "Server error")
class AirdropStatus(Resource):
    def get(self, airdrop_hash):
        """
        Check and return the airdrop status
        """
        conn = sqlite3.connect(DB_NAME)
        cur = conn.cursor()
        cur.execute("SELECT max(id) FROM airdrops WHERE hash = ?", (airdrop_hash, ))
        airdrop_id = cur.fetchone()
        if airdrop_id[0]:
            airdrop_details = get_airdrop_details(cur, airdrop_id[0])
            conn.close()
            return airdrop_details
        else:
            conn.close()
            return 'Airdrop not found', 406


@ns.route('/validate')
@api.response(200, "OK")
@api.response(406, "Not Acceptable client error")
@api.response(503, "Server error")
@api.doc(parser=airdrop_parser)
class EventValidate(Resource):
    def post(self):
        """
        Validate an airdrop
        """
        try:
            if request.data:
                data = request.data
            elif len(request.files) > 0:
                args = airdrop_parser.parse_args()
                if 'multipart/form-data' in request.content_type:
                    args['airdrop_file'].save(FILES_PATH + '/airdrop_file.json')
                    with open(FILES_PATH + '/airdrop_file.json', 'r') as f:
                        data = f.read()
                else:
                    applog.error('Unsupported data type')
                    msg = {}
                    msg['error'] = 'Unsupported data type'
                    msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
                    return msg, 406
            else:
                msg = {}
                msg['error'] = 'Not Acceptable client error'
                msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
                return msg, 406
        except Exception as e:
            applog.exception(e)
            msg = {}
            msg['error'] = 'Not Acceptable client error'
            msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
            return msg, 406
        src_addresses, change_address, airdrops_list, spend_amounts, dst_addresses, \
            token_name, amounts, out, err = parse_airdrop_data(data)
        if err:
            msg = {}
            msg['error'] = err
            msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
            return msg, 406
        else:
            applog.info(out)
            applog.info('Airdrop information from the airdrops file:')
            applog.info('%d airdrops' % len(airdrops_list))
            applog.info('total lovelace: %d' % spend_amounts['lovelace'])
            applog.info('total tokens: %d' % spend_amounts[token_name])

        # read the keys from the files
        try:
            first_key = SRC_KEYS[0]
        except Exception as err:
            applog.exception('Error reading SRC_KEYS %s: %s' % (SRC_KEYS, err))
            msg = {}
            msg['error'] = 'Error reading SRC_KEYS %s: %s' % (SRC_KEYS, err)
            msg['CODE'] = 'INVALID_SIGNING_KEY'
            return msg, 503

        # get available amounts at the src_addresses
        source_transactions, src_transactions, src_token_transactions, tokens_amounts, \
            err = get_available_amounts(src_addresses)
        if err:
            applog.error(err)
            msg = {}
            msg['error'] = err
            msg['CODE'] = 'UNKNOWN_AVAILABLE_TOKENS'
            return err, 503

        # debug
        if len(src_transactions) == 0 and len(src_token_transactions) == 0:
            applog.error('No source transactions (UTXOs)!')
            msg = {}
            msg['error'] = 'No source transactions (UTXOs)!'
            msg['CODE'] = 'MISSING_UTXOS'
            return msg, 406
        applog.info('Source transactions: %s' % src_transactions)
        applog.info('Source token transactions: %s' % src_token_transactions)
        applog.info('Amounts available: %s' % tokens_amounts)
        applog.info('Amounts to spend: %s' % spend_amounts)

        # validate transaction
        if not validate_transaction(spend_amounts, tokens_amounts):
            applog.error('Spending more than existing amounts is not possible!')
            msg = {}
            msg['spend_amounts'] = spend_amounts
            msg['available_amounts'] = tokens_amounts
            msg['error'] = 'Spending more than existing amounts is not possible!'
            err_code = ''
            if spend_amounts['lovelace'] > tokens_amounts['lovelace']:
                err_code = 'NOT_ENOUGH_ADA'
            elif spend_amounts[token_name] > tokens_amounts[token_name]:
                err_code = 'NOT_ENOUGH_TOKENS'
            msg['CODE'] = err_code
            return msg, 406
        else:
            extra_lovelace = len(airdrops_list) * 4725
            applog.info('Airdrop is possible - available amounts are more than the amounts to spend.')
            if ceil(len(airdrops_list) / ADDRESSES_PER_TRANSACTION) > 1:
                transaction_count = (1 + ceil(len(airdrops_list) / ADDRESSES_PER_TRANSACTION))
            else:
                transaction_count = 1
            applog.info('Required transactions count: %d' % transaction_count)
            if spend_amounts['lovelace'] + extra_lovelace > tokens_amounts['lovelace']:
                applog.error('Please be sure there are about %f extra ADA in the source address.\n' %
                             int(188500 * transaction_count + extra_lovelace))
        applog.info('source_transactions: %s\n' % source_transactions)

        msg = {}
        msg['spend_amounts'] = spend_amounts
        msg['available_amounts'] = tokens_amounts
        msg['transactions_count'] = transaction_count
        msg['message'] = 'Airdrop is possible - available amounts are more than the amounts to spend. '
        msg['tx_fee'] = int(188500 * transaction_count + extra_lovelace)
        msg['CODE'] = 'OK'
        resp = make_response(msg)
        resp.headers['Content-Type'] = 'application/json'
        return resp


@ns.route('/submit')
@api.response(200, "OK")
@api.response(406, "Not Acceptable client error")
@api.response(503, "Server error")
@api.doc(parser=airdrop_parser)
class EventSubmit(Resource):
    def post(self):
        """
        Submit an airdrop
        """
        try:
            if request.data:
                data = request.data
            elif len(request.files) > 0:
                args = airdrop_parser.parse_args()
                if 'multipart/form-data' in request.content_type:
                    args['airdrop_file'].save(FILES_PATH + '/airdrop_file.json')
                    with open('files/airdrop_file.json', 'r') as f:
                        data = f.read()
                else:
                    applog.error('Unsupported data type')
                    msg = {}
                    msg['error'] = 'Unsupported data type'
                    msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
                    return msg, 406
            else:
                msg = {}
                msg['error'] = 'Not Acceptable client error'
                msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
                return msg, 406
        except Exception as e:
            applog.exception(e)
            msg = {}
            msg['error'] = 'Not Acceptable client error'
            msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
            return msg, 406

        airdrop_hash = hashlib.sha256(str(data).encode()).hexdigest()
        applog.info('airdrop_hash: %s' % airdrop_hash)

        # save the airdrop data for debugging
        with open(FILES_PATH + '/airdrop_' + airdrop_hash + '.json', 'wb') as f:
            f.write(data)

        src_addresses, change_address, airdrops_list, spend_amounts, dst_addresses, \
            token_name, amounts, out, err = parse_airdrop_data(data)

        if err:
            msg = {}
            msg['error'] = 'err'
            msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
            return msg, 406
        else:
            applog.info(out)
            applog.info('Airdrop information from the airdrops file:')
            applog.info('%d airdrops' % len(airdrops_list))
            applog.info('total lovelace: %d' % spend_amounts['lovelace'])
            applog.info('total tokens: %d' % spend_amounts[token_name])
        first_src_address = src_addresses[0]

        # read the keys and the addresses (where the tokens and lovelace are) from the files
        try:
            first_key = SRC_KEYS[0]
        except Exception as err:
            applog.exception('Error reading SRC_KEYS %s: %s' % (SRC_KEYS, err))
            msg = {}
            msg['error'] = 'Error reading SRC_KEYS %s: %s' % (SRC_KEYS, err)
            msg['CODE'] = 'INVALID_SIGNING_KEY'
            return msg, 503

        # get available amounts at the src_addresses
        source_transactions, src_transactions, src_token_transactions, tokens_amounts, \
            err = get_available_amounts(src_addresses)
        if err:
            applog.error(err)
            msg = {}
            msg['error'] = err
            msg['CODE'] = 'UNKNOWN_AVAILABLE_TOKENS'
            return err, 503

        # debug
        if len(src_transactions) == 0 and len(src_token_transactions) == 0:
            applog.error('No source transactions (UTXOs)!')
            msg = {}
            msg['error'] = 'No source transactions (UTXOs)!'
            msg['CODE'] = 'MISSING_UTXOS'
            return msg, 406
        # applog.info('Source transactions: %s' % src_transactions)
        # applog.info('Source token transactions: %s' % src_token_transactions)
        applog.info('Amounts available: %s' % tokens_amounts)
        applog.info('Amounts to spend: %s' % spend_amounts)

        # validate transaction
        if not validate_transaction(spend_amounts, tokens_amounts):
            applog.error('Spending more than existing amounts is not possible!')
            msg = {}
            msg['spend_amounts'] = spend_amounts
            msg['available_amounts'] = tokens_amounts
            msg['error'] = 'Spending more than existing amounts is not possible!'
            err_code = ''
            if spend_amounts['lovelace'] > tokens_amounts['lovelace']:
                err_code = 'NOT_ENOUGH_ADA'
            elif spend_amounts[token_name] > tokens_amounts[token_name]:
                err_code = 'NOT_ENOUGH_TOKENS'
            msg['CODE'] = err_code
            return msg, 406
        else:
            extra_ada = int(len(airdrops_list) / ADDRESSES_PER_TRANSACTION * (860000 + EXTRA_LOVELACE) / 1000000 + 1)
            applog.info('Airdrop is possible - available amounts are more than the amounts to spend.')
            if spend_amounts['lovelace'] + extra_ada * 1000000 > tokens_amounts['lovelace']:
                applog.error('Please be sure there are about %d extra ADA in the source address.\n' % extra_ada)

        """
        Create the required transactions list for the airdrop
        """
        out, err = generate_protocol_file()
        if err and 'Warning' not in err and 'Ok.' not in err:
            msg = {}
            msg['error'] = err.strip()
            msg['CODE'] = 'SERVER_ERROR'
            return msg, 503

        out, err = get_tip()
        if err and 'Warning' not in err and 'Ok.' not in err:
            msg = {}
            msg['error'] = err.strip()
            msg['CODE'] = 'SERVER_ERROR'
            return msg, 503
        # set transaction expire time in TRANSACTION_EXPIRE seconds (default 86400 = 1 day)
        expire = json.loads(out)['slot'] + TRANSACTION_EXPIRE

        transactions = []
        transaction = {}
        inputs = []
        outputs = []
        total_inputs = []
        total_outputs = []
        trans_lovelace = 0
        trans_tokens = 0
        count = 0
        # for the totals of all transactions
        amount_lovelace = 0
        amount_tokens = 0
        for item in airdrops_list:
            count += 1
            output = {}
            output['address'] = item['address']
            output['lovelace'] = int(item['lovelace_amount'])
            output[token_name] = int(item['tokens_amount'])
            # calculate the total amount of ADA and Tokens in this transaction
            trans_lovelace += output['lovelace']
            trans_tokens += output[token_name]
            # update the total amount of ADA and Tokens in all transactions
            amount_lovelace += output['lovelace']
            amount_tokens += output[token_name]
            outputs.append(output)
            total_outputs.append(output)
            if count >= ADDRESSES_PER_TRANSACTION:
                # total amounts for this transaction
                total_amounts = {}
                total_amounts['lovelace'] = trans_lovelace
                total_amounts[token_name] = trans_tokens
                # create the transaction and append it to the transactions list
                transaction['inputs'] = inputs
                transaction['outputs'] = outputs
                transaction['change_address'] = change_address
                transaction['total_amounts'] = total_amounts
                transactions.append(transaction)
                # re-initialize the variables for the next iteration
                transaction = {}
                inputs = []
                outputs = []
                trans_lovelace = 0
                trans_tokens = 0
                count = 0
        # last transaction, which has less than the max number of outputs
        if count > 0:
            # total amounts for this transaction
            total_amounts = {}
            total_amounts['lovelace'] = trans_lovelace
            total_amounts[token_name] = trans_tokens
            # create the transaction and append it to the transactions list
            transaction['inputs'] = inputs
            transaction['outputs'] = outputs
            transaction['change_address'] = change_address
            transaction['total_amounts'] = total_amounts
            transactions.append(transaction)

        # debug
        applog.info('----------------------------------------------------')
        applog.info('Number of transactions to do:   %20d' % len(transactions))
        applog.info('total lovelace in transactions: %20d' % amount_lovelace)
        applog.info('total tokens in transactions:   %20d' % amount_tokens)
        applog.info('----------------------------------------------------')
        applog.info('----------------------------')
        applog.info('Number of inputs:  %9d' % (len(src_transactions) + len(src_token_transactions)))
        applog.info('Number of outputs: %9d' % (len(total_outputs) + 1))
        applog.info('----------------------------')

        """
        If we have too many inputs, we need to make an input selection, to reduce the transaction size.
        First we need to sort the tokens transactions after the amount of available tokens in reverse order.
        """
        def selection_sort(input_list):
            for idx in range(len(input_list)):
                max_idx = idx
                for j in range(idx + 1, len(input_list)):
                    v1 = 0
                    for item in input_list[max_idx]['amounts']:
                        if item['token'] == token_name:
                            v1 = int(item['amount'])
                    v2 = 0
                    for item in input_list[j]['amounts']:
                        if item['token'] == token_name:
                            v2 = int(item['amount'])
                    if v1 < v2:
                        max_idx = j
                # Swap the minimum value with the compared value
                input_list[idx], input_list[max_idx] = input_list[max_idx], input_list[idx]
        selection_sort(src_token_transactions)

        """
        Write the airdrop information and the transaction information in the database
        """
        conn = sqlite3.connect(DB_NAME)
        cur = conn.cursor()
        now = datetime.datetime.now()

        if len(transactions) == 1:
            """
            If only one transaction is required for the airdrop
            Create the transaction and return it to the wallet for signing
            """
            cur.execute("INSERT INTO airdrops (hash, type, tokens_name, status, date) VALUES (?, ?, ?, ?, ?)",
                        (airdrop_hash, 'single_transaction', token_name, 'single transaction start', now))
            conn.commit()
            airdrop_id = cur.lastrowid

            transaction = {}
            transaction['inputs'] = []
            transaction['outputs'] = transactions[0]['outputs']
            transaction['change_address'] = ''
            transaction['amount_lovelace'] = 0
            transaction['amount_tokens'] = 0
            transaction['other_tokens'] = {}
            for t in src_token_transactions:
                if transaction['amount_tokens'] > spend_amounts[token_name]:
                    break
                transaction['inputs'].append(t['hash'] + '#' + t['id'])
                for item in t['amounts']:
                    if item['token'] == 'lovelace':
                        transaction['amount_lovelace'] += int(item['amount'])
                    elif item['token'] == token_name:
                        transaction['amount_tokens'] += int(item['amount'])
                    else:
                        if item['token'] in transaction['other_tokens']:
                            transaction['other_tokens'][item['token']] += int(item['amount'])
                        else:
                            transaction['other_tokens'][item['token']] = int(item['amount'])
            for t in src_transactions:
                if transaction['amount_lovelace'] > spend_amounts['lovelace'] + calculate_min_ada(token_name):
                    break
                transaction['inputs'].append(t['hash'] + '#' + t['id'])
                transaction['amount_lovelace'] += int(t['amount'])

            # if we don't have enough lovelaces in the inputs, add more inputs with tokens
            while amount_lovelace < transaction['amount_lovelace'] + (calculate_min_ada(token_name) *
                    (len(transaction['outputs']) + len(transaction['other_tokens']) + 1)):
                for t in src_token_transactions:
                    input = t['hash'] + '#' + t['id']
                    if input in transaction['inputs']:
                        continue
                    transaction['inputs'].append(input)
                    for item in t['amounts']:
                        if item['token'] == 'lovelace':
                            transaction['amount_lovelace'] += int(item['amount'])
                        elif item['token'] == token_name:
                            transaction['amount_tokens'] += int(item['amount'])
                        else:
                            if item['token'] in transaction['other_tokens']:
                                transaction['other_tokens'][item['token']] += int(item['amount'])
                            else:
                                transaction['other_tokens'][item['token']] = int(item['amount'])

            """
            Calculate the amounts of lovelace, tokens and other tokens in all spent UTxOs
            """
            # create the cmd
            cmd = ['cardano-cli', 'transaction', 'build']

            # transaction inputs
            for t in transaction['inputs']:
                cmd.append('--tx-in')
                cmd.append(t)

            # transaction outputs
            for t in transaction['outputs']:
                cmd.append('--tx-out')
                cmd.append(t['address'] + '+' + str(t['lovelace']) + '+' + str(t[token_name]) + ' ' + token_name)
                output = {}
                output['address'] = t['address']
                output['lovelace'] = t['lovelace']
                output[token_name] = t[token_name]

            # outputs with other tokens in the input UTxOs
            for t in transaction['other_tokens'].keys():
                cmd.append('--tx-out')
                cmd.append(change_address + '+' + str(calculate_min_ada(t)) + '+' +
                           str(transaction['other_tokens'][t]) + ' ' + t)
                output = {}
                output['address'] = change_address
                output['lovelace'] = calculate_min_ada(t)
                output[t] = transaction['other_tokens'][t]
                transaction['outputs'].append(output)

            cmd.append('--tx-out')
            cmd.append(change_address + '+' + str(EXTRA_LOVELACE) + '+' +
                       str(transaction['amount_tokens'] - spend_amounts[token_name]) + ' ' + str(token_name))
            output = {}
            output['address'] = change_address
            output['lovelace'] = EXTRA_LOVELACE
            output[token_name] = str(transaction['amount_tokens'] - spend_amounts[token_name])
            transaction['outputs'].append(output)

            cmd.append('--change-address')
            cmd.append(change_address)
            transaction['change_address'] = change_address
            cmd.append('--invalid-hereafter')
            cmd.append(str(expire))
            cmd.append('--out-file')
            cmd.append(TRANSACTIONS_PATH + '/tx.raw')
            cmd.append(CARDANO_NET)
            if len(MAGIC_NUMBER) != 0:
                cmd.append(str(MAGIC_NUMBER))
            out, err = cardano_cli_cmd(cmd)
            if err:
                applog.error(err)
                msg = {}
                msg['error'] = 'Server error: %s' % err
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503
            applog.info(out)
            transaction_fee = out.strip().split(' ')[-1]

            # get the transaction id
            cmd = ["cardano-cli", "transaction", "txid", "--tx-body-file", TRANSACTIONS_PATH + '/tx.raw']
            # execute the command
            out, err = cardano_cli_cmd(cmd)
            if err:
                applog.error(err)
                msg = {}
                msg['error'] = 'Server error: %s' % err
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503
            txid = out.strip()
            applog.info('Transaction ID: %s' % txid)

            """
            Insert the transaction into the database
            """
            now = datetime.datetime.now()
            cur.execute("INSERT INTO transactions (airdrop_id, hash, name, status, date) VALUES (?, ?, ?, ?, ?)",
                        (airdrop_id, txid, 'single_transaction', 'transaction created', now))
            cur.execute("UPDATE airdrops SET status = 'single transaction created', date = ? WHERE id = ?",
                        (now, airdrop_id))
            trans_id = cur.lastrowid
            cur.execute("INSERT INTO transaction_details (transaction_id, src_addresses, inputs, outputs, "
                        "change_address, date) VALUES (?, ?, ?, ?, ?, ?)",
                        (trans_id, json.dumps(src_addresses), json.dumps(transaction['inputs']),
                         json.dumps(transaction['outputs']), transaction['change_address'], now))
            conn.commit()

            # sign transaction
            _, err = sign_transaction(SRC_KEYS, TRANSACTIONS_PATH + '/tx.raw', TRANSACTIONS_PATH + '/tx.signed')
            if err:
                applog.error(err)
                msg = {}
                msg['error'] = 'Server error: %s' % err
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503
            """
            Update the transaction status - signed
            """
            now = datetime.datetime.now()
            cur.execute("UPDATE transactions SET status = 'transaction returned for signing', date = ? WHERE id = ?",
                        (now, trans_id))
            cur.execute("UPDATE airdrops SET status = 'single transaction returned for signing', date = ? WHERE id = ?",
                        (now, airdrop_id))
            conn.commit()

            """
            Return the transaction to the website
            """
            try:
                with open(TRANSACTIONS_PATH + '/tx.signed', 'r') as f:
                    signed_transaction = json.loads(f.read())
            except Exception as exc:
                applog.error('Exception reading the signed transaction file %s' %
                             TRANSACTIONS_PATH + '/tx.signed')
                applog.exception(exc)

            signed_transaction['description'] = txid

            resp = make_response(signed_transaction)
            resp.headers['Content-Type'] = 'application/json'
            resp.headers['Transaction-Type'] = 'Single-Transaction'
            resp.headers['Transaction-Fee'] = str(transaction_fee) + ' lovelace'
            resp.headers['Airdrop-Hash'] = airdrop_hash
            return resp

        else:
            """
            If more than one transaction is required, create the initial transaction, 
            which will create the UTxOs to the airdrop transactions 
            """
            cur.execute("INSERT INTO airdrops (hash, type, tokens_name, status, date) VALUES (?, ?, ?, ?, ?)",
                        (airdrop_hash, 'multi_transaction', token_name, 'utxo create transaction start', now))
            conn.commit()
            airdrop_id = cur.lastrowid

            transaction = {}
            transaction['inputs'] = []
            transaction['outputs'] = []
            transaction['change_address'] = ''
            transaction['amount_lovelace'] = 0
            transaction['amount_tokens'] = 0
            transaction['other_tokens'] = {}
            for t in src_token_transactions:
                if transaction['amount_tokens'] > spend_amounts[token_name]:
                    break
                transaction['inputs'].append(t['hash'] + '#' + t['id'])
                for item in t['amounts']:
                    if item['token'] == 'lovelace':
                        transaction['amount_lovelace'] += int(item['amount'])
                    elif item['token'] == token_name:
                        transaction['amount_tokens'] += int(item['amount'])
                    else:
                        if item['token'] in transaction['other_tokens']:
                            transaction['other_tokens'][item['token']] += int(item['amount'])
                        else:
                            transaction['other_tokens'][item['token']] = int(item['amount'])
            for t in src_transactions:
                if transaction['amount_lovelace'] > spend_amounts['lovelace'] + \
                        calculate_min_ada(token_name) * (len(transactions) + 1) + \
                        EXTRA_LOVELACE * (len(transactions) + 1):
                    break
                transaction['inputs'].append(t['hash'] + '#' + t['id'])
                transaction['amount_lovelace'] += int(t['amount'])

            # if we don't have enough lovelaces in the inputs, add more inputs with tokens
            while amount_lovelace > transaction['amount_lovelace'] + (calculate_min_ada(token_name) *
                    (len(transaction['outputs']) + len(transaction['other_tokens']) + 1)):
                for t in src_token_transactions:
                    input = t['hash'] + '#' + t['id']
                    if input in transaction['inputs']:
                        continue
                    transaction['inputs'].append(input)
                    for item in t['amounts']:
                        if item['token'] == 'lovelace':
                            transaction['amount_lovelace'] += int(item['amount'])
                        elif item['token'] == token_name:
                            transaction['amount_tokens'] += int(item['amount'])
                        else:
                            if item['token'] in transaction['other_tokens']:
                                transaction['other_tokens'][item['token']] += int(item['amount'])
                            else:
                                transaction['other_tokens'][item['token']] = int(item['amount'])

            # create the cmd
            cmd = ['cardano-cli', 'transaction', 'build']
            # transaction inputs
            for t in transaction['inputs']:
                cmd.append('--tx-in')
                cmd.append(t)
                applog.debug(t)

            # transaction outputs
            for t in transactions:
                cmd.append('--tx-out')
                cmd.append(first_src_address + '+' + str(t['total_amounts']['lovelace'] + EXTRA_LOVELACE) + '+' +
                           str(t['total_amounts'][token_name]) + ' ' + token_name + '')
                output = {}
                output['address'] = first_src_address
                output['lovelace'] = t['total_amounts']['lovelace']
                output[token_name] = t['total_amounts'][token_name]
                transaction['outputs'].append(output)

            # outputs with other tokens in the input UTxOs
            for t in transaction['other_tokens'].keys():
                cmd.append('--tx-out')
                cmd.append(change_address + '+' + str(calculate_min_ada(t)) + '+' +
                           str(transaction['other_tokens'][t]) + ' ' + t)
                output = {}
                output['address'] = change_address
                output['lovelace'] = calculate_min_ada(t)
                output[t] = transaction['other_tokens'][t]
                transaction['outputs'].append(output)

            cmd.append('--tx-out')
            cmd.append(change_address + '+' + str(EXTRA_LOVELACE) + '+' +
                       str(transaction['amount_tokens'] - amount_tokens) + ' ' + str(token_name))
            output = {}
            output['address'] = change_address
            output['lovelace'] = EXTRA_LOVELACE
            output[token_name] = transaction['amount_tokens'] - amount_tokens
            transaction['outputs'].append(output)
            cmd.append('--change-address')
            cmd.append(change_address)
            transaction['change_address'] = change_address
            cmd.append('--invalid-hereafter')
            cmd.append(str(expire))
            cmd.append('--out-file')
            cmd.append(TRANSACTIONS_PATH + '/tx.raw')
            cmd.append(CARDANO_NET)
            if len(MAGIC_NUMBER) != 0:
                cmd.append(str(MAGIC_NUMBER))
            out, err = cardano_cli_cmd(cmd)
            if err:
                applog.error(err)
                msg = {}
                msg['error'] = 'Server error: %s' % err
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503
            applog.info(out)
            transaction_fee = out.strip().split(' ')[-1]

            # get the transaction id
            cmd = ["cardano-cli", "transaction", "txid", "--tx-body-file", TRANSACTIONS_PATH + '/tx.raw']
            # execute the command
            out, err = cardano_cli_cmd(cmd)
            if err:
                applog.error(err)
                msg = {}
                msg['error'] = 'Server error: %s' % err
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503
            txid = out.strip()
            applog.info('Transaction ID: %s' % txid)

            """
            Insert the transaction into the database
            """
            now = datetime.datetime.now()
            cur.execute("INSERT INTO transactions (airdrop_id, hash, name, status, date) VALUES (?, ?, ?, ?, ?)",
                        (airdrop_id, txid, 'utxo_transaction', 'transaction created', now))
            cur.execute("UPDATE airdrops SET status = 'utxo transaction created', date = ? WHERE id = ?",
                        (now, airdrop_id))
            trans_id = cur.lastrowid
            cur.execute("INSERT INTO transaction_details (transaction_id, src_addresses, inputs, outputs, "
                        "change_address, date) VALUES (?, ?, ?, ?, ?, ?)",
                        (trans_id, json.dumps(src_addresses), json.dumps(transaction['inputs']),
                         json.dumps(transaction['outputs']), transaction['change_address'], now))
            conn.commit()

            # sign transaction
            _, err = sign_transaction(SRC_KEYS, TRANSACTIONS_PATH + '/tx.raw', TRANSACTIONS_PATH + '/tx.signed')
            if err:
                applog.error(err)
                msg = {}
                msg['error'] = 'Server error: %s' % err
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503
            """
            Update the transaction status - signed
            """
            now = datetime.datetime.now()
            cur.execute("UPDATE transactions SET status = 'transaction signed', date = ? WHERE id = ?",
                        (now, trans_id))
            cur.execute("UPDATE airdrops SET status = 'utxo transaction signed', date = ? WHERE id = ?",
                        (now, airdrop_id))
            conn.commit()

            """
            Return the transaction to the website
            """
            try:
                with open(TRANSACTIONS_PATH + '/tx.signed', 'r') as f:
                    signed_transaction = json.loads(f.read())
            except Exception as exc:
                applog.error('Exception reading the signed transaction file %s' %
                             TRANSACTIONS_PATH + '/tx.signed')
                applog.exception(exc)

            now = datetime.datetime.now()
            cur.execute("UPDATE transactions SET status = 'transaction returned for signing', date = ? WHERE id = ?",
                        (now, trans_id))
            cur.execute("UPDATE airdrops SET status = 'utxo transaction returned for signing', date  = ? WHERE id = ?",
                        (now, airdrop_id))

            """
            Insert all planned airdrop transactions into the database  
            """
            count = 0
            for transaction in transactions:
                count += 1
                t_inputs = json.dumps(transaction['inputs'])
                t_outputs = json.dumps(transaction['outputs'])
                t_change_address = transaction['change_address']
                t_amount_lovelace = transaction['total_amounts']['lovelace']
                t_amount_tokens = transaction['total_amounts'][token_name]
                cur.execute("INSERT INTO transactions (airdrop_id, hash, name, status, date) VALUES (?, ?, ?, ?, ?)",
                            (airdrop_id, '-', 'airdrop_transaction_' + str(count),
                             'planned', now))
                trans_id = cur.lastrowid
                cur.execute("INSERT INTO transaction_details (transaction_id, src_addresses, inputs, outputs, "
                            "change_address, amount_lovelace, amount_tokens, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                            (trans_id, json.dumps(src_addresses), t_inputs, t_outputs, t_change_address,
                             t_amount_lovelace, t_amount_tokens, now))

            conn.commit()

            signed_transaction['description'] = txid

            resp = make_response(signed_transaction)
            resp.headers['Content-Type'] = 'application/json'
            resp.headers['Transaction-Type'] = 'UTxO-Create-Transaction'
            resp.headers['Transaction-Fee'] = str(transaction_fee) + ' lovelace'
            resp.headers['Airdrop-Hash'] = airdrop_hash
            return resp


@ns.route('/submit_transaction')
@api.response(200, "OK")
@api.response(406, "Not Acceptable client error")
@api.response(503, "Server error")
@api.doc(parser=transaction_parser)
class EventSubmitTransaction(Resource):
    def post(self):
        """
        Submit a signed transaction
        """
        try:
            if request.data:
                data = json.loads(request.data)
                with open(TRANSACTIONS_PATH + '/transaction_file.signed', 'w') as f:
                    f.write(json.dumps(data))
            elif len(request.files) > 0:
                args = transaction_parser.parse_args()
                if 'multipart/form-data' in request.content_type:
                    args['transaction_file'].save(TRANSACTIONS_PATH + '/transaction_file.signed')
                    with open(TRANSACTIONS_PATH + '/transaction_file.signed', 'r') as f:
                        data = json.loads(f.read())
                else:
                    applog.error('Unsupported data type')
                    msg = {}
                    msg['error'] = 'Unsupported data type'
                    msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
                    return msg, 406
            else:
                msg = {}
                msg['error'] = 'Not Acceptable client error'
                msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
                return msg, 406
        except Exception as e:
            applog.exception(e)
            msg = {}
            msg['error'] = 'Not Acceptable client error'
            msg['CODE'] = 'UNSUPPORTED_DATA_TYPE'
            return msg, 406

        # transaction ID received after being signed
        old_txid = data['description']

        # get the transaction id
        cmd = ["cardano-cli", "transaction", "txid", "--tx-file", TRANSACTIONS_PATH + '/transaction_file.signed']
        # execute the command
        out, err = cardano_cli_cmd(cmd)
        if err:
            applog.error(err)
            msg = {}
            msg['error'] = 'Server error: %s' % err
            msg['CODE'] = 'SERVER_ERROR'
            return msg, 503
        txid = out.strip()
        applog.info('Received transaction ID: %s' % txid)

        """
        Get the transaction information from the database
        """
        conn = sqlite3.connect(DB_NAME)
        cur = conn.cursor()
        cur.execute("SELECT t.id, t.airdrop_id, t.name, t.description, t.status, t.date, a.hash, td.change_address "
                    "FROM transactions t JOIN airdrops a ON t.airdrop_id = a.id "
                    "JOIN transaction_details td ON t.id = td.transaction_id "
                    "WHERE t.hash = ? ORDER BY t.id DESC limit 1", (old_txid, ))
        try:
            trans = cur.fetchone()
            if not trans:
                applog.error('Transaction %s not found' % old_txid)
                msg = {}
                msg['error'] = 'Transaction %s not found' % old_txid
                msg['CODE'] = 'TRANSACTION_NOT_FOUND'
                return msg, 406
            trans_id = trans[0]
            airdrop_id = trans[1]
            name = trans[2]
            status = trans[4]
            airdrop_hash = trans[6]
            change_address = trans[7]

            if status != 'transaction returned for signing':
                # avoid multiple times transaction submission
                return 'Invalid transaction status: %s' % status, 406

            # submit transaction to the local node
            if len(MAGIC_NUMBER) == 0:
                cmd = ["cardano-cli", "transaction", "submit", "--tx-file",
                       TRANSACTIONS_PATH + '/transaction_file.signed', CARDANO_NET]
            else:
                cmd = ["cardano-cli", "transaction", "submit", "--tx-file",
                       TRANSACTIONS_PATH + '/transaction_file.signed', CARDANO_NET, str(MAGIC_NUMBER)]
            out, err = cardano_cli_cmd(cmd)
            if err:
                applog.error(err)
                """
                Update the transaction status - error
                """
                now = datetime.datetime.now()
                submit_status = 'submit error: ' + err
                cur.execute("UPDATE transactions SET hash = ?, status = ?, date = ? WHERE id = ?",
                            (txid, submit_status, now, trans_id))
                submit_status = name.replace('_', ' ') + ' transaction submit error'
                cur.execute("UPDATE airdrops SET status = ?, date = ? WHERE id = ?",
                            (submit_status, now, airdrop_id))
                conn.commit()
                msg = {}
                msg['error'] = 'Server error: %s' % err
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503

        except Exception as exc:
            applog.error('Transaction %s not found' % old_txid)
            applog.exception(exc)
            msg = {}
            msg['error'] = 'Transaction %s not found' % old_txid
            msg['CODE'] = 'TRANSACTION_NOT_FOUND'
            return msg, 406

        """
        Transaction submitted successfully
        """
        now = datetime.datetime.now()
        submit_status = name.replace('_', ' ') + ' submitted'
        cur.execute("UPDATE transactions SET hash = ?, status = 'transaction submitted', date = ? WHERE id = ?",
                    (txid, now, trans_id))
        cur.execute("UPDATE airdrops SET status = ?, date = ? WHERE id = ?",
                    (submit_status, now, airdrop_id))
        conn.commit()
        conn.close()
        applog.debug(change_address)
        trans_wait_thread = threading.Thread(target=wait_for_transaction, args=(txid, change_address,
                                                                                airdrop_id, trans_id, name, applog))
        trans_wait_thread.start()

        msg = {}
        msg['airdrop_hash'] = airdrop_hash
        msg['transaction_id'] = txid
        msg['status'] = 'transaction %s submitted' % old_txid
        resp = make_response(msg)
        resp.headers['Content-Type'] = 'application/json'
        return resp


@ns.route('/get_transactions/<string:airdrop_hash>')
@api.response(200, "OK")
@api.response(406, "Not Acceptable client error")
@api.response(503, "Server error")
@api.doc(parser=transaction_parser)
class EventGetTransactions(Resource):
    def get(self, airdrop_hash):
        """
        Get the airdrop transactions in json format
        """
        conn = sqlite3.connect(DB_NAME)
        cur = conn.cursor()

        cur.execute("SELECT id, status from airdrops WHERE hash = ? ORDER BY id DESC LIMIT 1", (airdrop_hash, ))
        try:
            item = cur.fetchone()
            if not item:
                msg = {}
                msg['error'] = 'Airdrop %s not found' % airdrop_hash
                msg['CODE'] = 'AIRDROP_NOT_FOUND'
                return msg, 406
            airdrop_id = item[0]
            airdrop_status = item[1]
            applog.debug('Airdrop id: %s, Status: %s' % (airdrop_id, airdrop_status))
            if airdrop_status != 'utxo transaction adopted':
                msg = {}
                msg['error'] = 'Invalid airdrop status: %s' % airdrop_status
                msg['CODE'] = 'INVALID_AIRDROP_STATUS'
                return msg, 406
        except Exception as exc:
            applog.exception(exc)
            msg = {}
            msg['error'] = str(exc)
            msg['CODE'] = 'SERVER_ERROR'
            return msg, 503

        cur.execute("SELECT t.id, t.airdrop_id, t.name, t.status, t.date, a.hash, "
                    "td.src_addresses, td.inputs, td.outputs, td.change_address, "
                    "td.amount_lovelace, td.amount_tokens "
                    "FROM transactions t JOIN airdrops a ON t.airdrop_id = a.id "
                    "JOIN transaction_details td on t.id = td.transaction_id "
                    "WHERE a.id = ? AND t.name <> 'utxo_transaction' ORDER BY t.id",
                    (airdrop_id, ))
        try:
            transactions = cur.fetchall()
            if not transactions:
                msg = {}
                msg['error'] = 'Airdrop %s not found' % airdrop_hash
                msg['CODE'] = 'AIRDROP_NOT_FOUND'
                return msg, 406
        except Exception as exc:
            applog.exception(exc)
            msg = {}
            msg['error'] = str(exc)
            msg['CODE'] = 'SERVER_ERROR'
            return msg, 503

        resp_transactions = []
        transaction_nr = 0
        transaction_fees = 0
        used_utxos = []
        for trans in transactions:
            try:
                trans_id = trans[0]
                airdrop_id = trans[1]
                src_addresses = json.loads(trans[6])
                outputs = json.loads(trans[8])
                change_address = trans[9]
                amount_lovelace = int(trans[10])
                amount_tokens = int(trans[11])
            except Exception as exc:
                applog.exception(exc)
                msg = {}
                msg['error'] = str(exc)
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503

            transaction_nr += 1
            # get available amounts at the src_addresses
            source_transactions, src_transactions, src_token_transactions, tokens_amounts, \
                err = get_available_amounts(src_addresses)
            if err:
                msg = {}
                msg['error'] = str(err)
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503

            token_name = list(outputs[0].keys())[2]
            inputs = []
            i_found = False
            for t in src_token_transactions:
                for token in t['amounts']:
                    try:
                        if token['token'] == 'lovelace' and amount_lovelace + EXTRA_LOVELACE != int(token['amount']):
                            continue
                        elif token['token'] == token_name and amount_tokens != int(token['amount']):
                            continue
                        elif token['token'] != token_name:
                            continue
                    except Exception as exc:
                        applog.exception(exc)
                        continue
                    # found the right UTxO
                    i = {}
                    i['hash'] = t['hash']
                    i['id'] = t['id']
                    # if this UTxO was already selected for another transaction
                    if i in used_utxos:
                        continue
                    # UTxO found
                    i_found = True
                    used_utxos.append(i)
                    inputs.append(i)
                    src_token_transactions.remove(t)
                    break
                if i_found:
                    break

            if not i_found:
                msg = {}
                msg['error'] = 'UTxO not found'
                msg['CODE'] = 'UTXO_NOT_FOUND'
                return msg, 503

            out, err = get_tip()
            if err and 'Warning' not in err and 'Ok.' not in err:
                msg = {}
                msg['error'] = err.strip()
                return msg, 503
            # set transaction expire time in TRANSACTION_EXPIRE seconds (default 86400 = 1 day)
            expire = json.loads(out)['slot'] + TRANSACTION_EXPIRE

            cmd = ['cardano-cli', 'transaction', 'build']
            trans_filename_prefix = TRANSACTIONS_PATH + '/tx' + str(transaction_nr)
            # add the inputs
            for t in inputs:
                cmd.append('--tx-in')
                cmd.append(t['hash'] + '#' + str(t['id']))
            for t in outputs:
                cmd.append('--tx-out')
                cmd.append(t['address'] + '+' + str(t['lovelace']) + '+' + str(t[token_name]) + ' ' + token_name + '')
            cmd.append('--change-address')
            cmd.append(change_address)
            cmd.append('--invalid-hereafter')
            cmd.append(str(expire))
            cmd.append('--out-file')
            cmd.append(trans_filename_prefix + '.raw')
            cmd.append(CARDANO_NET)
            if len(MAGIC_NUMBER) != 0:
                cmd.append(str(MAGIC_NUMBER))
            out, err = cardano_cli_cmd(cmd)
            if err:
                applog.error(err)
                now = datetime.datetime.now()
                cur.execute("UPDATE airdrops SET status = ?, date = ? WHERE id = ?",
                            ('error creating airdrop transactions: ' + err, now, airdrop_id))
                conn.commit()
                msg = {}
                msg['error'] = 'Server error: %s' % err
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503
            applog.info(out)
            transaction_fees += int(out.strip().split(' ')[-1])

            # sign transaction
            _, err = sign_transaction(SRC_KEYS, trans_filename_prefix + '.raw', trans_filename_prefix + '.signed')
            if err:
                applog.error(err)
                now = datetime.datetime.now()
                cur.execute("UPDATE airdrops SET status = ?, date = ? WHERE id = ?",
                            ('error signing airdrop transactions: ' + err, now, airdrop_id))
                conn.commit()
                msg = {}
                msg['error'] = 'Server error: %s' % err
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503

            # get the transaction id
            cmd = ["cardano-cli", "transaction", "txid", "--tx-file", trans_filename_prefix + '.signed']
            # execute the command
            out, err = cardano_cli_cmd(cmd)
            if err:
                applog.error(err)
                msg = {}
                msg['error'] = 'Server error: %s' % err
                msg['CODE'] = 'SERVER_ERROR'
                return msg, 503
            txid = out.strip()
            applog.info('Transaction ID: %s' % txid)

            now = datetime.datetime.now()
            cur.execute("UPDATE transactions SET status = 'transaction returned for signing', date = ?, hash = ? "
                        "WHERE id = ?", (now, txid, trans_id))
            conn.commit()

            try:
                with open(trans_filename_prefix + '.signed', 'r') as f:
                    signed_transaction = json.loads(f.read())
            except Exception as exc:
                applog.error('Exception reading the signed transaction file %s' %
                             trans_filename_prefix + '.signed')
                applog.exception(exc)

            signed_transaction['description'] = txid
            resp_transactions.append(signed_transaction)

        resp = make_response(json.dumps(resp_transactions))
        resp.headers['Content-Type'] = 'application/json'
        resp.headers['Transaction-Type'] = 'airdrop_transaction_' + str(transaction_nr)
        resp.headers['Transaction-Fee'] = str(transaction_fees) + ' lovelace'
        resp.headers['Airdrop-Hash'] = airdrop_hash
        return resp


if __name__ == '__main__':
    """
    Create database and tables if not already existing
    """
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
    cur.execute('''CREATE INDEX IF NOT EXISTS transaction_details_transaction_id 
                on transaction_details(transaction_id)''')
    conn.commit()

    applog.info("*****************************************************************")
    applog.info('Starting')

    app.run(
        threaded=True,
        host='0.0.0.0',
        port=API_PORT
    )
