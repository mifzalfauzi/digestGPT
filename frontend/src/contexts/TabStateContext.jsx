import React, { createContext, useContext, useReducer, useCallback } from 'react'

const TabStateContext = createContext()

const TAB_STATE_ACTION_TYPES = {
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_SCROLL_POSITION: 'SET_SCROLL_POSITION',
  SET_EXPANDED_ELEMENTS: 'SET_EXPANDED_ELEMENTS',
  SET_SELECTED_ITEMS: 'SET_SELECTED_ITEMS',
  SET_PAGINATION_STATE: 'SET_PAGINATION_STATE',
  SET_HIGHLIGHT_STATE: 'SET_HIGHLIGHT_STATE',
  SAVE_TAB_STATE: 'SAVE_TAB_STATE',
  RESTORE_TAB_STATE: 'RESTORE_TAB_STATE',
  CLEAR_TAB_STATE: 'CLEAR_TAB_STATE'
}

const initialState = {
  activeTab: 'analysis',
  tabStates: {
    analysis: {
      scrollPosition: 0,
      expandedElements: new Set(),
      selectedItems: new Set(),
      highlightState: null
    },
    swot: {
      scrollPosition: 0,
      expandedElements: new Set(),
      selectedItems: new Set(),
      paginationState: {
        strengths: 0,
        weaknesses: 0,
        opportunities: 0,
        threats: 0
      },
      copiedItems: new Set(),
      itemRatings: {}
    },
    insights: {
      scrollPosition: 0,
      expandedElements: new Set(),
      selectedItems: new Set(),
      currentInsightIndex: 0,
      currentRiskIndex: 0,
      activeHighlight: null,
      copiedItem: null,
      feedbackGiven: {}
    },
    'document-viewer': {
      scrollPosition: 0,
      zoomLevel: 1,
      currentPage: 1
    },
    document: {
      scrollPosition: 0,
      expandedElements: new Set(),
      selectedItems: new Set(),
      activeHighlight: null,
      highlights: []
    }
  }
}

function tabStateReducer(state, action) {
  switch (action.type) {
    case TAB_STATE_ACTION_TYPES.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload
      }

    case TAB_STATE_ACTION_TYPES.SAVE_TAB_STATE:
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          [action.payload.tabId]: {
            ...state.tabStates[action.payload.tabId],
            ...action.payload.state
          }
        }
      }

    case TAB_STATE_ACTION_TYPES.RESTORE_TAB_STATE:
      return {
        ...state,
        activeTab: action.payload.tabId,
        currentTabState: state.tabStates[action.payload.tabId] || {}
      }

    case TAB_STATE_ACTION_TYPES.SET_SCROLL_POSITION:
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          [action.payload.tabId]: {
            ...state.tabStates[action.payload.tabId],
            scrollPosition: action.payload.position
          }
        }
      }

    case TAB_STATE_ACTION_TYPES.SET_EXPANDED_ELEMENTS:
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          [action.payload.tabId]: {
            ...state.tabStates[action.payload.tabId],
            expandedElements: new Set(action.payload.elements)
          }
        }
      }

    case TAB_STATE_ACTION_TYPES.SET_SELECTED_ITEMS:
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          [action.payload.tabId]: {
            ...state.tabStates[action.payload.tabId],
            selectedItems: new Set(action.payload.items)
          }
        }
      }

    case TAB_STATE_ACTION_TYPES.SET_PAGINATION_STATE:
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          [action.payload.tabId]: {
            ...state.tabStates[action.payload.tabId],
            paginationState: {
              ...state.tabStates[action.payload.tabId]?.paginationState,
              ...action.payload.paginationState
            }
          }
        }
      }

    case TAB_STATE_ACTION_TYPES.SET_HIGHLIGHT_STATE:
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          [action.payload.tabId]: {
            ...state.tabStates[action.payload.tabId],
            ...action.payload.highlightState
          }
        }
      }

    case TAB_STATE_ACTION_TYPES.CLEAR_TAB_STATE:
      return {
        ...state,
        tabStates: {
          ...state.tabStates,
          [action.payload.tabId]: {
            ...initialState.tabStates[action.payload.tabId]
          }
        }
      }

    default:
      return state
  }
}

export function TabStateProvider({ children }) {
  const [state, dispatch] = useReducer(tabStateReducer, initialState)

  const saveTabState = useCallback((tabId, tabState) => {
    dispatch({
      type: TAB_STATE_ACTION_TYPES.SAVE_TAB_STATE,
      payload: { tabId, state: tabState }
    })
  }, [])

  const restoreTabState = useCallback((tabId) => {
    dispatch({
      type: TAB_STATE_ACTION_TYPES.RESTORE_TAB_STATE,
      payload: { tabId }
    })
    return state.tabStates[tabId] || {}
  }, [state.tabStates])

  const setActiveTab = useCallback((tabId) => {
    dispatch({
      type: TAB_STATE_ACTION_TYPES.SET_ACTIVE_TAB,
      payload: tabId
    })
  }, [])

  const setScrollPosition = useCallback((tabId, position) => {
    dispatch({
      type: TAB_STATE_ACTION_TYPES.SET_SCROLL_POSITION,
      payload: { tabId, position }
    })
  }, [])

  const setExpandedElements = useCallback((tabId, elements) => {
    dispatch({
      type: TAB_STATE_ACTION_TYPES.SET_EXPANDED_ELEMENTS,
      payload: { tabId, elements }
    })
  }, [])

  const setSelectedItems = useCallback((tabId, items) => {
    dispatch({
      type: TAB_STATE_ACTION_TYPES.SET_SELECTED_ITEMS,
      payload: { tabId, items }
    })
  }, [])

  const setPaginationState = useCallback((tabId, paginationState) => {
    dispatch({
      type: TAB_STATE_ACTION_TYPES.SET_PAGINATION_STATE,
      payload: { tabId, paginationState }
    })
  }, [])

  const setHighlightState = useCallback((tabId, highlightState) => {
    dispatch({
      type: TAB_STATE_ACTION_TYPES.SET_HIGHLIGHT_STATE,
      payload: { tabId, highlightState }
    })
  }, [])

  const clearTabState = useCallback((tabId) => {
    dispatch({
      type: TAB_STATE_ACTION_TYPES.CLEAR_TAB_STATE,
      payload: { tabId }
    })
  }, [])

  const getTabState = useCallback((tabId) => {
    return state.tabStates[tabId] || {}
  }, [state.tabStates])

  const contextValue = {
    activeTab: state.activeTab,
    tabStates: state.tabStates,
    saveTabState,
    restoreTabState,
    setActiveTab,
    setScrollPosition,
    setExpandedElements,
    setSelectedItems,
    setPaginationState,
    setHighlightState,
    clearTabState,
    getTabState
  }

  return (
    <TabStateContext.Provider value={contextValue}>
      {children}
    </TabStateContext.Provider>
  )
}

export function useTabState() {
  const context = useContext(TabStateContext)
  if (!context) {
    throw new Error('useTabState must be used within a TabStateProvider')
  }
  return context
}

export { TAB_STATE_ACTION_TYPES }