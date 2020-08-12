import LogsManager from './logsManager'
const Caver = require('caver-js')
const EventManager = require('./EventManager')

let web3
if (typeof window !== 'undefined' && typeof window.caver !== 'undefined') {
  var injectedProvider = window.caver.currentProvider
  web3 = new Caver(injectedProvider)

  console.log('init from injected')
} else {
  web3 = new Caver(new Caver.providers.HttpProvider('http://localhost:8545'))
}

web3.eth = new Proxy(web3.klay, {})

const blankWeb3 = new Caver()

const mainNetGenesisHash = '0xc72e5293c3c3ba38ed8ae910f780e4caaa9fb95e79784f7ab74c3c262ea7137e'

/*
  trigger contextChanged, web3EndpointChanged
*/
function ExecutionContext () {
  this.event = new EventManager()

  this.logsManager = new LogsManager()

  let executionContext = null

  this.blockGasLimitDefault = 4300000
  this.blockGasLimit = this.blockGasLimitDefault
  this.customNetWorks = {}
  this.blocks = {}
  this.latestBlockNumber = 0
  this.txs = {}

  this.init = function (config) {
    executionContext = injectedProvider ? 'injected' : 'ken'
    if (executionContext === 'injected') this.askPermission()
  }

  this.askPermission = function () {
    // kaikas
    if (window.klaytn && typeof window.klaytn.enable === 'function') window.klaytn.enable()
  }

  this.getProvider = function () {
    return executionContext
  }

  this.web3 = function () {
    return web3
  }

  this.caver = function () {
    return web3
  }

  this.detectNetwork = function (callback) {
    web3.klay.net.getId((err, id) => {
      let name = null
      if (err) name = 'Unknown'
      // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
      else if (id === 8217) name = 'Cypress'
      else if (id === 1001) name = 'Baobab'
      else name = 'Custom'

      if (id === '8217') {
        web3.klay.getBlock(0, (error, block) => {
          if (error) console.log('cant query first block')
          if (block && block.hash !== mainNetGenesisHash) name = 'Custom'
          callback(err, { id, name })
        })
      } else {
        callback(err, { id, name })
      }
    })
  }

  this.removeProvider = (name) => {
    if (name && this.customNetWorks[name]) {
      delete this.customNetWorks[name]
      this.event.trigger('removeProvider', [name])
    }
  }

  this.addProvider = (network) => {
    if (network && network.name && network.url) {
      this.customNetWorks[network.name] = network
      this.event.trigger('addProvider', [network])
    }
  }

  this.isVM = () => {
    return false
  }

  this.internalWeb3 = () => {
    return web3
  }

  this.blankWeb3 = () => {
    return blankWeb3
  }

  this.setContext = (context, endPointUrl, confirmCb, infoCb) => {
    executionContext = context
    this.executionContextChange(context, endPointUrl, confirmCb, infoCb)
  }

  this.executionContextChange = (context, endPointUrl, confirmCb, infoCb, cb) => {
    if (!cb) cb = () => {}

    if (context === 'injected') {
      if (injectedProvider === undefined) {
        infoCb('No injected Caver provider found. Make sure your provider (Kaikas) is active and running (when recently activated you may have to reload the page).')
        return cb()
      } else {
        this.askPermission()
        executionContext = context
        web3.setProvider(injectedProvider)
        this._updateBlockGasLimit()
        this.event.trigger('contextChanged', ['injected'])
        return cb()
      }
    }

    if (context === 'caver') {
      confirmCb(cb)
    }

    if (this.customNetWorks[context]) {
      var provider = this.customNetWorks[context]
      setProviderFromEndpoint(provider.url, 'caver', () => { cb() })
    }
  }

  this.currentblockGasLimit = () => {
    return this.blockGasLimit
  }

  this.stopListenOnLastBlock = () => {
    if (this.listenOnLastBlockId) clearInterval(this.listenOnLastBlockId)
    this.listenOnLastBlockId = null
  }

  this._updateBlockGasLimit = () => {
    web3.klay.getBlock('latest', (err, block) => {
      if (!err) {
        // we can't use the blockGasLimit cause the next blocks could have a lower limit : https://github.com/ethereum/remix/issues/506
        this.blockGasLimit = (block && block.gasLimit) ? Math.floor(block.gasLimit - (5 * block.gasLimit) / 1024) : this.blockGasLimitDefault
      } else {
        this.blockGasLimit = this.blockGasLimitDefault
      }
    })
  }

  this.listenOnLastBlock = () => {
    this.listenOnLastBlockId = setInterval(() => {
      this._updateBlockGasLimit()
    }, 15000)
  }

  // TODO: remove this when this function is moved
  const self = this
  // TODO: not used here anymore and needs to be moved
  function setProviderFromEndpoint (endpoint, context, cb) {
    const oldProvider = web3.currentProvider

    if (endpoint === 'ipc') {
      web3.setProvider(new web3.providers.IpcProvider())
    } else {
      web3.setProvider(new web3.providers.HttpProvider(endpoint))
    }
    web3.klay.net.isListening((err, isConnected) => {
      if (!err && isConnected) {
        executionContext = context
        self._updateBlockGasLimit()
        self.event.trigger('contextChanged', ['caver'])
        self.event.trigger('caver3EndpointChanged')
        cb()
      } else {
        web3.setProvider(oldProvider)
        cb('Not possible to connect to the Caver provider. Make sure the provider is running and a connection is open (via IPC or RPC).')
      }
    })
  }
  this.setProviderFromEndpoint = setProviderFromEndpoint

  this.txDetailsLink = (network, hash) => {
    if (transactionDetailsLinks[network]) {
      return transactionDetailsLinks[network] + hash
    }
  }

  this.addBlock = (block) => {
    let blockNumber = '0x' + block.header.number.toString('hex')
    if (blockNumber === '0x') {
      blockNumber = '0x0'
    }
    blockNumber = web3.utils.toHex(web3.utils.toBN(blockNumber))

    this.blocks['0x' + block.hash().toString('hex')] = block
    this.blocks[blockNumber] = block
    this.latestBlockNumber = blockNumber

    this.logsManager.checkBlock(blockNumber, block, this.web3())
  }

  this.trackTx = (tx, block) => {
    this.txs[tx] = block
  }
}

const transactionDetailsLinks = {
  'Cypress': 'https://scope.klaytn.com/tx/',
  'Baobab': 'https://baobab.scope.klaytn.com/tx/'
}

const executionContext = new ExecutionContext()

export default executionContext
