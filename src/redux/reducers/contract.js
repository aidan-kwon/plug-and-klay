// @flow
import {
  CLEAR_CONTRACT_INSTANCE,
  NEW_CONTRACT_COMPILED,
  NEW_CONTRACT_INSTANCE,
  REMOVE_CONTRACT_INSTANCE
} from '../actions/actionTypes'

const initializeState = {
  contracts: [],
  raws: [],
  instances: [],
  newlyCompiled: {},
  updatedAt: {
    contracts: new Date().getTime(),
    instances: new Date().getTime()
  }
}

const contractReducer = (state: ContractReducer = initializeState, action: Action) => {
  switch (action.type) {
    case NEW_CONTRACT_COMPILED:

      const key = Object.keys(action.payload.data.contracts)[0]
      let newContracts = Object.entries(Object.values(action.payload.data.contracts)[0]).map((value, idx) => { return { ...value[1], name: value[0], compiler: action.payload.compiler, fileName: key } })

      return {
        ...state,
        raws: [
          action.payload
        ],
        newlyCompiled: newContracts[0],
        contracts: [
          ...newContracts
        ],
        updatedAt: {
          ...state.updatedAt,
          contracts: new Date().getTime()
        }
      }
    case NEW_CONTRACT_INSTANCE:
      return {
        ...state,
        instances: [
          ...state.instances,
          {
            ...action.payload,
            created: new Date().getTime()
          }
        ],
        updatedAt: {
          ...state.updatedAt,
          instances: new Date().getTime()
        }
      }
    case REMOVE_CONTRACT_INSTANCE:
      return {
        ...state,
        instances: state.instances.filter(it => (it.address !== action.payload.address.toLowerCase()) || it.created !== action.payload.created),
        updatedAt: {
          ...state.updatedAt,
          instances: new Date().getTime()
        }
      }
    case CLEAR_CONTRACT_INSTANCE:
      return {
        ...state,
        instances: [],
        updatedAt: {
          ...state.updatedAt,
          instances: new Date().getTime()
        }
      }
    // case DISPLAY_POPUP:
    //   return {
    //     ...state
    //   }
    // case DISPLAY_POPUP_SUCCESS:
    //   return {
    //     ...state,
    //     ...action.payload,
    //     enabled: true
    //   }
    // case DISPLAY_POPUP_FAILED:
    //   return {
    //     ...state,
    //     enabled: false,
    //     component: {},
    //     name: '',
    //     params: {},
    //   }
    // case DISMISS_POPUP:
    //   return {
    //     ...state
    //   }
    // case DISMISS_POPUP_SUCCESS:
    //   return {
    //     ...state,
    //     enabled: false,
    //     params: {},
    //     component: {},
    //     name: ''
    //   }
    // case DISMISS_POPUP_FAILED:
    //   return {
    //     ...state
    //   }
    // case DISPLAY_ALERT_MODAL:
    //   return {
    //     ...state,
    //     params: action.payload
    //   }
    // case DISPLAY_CONFIRM_MODAL:
    //   return {
    //     ...state,
    //     params: action.payload
    //   }
    default:
      return state
  }
}

export default contractReducer