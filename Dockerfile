FROM python:3.9 AS base

WORKDIR /app
COPY server .
RUN mkdir -p db files transactions wallet && \
    touch db/.keep files/.keep transactions/.keep wallet/.keep && \
    pip install -r requirements.txt && \
    curl -fsSLo /usr/local/bin/cardano-cli \
    https://psilobyte.io/cardano/bin/$(uname -m)-cardano-node-1-34-1/cardano-cli && \
    chmod +x /usr/local/bin/cardano-cli
CMD ["/app/run_api.sh"]
