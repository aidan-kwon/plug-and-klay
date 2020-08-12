import { errorReducer } from './error'
import { networkReducer } from './network'
import { txMetadataReducer } from './txMetadata'
import { compilationReducer } from './compilation'
import { deployedReducer } from './deployed'
import { combineReducers } from 'redux'
import contractReducer from './contract'
import popupReducer from './popup'

const reducers = combineReducers({
    error: errorReducer,
    network: networkReducer,
    txMetadata: txMetadataReducer,
    compilation: compilationReducer,
    deployed: deployedReducer,
    contract: contractReducer,
    popup: popupReducer
  })

export default reducers