# Airdrop tool API

## Workflow

### Validate airdrop
This step is optional, but it will check if the airdrop can be done (if enough funds are available for the airdrop), and in case there are enough funds, how many transactions will be required to complete the airdrop.

The API endpoint is `/api/v0/validate`, and it accepts POST requests.
The data must be sent in json format.

```json
{
    "source_addresses": [
        "addr_test1qzp8cxpn0w7anp7eymcxxxxxxxxxxxxxxxxxxxxn97nrfk9xuaee3myenyc8zk0tctxye8uktqtn9n9e"
    ],
    "change_address": "addr_test1qzp8cxpn0w7anp7eymcxxxxxxxxxxxxxxxxxxxxn97nrfk9xuaee3myenyc8zk0tctxyudkmxyl7dov5e",
    "token_name": "67bf65821e976fc17078fbaxxxxxxxxxabf17e01e700c6b1bda24a62.7465xxxxx46f6e",
    "addresses": [
        {
            "addr_test1qz6flfdgrvjt0294dzvcysxxxxxxxxxxxxxxxxxxxxxxxxxxxtjakfgj2v4sxz2q6gdp5nr3mcxge2794gl0uv8c26pqd6uq2j": "3800000"
        },
        {
            "addr_test1qz6vven3weyxxxxxxxxxxxxxxxxxxf99ggumlkc2eg8ea3e6ktjakfgj2v4sxz2q6gdp5nr3mcxge2794gl0uv8c26pqg6ujyy": "3185000"
        },
        {
            "addr_test1qrnxu64ruygcm0x7lrxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxq6gdp5nr3mcxge2794gl0uv8c26pqk8ynpe": "2400000"
        },
        {
            "addr_test1qprwu8qwgwjenctz2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxz2q6gdp5nr3mcxge2794gl0uv8c26pqjrucsy": "2450000"
        },
        {
            "addr_test1qqyx74hxfy2z0nyx3rngxgsxlxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxcxge2794gl0uv8c26pqznh3dq": "2550000"
        },
        {
            "addr_test1qr9qy2n97mjzmt3jxwh82wnuxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxmcxge2794gl0uv8c26pqftek5f": "2350000"
        },
        {
            "addr_test1qzjenrac8h5ptfkqjvvu4pu56xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxr3mcxge2794gl0uv8c26pqe370lg": "2350000"
        },
        {
            "addr_test1qzpqu0dgg6t22gxcjy5zmh8k8nxpexxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxz2q6gdp5nr3mcxge2794gl0uv8c26pqt58w5c": "2990000"
        },
        {
            "addr_test1qzd5ym0ln3jf827xq7e3vlzxpwq785xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx5nr3mcxge2794gl0uv8c26pqp8fyqx": "2450000"
        },
        {
            "addr_test1qq2wt6lmme7jqfvxkrf54hlxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxnr3mcxge2794gl0uv8c26pq8s858g": "2280000"
        }
    ]
}
```

The `change_address` is optional.
If the airdrop can be done (if enough tokens and ada are available in the source addresses), the result will display that, together with the number of transactions required for the airdrop.

```json
{
    "available_amounts": {
        "126b8676446c8xxxxxxxxxxxxxxxxxxxxx4c5676b88ae1c1f8579a8f.74534f554c": 8000,
        "57fca08abbaddee3xxxxxxxxxxxxxxxxxxxxxxxxxxxx7fcbf3916522.4d494e54": 5000,
        "67bf65821e976xxxxxxxxxxxxxxxxxxxxxxxxxxxxx00c6b1bda24a62.742222226f6e": 510210000,
        "lovelace": 9780953706
    },
    "message": "Airdrop is possible - available amounts are more than the amounts to spend. Please be sure there are about 10 extra ADA in the source address.",
    "spend_amounts": {
        "67bf65821e976xxxxxxxxxxxxxxxxxxxxxxxxxxxxx00c6b1bda24a62.742222226f6e": 26805000,
        "lovelace": 13447980
    },
    "transactions_count": 3
}
```

### Submit airdrop
The `/api/v0/submit` endpoint accepts POST requests in the same format as the `/api/v0/submit` endpoint.
If the `change_address` is not specified, the first address in the `source_addresses` list will be used as change address (the remaining tokens and ADA will be sent to this address).

