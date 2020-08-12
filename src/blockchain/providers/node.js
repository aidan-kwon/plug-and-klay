const Caver = require('caver-js')
const { stripHexPrefix, hashPersonalMessage } = require('ethereumjs-util')

class NodeProvider {

  constructor (executionContext, config) {
    this.executionContext = executionContext
    this.config = config
  }

  personal () {
    return this.executionContext.caver().klay.personal
  }
  
  getAccounts (cb) {
    if (this.config.get('settings/personal-mode')) {
      return this.personal().getListAccounts(cb)
    }
    return this.executionContext.caver().klay.getAccounts(cb)
  }

  newAccount (passwordPromptCb, cb) {
    if (!this.config.get('settings/personal-mode')) {
      return cb('Not running in personal mode')
    }
    passwordPromptCb((passphrase) => {
      this.personal().newAccount(passphrase, cb)
    })
  }

  resetEnvironment () {
  }

  getBalanceInKlay (address, cb) {
    address = stripHexPrefix(address)
    this.executionContext.caver().klay.getBalance(address, (err, res) => {
      if (err) {
        return cb(err)
      }
      cb(null, Caver.utils.fromPeb(res.toString(10), 'KLAY'))
    })
  }

  getGasPrice (cb) {
    this.executionContext.caver().klay.getGasPrice(cb)
  }

  signMessage (message, account, passphrase, cb) {
    const messageHash = hashPersonalMessage(Buffer.from(message))
    try {
      const personal = this.personal()
      personal.sign(message, account, passphrase, (error, signedData) => {
        cb(error, '0x' + messageHash.toString('hex'), signedData)
      })
    } catch (e) {
      cb(e.message)
    }
  }

  getProvider () {
    return this.executionContext.getProvider()
  }
}

module.exports = NodeProvider
