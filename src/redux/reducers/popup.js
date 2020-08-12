// @flow
import {
  DISMISS_POPUP,
  DISMISS_POPUP_FAILED,
  DISMISS_POPUP_SUCCESS,
  DISPLAY_ALERT_MODAL,
  DISPLAY_CONFIRM_MODAL,
  DISPLAY_POPUP,
  DISPLAY_POPUP_FAILED,
  DISPLAY_POPUP_SUCCESS
} from '../actions/actionTypes'

const initializeState = {
  name: '',
  enabled: false,
  component: {},
  params: {}
}

const popupReducer = (state: PopupReducer = initializeState, action: Action) => {
  switch (action.type) {
    case DISPLAY_POPUP:
      return {
        ...state
      }
    case DISPLAY_POPUP_SUCCESS:
      return {
        ...state,
        ...action.payload,
        enabled: true
      }
    case DISPLAY_POPUP_FAILED:
      return {
        ...state,
        enabled: false,
        component: {},
        name: '',
        params: {},
      }
    case DISMISS_POPUP:
      return {
        ...state
      }
    case DISMISS_POPUP_SUCCESS:
      return {
        ...state,
        enabled: false,
        params: {},
        component: {},
        name: ''
      }
    case DISMISS_POPUP_FAILED:
      return {
        ...state
      }
    case DISPLAY_ALERT_MODAL:
      return {
        ...state,
        params: action.payload
      }
    case DISPLAY_CONFIRM_MODAL:
      return {
        ...state,
        params: action.payload
      }
    default:
      return state
  }
}

export default popupReducer