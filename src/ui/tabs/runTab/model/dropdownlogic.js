import CompilerAbstract from '../../../../compiler/compiler-abstract'
import store from '../../../../redux/store'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { newContractCompiled as newEventAction } from '../../../../redux/actions/contract'
import { NEW_CONTRACT_COMPILED } from '../../../../redux/actions/actionTypes'

var ethJSUtil = require('ethereumjs-util')
var remixLib = require('remix-lib')
var txHelper = remixLib.execution.txHelper
var EventManager = remixLib.EventManager

class DropdownLogic {
  constructor (compilersArtefacts, config, editor, runView) {
    // global.artefacts = compilersArtefacts
    this.config = config
    this.editor = editor
    this.runView = runView

    console.log(global.artefacts)
    this.event = new EventManager()

    this.listenToCompilationEvents()
  }

  // TODO: can be moved up; the event in contractDropdown will have to refactored a method instead
  listenToCompilationEvents () {
    let broadcastCompilationResult = (file, source, languageVersion, data) => {
      // TODO check whether the tabs is configured
      console.log({
        data,
        source
      })
      let compiler = new CompilerAbstract(data, source)
      global.artefacts.compilersArtefacts[languageVersion] = compiler
      global.artefacts.compilersArtefacts['__last'] = compiler



      setTimeout(() => {
        store.dispatch({
          type: NEW_CONTRACT_COMPILED,
          payload: {
            success: true,
            data,
            source,
            compiler,
            compilerFullName: languageVersion,
            file
          }
        })
      })
      // this.event.trigger('newlyCompiled', [true, data, source, compiler, languageVersion, file])
    }

    // this.runView.on('solidity', 'compilationFinished', (file, source, languageVersion, data) =>
    //   broadcastCompilationResult(file, source, languageVersion, data)
    // )
    // this.runView.on('vyper', 'compilationFinished', (file, source, languageVersion, data) =>
    //   broadcastCompilationResult(file, source, languageVersion, data)
    // )
    // this.runView.on('lexon', 'compilationFinished', (file, source, languageVersion, data) =>
    //   broadcastCompilationResult(file, source, languageVersion, data)
    // )
    global.client.solidity.on('compilationFinished', (file, source, languageVersion, data) =>
      broadcastCompilationResult(file, source, languageVersion, data)
    )
  }

  loadContractFromAddress (address, contract, confirmCb, cb) {
    if (!address.startsWith('0x') || !ethJSUtil.isValidAddress(address)) {
      return cb('Invalid address.')
    }
    if (/[a-f]/.test(address) && /[A-F]/.test(address) && !ethJSUtil.isValidChecksumAddress(address)) {
      return cb('Invalid checksum address.')
    }

    cb(null, 'instance')
    // confirmCb(() => {
    //   if (!contract.abi || !contract.abi.length) {
    //     return cb('Failed to parse the current file as JSON ABI.')
    //   }
    //
    //   // cb(null, 'abi', contract.abi)
    //   cb(null, 'instance')
    // })
    // if (/.(.abi)$/.exec(this.config.get('currentFile'))) {
    //   confirmCb(() => {
    //     var abi
    //     try {
    //       abi = JSON.parse(this.editor.currentContent())
    //     } catch (e) {
    //       return cb('Failed to parse the current file as JSON ABI.')
    //     }
    //     cb(null, 'abi', abi)
    //   })
    // } else {
    //   cb(null, 'instance')
    // }
  }

  deployMetadataOf (blockchain, contractName) {
    return new Promise((resolve, reject) => {
      blockchain.detectNetwork( async (err, { id, name } = {}) => {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          try {
            var path = await global.client.fileManager.getCurrentFile()

            console.log('currnet file: ', path)
            var fileName = path + '/artifacts/' + contractName + '.json'
            console.log('file path: ', fileName)
            const content = await global.client.fileManager.getFile(path)

            if (!content) return resolve()

            try {
              var metadata = JSON.parse(content)
              metadata = metadata.deploy || {}
              return resolve(metadata[name + ':' + id] || metadata[name] || metadata[id] || metadata[name.toLowerCase() + ':' + id] || metadata[name.toLowerCase()])
            } catch (e) {
              reject(e.message)
            }
          } catch (e) {
            return reject(e)
          }
        }
      })
    })
  }

  getCompiledContracts (compiler, compilerFullName) {
    var contracts = []
    compiler.visitContracts((contract) => {
      contracts.push(contract)
    })
    return contracts
  }

  getSelectedContract (contractName, compiler) {
    if (!contractName) return null

    // var compiler = global.artefacts[compilerAtributeName]
    if (!compiler) return null

    var contract = compiler.getContract(contractName)

    return {
      name: contractName,
      contract: contract,
      compiler: compiler,
      abi: contract.object.abi,
      bytecodeObject: contract.object.evm.bytecode.object,
      bytecodeLinkReferences: contract.object.evm.bytecode.linkReferences,
      object: contract.object,
      deployedBytecode: contract.object.evm.deployedBytecode,
      getConstructorInterface: () => {
        return txHelper.getConstructorInterface(contract.object.abi)
      },
      getConstructorInputs: () => {
        var constructorInteface = txHelper.getConstructorInterface(contract.object.abi)
        return txHelper.inputParametersDeclarationToString(constructorInteface.inputs)
      },
      isOverSizeLimit: () => {
        var deployedBytecode = contract.object.evm.deployedBytecode
        return (deployedBytecode && deployedBytecode.object.length / 2 > 24576)
      },
      metadata: contract.object.metadata
    }
  }

  getCompilerContracts () {
    return global.artefacts.compilersArtefacts['__last'].getData().contracts
  }

}

export default DropdownLogic
// const mapDispatchToProps = (dispatch: Dispatch) => ({
//   newContractCompiled: (contract: CompiledContract) => dispatch(newEventAction(contract))
//   // change: (pin, newPin) => dispatch(changeAction(pin, newPin)),
//   // dismiss: (name) => dispatch(dismissAction(name)),
// })
//
// export default connect(
//   null,
//   mapDispatchToProps,
// )(DropdownLogic)