If the airdrop can be performed with only one transactions (if the number of destination addresses is not large - by default 120 addresses, the absolute maximum can be about 142, and if there are enough tokens and ada in the wallet source addresses), a single transaction will be created, signed with a dummy key and returned to the front-end in CBOR frmat.
The front-end will have to sign it and then send it to the `/spi/v0/submit_transaction` endpoint.

If the airdrop cannot be performed in one transaction, the number of transactions will be computed, the transactions will be saved in a sqlite database. Then, a first transactions will be created, signed with a dummy key and sent back to the front-end in CBOR format to be signed and sent to the `/spi/v0/submit_transaction` endpoint.
This transaction will create the UTxOs required fot the airdrop transactions which were saved in the database, and which will be created after the first transactions is adopted by the blockchain.
The following response headers will also be returned, to provide extra information:
- `Airdrop-Hash`: 9503cb73f26171d85d41821cbc64feeeeef683f727099cca6a3ddb9310d0c0af
- `Transaction-Type`: Single-Transaction (in case the airdrop can be performed in one transaction)
- `Transaction-Type`: UTxO-Create-Transaction (in case multiple transactions are required)

### Airdrop status
The `/api/v0/airdrop_status` endpoint accepts GET requests, with the airdrop hash as parameter in URL (`/api/v0/airdrop_status/9503cb73f26171d85d41821cbc64feeeeef683f727099cca6a3ddb9310d0c0af`).
This is a sample response after an airdrop (which can be performed in multiple transactions) was submitted to the `api/v0/submit` andpoint:

```json
{
    "airdrop_hash": "203b1618fea8cce4453788749fb48ef735f19452debb7c2ecb9a50d0a49b0bf8",
    "status": "utxo transaction returned for signing",
    "date": "2022-03-14 13:10:57.143972",
    "transactions": [
        {
            "transaction_hash": "3c5681b835e97e850ba29ede0c2562bcbf0c66dd305761880b76b93550d0f020",
            "transaction_name": "utxo_transaction",
            "transaction_status": "transaction returned for signing",
            "transaction_data": "2022-03-14 13:10:57.143972"
        },
        {
            "transaction_hash": "-",
            "transaction_name": "airdrop_transaction_1",
            "transaction_status": "planned",
            "transaction_data": "2022-03-14 13:10:57.143972"
        },
        {
            "transaction_hash": "-",
            "transaction_name": "airdrop_transaction_2",
            "transaction_status": "planned",
            "transaction_data": "2022-03-14 13:10:57.143972"
        }
    ]
}
```

### Submit transaction
The `/api/v0/submit_transaction` endpoint accepts POST requests. The CBOR transaction received from the `/api/v0/submit` endpoint or from the `/api/v0/get_transaction` endpoint (documented below) must be signed and set to this endpoint to be submitted to the blockchain.
The result will have the following format:

```json
{
    "airdrop_hash": "9503cb73f26171d85d41821cbc64feeeeef683f727099cca6a3ddb9310d0c0af",
    "status": "transaction submitted",
    "transaction_id": "0d330a88cd055b5dc4331c311111222224d3f73e44b3e157f67f4efdb5226f35"
}
```

### Get transactions
In a multi-transaction airdrop, once the first transaction was adopted, the `/api/v0/get_transactions` GET endpoint will be used to generate the airdrop transactions. It will return the list of transactions required for the airdrop to be performed. The transactions must be signed by the front-end and sent to the `/api/v0/submit` endpoint one by one. It is not required to make pause between transactions.
It can be used only after the "status" in the `/api/v0/aidrop_status` changes to "utxo transaction adopted".

```json
{
    "airdrop_hash": "203b1618fea8cce4453788749fb48ef735f19452debb7c2ecb9a50d0a49b0bf8",
    "status": "utxo transaction adopted",

```
The request has the following format: `/api/v0/get_transaction/203b1618fea8cce4453788749fb48ef735f19452debb7c2ecb9a50d0a49b0bf8`
where the first URL parameter is the airdrop hash, as returned by the `/api/v0/submit` endpoint in the `Airdrop-Hash` header.
