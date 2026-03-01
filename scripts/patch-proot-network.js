#!/usr/bin/env node
/**
 * Proot/Android workaround: os.networkInterfaces() throws uv_interface_addresses
 * error 13 inside proot. Clawdbot gateway calls it at startup and crashes.
 *
 * Additionally, --bind lan relies on os.networkInterfaces() to find a LAN address.
 * Since that fails in proot, the gateway falls back to 127.0.0.1. We patch
 * net.Server.listen to force 0.0.0.0 when BIND_LAN=1.
 *
 * Load with: NODE_OPTIONS="--require ./scripts/patch-proot-network.js"
 */
const os = require('os');
const net = require('net');

const origNI = os.networkInterfaces;
if (typeof origNI === 'function') {
  os.networkInterfaces = function networkInterfaces() {
    try {
      return origNI.call(os);
    } catch (e) {
      return {
        lo: [{ address: '127.0.0.1', netmask: '255.0.0.0', family: 'IPv4', mac: '00:00:00:00:00:00', internal: true, cidr: '127.0.0.1/8' }]
      };
    }
  };
}

if (process.env.BIND_LAN === '1') {
  const origListen = net.Server.prototype.listen;
  net.Server.prototype.listen = function patchedListen(...args) {
    if (args.length >= 1 && typeof args[0] === 'object' && args[0] !== null) {
      const opts = args[0];
      if (opts.host === '127.0.0.1' || opts.host === 'localhost' || opts.host === '::1') {
        opts.host = '::';
      }
    } else if (args.length >= 2 && typeof args[0] === 'number' && typeof args[1] === 'string') {
      if (args[1] === '127.0.0.1' || args[1] === 'localhost' || args[1] === '::1') {
        args[1] = '::';
      }
    }
    return origListen.apply(this, args);
  };
}
