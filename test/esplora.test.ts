import { UtxoInterface } from './../dist/types.d';
import {
  fetchAndUnblindTxs,
  fetchAndUnblindUtxos,
} from '../src/explorer/esplora';
import {
  senderAddress,
  senderBlindingKey,
  senderBlindKeyGetter,
} from './fixtures/wallet.keys';
import { APIURL, faucet } from './_regtest';
import { isBlindedUtxo } from '../src/utils';
import * as assert from 'assert';

jest.setTimeout(80000);

describe('fetchAndUnblindUtxos', () => {
  let txid: string;

  beforeAll(async () => {
    txid = await faucet(senderAddress);
  });

  it('should unblind utxos if the blinding key is provided', async () => {
    const senderUtxos = await fetchAndUnblindUtxos(
      [
        {
          confidentialAddress: senderAddress,
          blindingPrivateKey: senderBlindingKey,
        },
      ],
      APIURL
    );

    const faucetUtxo = senderUtxos.find(utxo => utxo.txid === txid);
    assert.deepStrictEqual(isBlindedUtxo(faucetUtxo!), false);
  });

  it('should skip unblinding step if the skip predicate returns true', async () => {
    const senderUtxos = await fetchAndUnblindUtxos(
      [
        {
          confidentialAddress: senderAddress,
          blindingPrivateKey: senderBlindingKey,
        },
      ],
      APIURL,
      // with this skip predicate, `txid` utxos won't be unblinded
      (utxo: UtxoInterface) => utxo.txid === txid
    );

    const faucetUtxo = senderUtxos.find(utxo => utxo.txid === txid);
    assert.deepStrictEqual(isBlindedUtxo(faucetUtxo!), true);
  });
});

describe('fetchAndUnblindTxs', () => {
  let txid: string;

  beforeAll(async () => {
    txid = await faucet(senderAddress);
  });

  it('should return txs if the blinding key is provided', async () => {
    const senderTxs = await fetchAndUnblindTxs(
      [senderAddress],
      senderBlindKeyGetter,
      APIURL
    );

    const faucetTx = senderTxs.find(t => t.txid === txid);
    assert.notStrictEqual(faucetTx, undefined);
  });

  it('should skip transaction specified by skip function (and does not return it)', async () => {
    const senderTxs = await fetchAndUnblindTxs(
      [senderAddress],
      senderBlindKeyGetter,
      APIURL,
      tx => tx.txid === txid
    );

    const faucetTx = senderTxs.find(t => t.txid === txid);
    assert.strictEqual(faucetTx, undefined);
  });
});